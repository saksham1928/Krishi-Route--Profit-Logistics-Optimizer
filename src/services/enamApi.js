/**
 * Fetches live crop prices from the eNAM API for a specific state.
 */
export const fetchLivePrices = async (stateName, commodityName) => {
  // 1. Get dates for the last 7 days to catch more market activity
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7); // Go back 7 days

  const toDateFormatted = today.toISOString().split('T')[0];
  const fromDateFormatted = lastWeek.toISOString().split('T')[0];

  const formData = new FormData();
  formData.append('language', 'en');
  formData.append('stateName', stateName.toUpperCase());
  formData.append('apmcName', '-- Select APMCs --'); 
  
  const cropToFetch = commodityName ? commodityName.toUpperCase() : '-- Select Commodity --';
  formData.append('commodityName', cropToFetch);
  
  // Use our new 7-day window!
  formData.append('fromDate', fromDateFormatted);
  formData.append('toDate', toDateFormatted);

  try {
    // 3. Make the actual network request
    // REPLACE 'YOUR_BASE_URL' with the actual URL your instructors gave you!
    const response = await fetch('/web/Ajax_ctrl/trade_data_list', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const json = await response.json();
    
    // 4. Return the array of crop data
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