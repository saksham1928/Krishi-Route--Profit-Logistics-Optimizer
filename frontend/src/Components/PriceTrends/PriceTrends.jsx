import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPriceTrends } from '../../services/enamApi';

const PriceTrends = ({ stateName, cropName, mandiName }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getTrends = async () => {
      setLoading(true);
      try {
        const historyData = await fetchPriceTrends(stateName, cropName, mandiName);
        
        // Format the dates nicely for the X-Axis
        const formattedData = historyData.map(item => ({
          ...item,
          displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));
        
        setData(formattedData);
      } catch (err) {
        setError('Could not load trend data.');
      } finally {
        setLoading(false);
      }
    };

    getTrends();
  }, [stateName, cropName, mandiName]);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#1e8e3e' }}>Loading 30-day market intelligence...</div>;
  if (error) return <div style={{ padding: '20px', textAlign: 'center', color: '#d93025' }}>{error}</div>;
  if (data.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: '#5f6368' }}>No historical data available for this market yet.</div>;

// TREND LOGIC 

// Calculate the Overall Historical Baseline
const totalSum = data.reduce((sum, item) => sum + item.modalPrice, 0);
const overallAverage = totalSum / data.length;

// Calculate the Recent Momentum (Last 5 days) to smooth out daily spikes
const recentDays = data.slice(-5);
const recentSum = recentDays.reduce((sum, item) => sum + item.modalPrice, 0);
const recentAverage = recentSum / recentDays.length;

// The Verdict: Is this week's momentum beating the historical average?
const isTrendingUp = recentAverage >= overallAverage;

  return (
    <div style={{ padding: '20px', backgroundColor: '#f8fdf9', borderTop: '1px solid #e0e0e0', marginTop: '15px', borderRadius: '0 0 8px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h4 style={{ margin: 0, color: '#202124' }}>30-Day Price Trend ({cropName})</h4>
        <span style={{ 
          padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold',
          backgroundColor: isTrendingUp ? '#e6f4ea' : '#fce8e6',
          color: isTrendingUp ? '#1e8e3e' : '#d93025'
        }}>
          {isTrendingUp ? 'Trending Upward' : 'Trending Downward'}
        </span>
      </div>

      <div style={{ height: '250px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
            <XAxis dataKey="displayDate" tick={{fontSize: 12, fill: '#5f6368'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize: 12, fill: '#5f6368'}} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
            <Tooltip 
              formatter={(value) => [`₹${value}`, 'Avg Price']}
              labelStyle={{ color: '#202124', fontWeight: 'bold' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Line 
              type="monotone" 
              dataKey="modalPrice" 
              stroke={isTrendingUp ? '#34a853' : '#ea4335'} 
              strokeWidth={3} 
              dot={{ r: 4, fill: isTrendingUp ? '#34a853' : '#ea4335', strokeWidth: 0 }} 
              activeDot={{ r: 6 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceTrends;