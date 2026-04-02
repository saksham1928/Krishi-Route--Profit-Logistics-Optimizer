const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const PriceHistory = require('./models/PriceHistory');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('Krishi-Route Smart Data Engine is running.');
});

// lazy update pipeline 
app.post('/api/trends', async (req, res) => {
  try {
    const { stateName, cropName, mandiName } = req.body;

    if (!stateName || !cropName || !mandiName) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log(`Request received for ${cropName} at ${mandiName}, ${stateName}`);

    //Check MongoDB for the latest record
    const latestRecord = await PriceHistory.findOne({
      state: stateName,
      cropName: cropName,
      mandiName: mandiName
    }).sort({ date: -1 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let needsUpdate = true;

    //The Date Math (fresh?)
    if (latestRecord) {
      const recordDate = new Date(latestRecord.date);
      const diffTime = Math.abs(today - recordDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If data is less than 2 days old, its fresh enough
      if (diffDays <= 2) {
        needsUpdate = false;
      }
    }

    //CACHE HIT 
    if (!needsUpdate) {
      console.log('CACHE HIT: Returning fast data from MongoDB');
      const historicalData = await PriceHistory.find({
        state: stateName,
        cropName: cropName,
        mandiName: mandiName
      }).sort({ date: 1 }); // Sorted oldest to newest for Chart.js
      
      return res.json(historicalData);
    }

    //CACHE MISS or STALE - Fetch 30 days from eNAM
    console.log('CACHE MISS/STALE: Fetching 30 days from eNAM API...');
    
    // Calculate 60-day window
    const toDate = new Date().toISOString().split('T')[0];
    const fromDateObj = new Date();
    fromDateObj.setDate(fromDateObj.getDate() -60);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    // Build the exact payload eNAM expects
    const params = new URLSearchParams();
    params.append('stateName', stateName);
    params.append('apmcName', mandiName);
    params.append('commodityName', cropName);
    params.append('fromDate', fromDate);
    params.append('toDate', toDate);

    const enamResponse = await axios.post(
      'https://enam.gov.in/web/Ajax_ctrl/trade_data_list',
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tradeData = enamResponse.data.data || [];

    if (tradeData.length === 0) {
      console.log('eNAM returned no data. Returning whatever is left in DB.');
      const fallbackData = await PriceHistory.find({ state: stateName, cropName: cropName, mandiName: mandiName }).sort({ date: 1 });
      return res.json(fallbackData);
    }

    //Format and Bulk Upsert into MongoDB
    console.log(`Saving ${tradeData.length} new records to database...`);
    
    // eNAM API often returns dates in DD-MM-YYYY format, which breaks MongoDB. 
    // This helper function flips it to YYYY-MM-DD so the database accepts it.
    const parseEnamDate = (dateString) => {
      if (!dateString) return new Date();
      if (dateString.includes('-') || dateString.includes('/')) {
        const parts = dateString.split(/[-/]/);
        if (parts[0].length <= 2) { 
          // If it starts with Day, flip to YYYY-MM-DD
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`);
        }
      }
      return new Date(dateString); // Fallback
    };

    const bulkOps = tradeData.map(trade => {
      // eNAM sometimes names the date field differently depending on the endpoint
      const rawDate = trade.reported_date || trade.created_at || trade.arrival_date || new Date().toISOString();
      
      return {
        updateOne: {
          filter: {
            state: stateName,
            mandiName: mandiName,
            cropName: cropName,
            date: parseEnamDate(rawDate)
          },
          update: {
            $set: {
              minPrice: parseFloat(trade.min_price || 0),
              modalPrice: parseFloat(trade.modal_price || 0)
            }
          },
          upsert: true
        }
      };
    });

    await PriceHistory.bulkWrite(bulkOps);

    //Return the newly updated DB data
    const updatedData = await PriceHistory.find({
      state: stateName,
      cropName: cropName,
      mandiName: mandiName
    }).sort({ date: 1 });

    console.log('Update complete. Sending data to frontend.');
    res.json(updatedData);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});