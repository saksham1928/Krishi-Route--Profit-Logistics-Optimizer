/**
 * Fetches live crop prices from the eNAM API for a specific state.
 */
export const fetchLivePrices = async (stateName, commodityName) => {
  // Get dates for the last 40 days to catch more market activity
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 40); 

  const toDateFormatted = today.toISOString().split('T')[0];
  const fromDateFormatted = lastWeek.toISOString().split('T')[0];

  const formData = new FormData();
  formData.append('language', 'en');
  formData.append('stateName', stateName.toUpperCase());
  formData.append('apmcName', '-- Select APMCs --'); 
  
  const cropToFetch = commodityName ? commodityName.toUpperCase() : '-- Select Commodity --';
  formData.append('commodityName', cropToFetch);
  
  // Use 30-day window
  formData.append('fromDate', fromDateFormatted);
  formData.append('toDate', toDateFormatted);

  try {
    // Make the actual network request
    const response = await fetch('/web/Ajax_ctrl/trade_data_list', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const json = await response.json();
    
    // Return the array of crop data
    if (json && json.data) {
      return json.data; 
    } else {
      return []; // Return empty array if no data found
    }
    
  } catch (error) {
    console.error("Failed to fetch from eNAM:", error);
    throw error;
  }
};

//Fetch Historical Trends from our Custom Backend
export const fetchPriceTrends = async (stateName, cropName, mandiName) => {
  try {
    // Calling our new Smart Node.js Backend
    const response = await fetch('http://localhost:5000/api/trends', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stateName, cropName, mandiName })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch historical trends');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Trend Fetch Error:", error);
    throw error;
  }
};