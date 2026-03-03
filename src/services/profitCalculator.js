import mockData from '../data/mockData.json';
import mandiCoordinates from '../data/mandiCoordinates.json';

// --- The Haversine Formula ---
// Calculates exact straight-line distance in km between two GPS points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); 
};

export const calculateProfitability = (tripData, liveData = null) => {
  const { crop, quantity, unit, vehicle, location } = tripData;

  const selectedVehicle = mockData.vehicles.find(v => v.type === vehicle);
  if (!selectedVehicle) throw new Error('Invalid vehicle selected');

  const selectedCrop = mockData.crops.find(c => c.type === crop);
  if (!selectedCrop) throw new Error('Invalid crop selected');

  let quantityInQuintals = parseFloat(quantity);
  if (unit === 'ton') quantityInQuintals = quantityInQuintals * 10;
  else if (unit === 'kg') quantityInQuintals = quantityInQuintals / 100;

  // Assuming you are in Jodhpur (since we know you tested from Rajasthan)
  // For a true production app, you would pass the actual Geolocation coords here from Dashboard.jsx
  const userLat = 26.2389;
  const userLng = 73.0243; 

  let mandiResults = [];

  if (liveData && liveData.length > 0) {
    liveData.forEach((enamItem, index) => {
      // 1. Look up the Mandi's real coordinates from our new JSON dictionary
      const stateData = mandiCoordinates[enamItem.state];
      const mandiCoords = stateData ? stateData[enamItem.apmc] : null;

      // 2. If we don't have the coordinates in our file, skip this mandi!
      // This prevents errors and ensures the map only plots what it knows.
      if (!mandiCoords) return; 

      const marketPrice = parseFloat(enamItem.modal_price) || parseFloat(enamItem.min_price);
      
      // 3. REAL MATH: Calculate exact distance using Haversine
      const distance = calculateDistance(userLat, userLng, mandiCoords.lat, mandiCoords.lng);

      // Prevent division by 0 if distance is 0
      const safeDistance = distance === 0 ? 1 : distance;

      const revenue = marketPrice * quantityInQuintals;
      const transportCost = safeDistance * selectedVehicle.ratePerKm;
      const handlingCost = 500; 
      const totalCosts = transportCost + handlingCost;
      const netProfit = revenue - totalCosts;

      mandiResults.push({
        id: enamItem.id || `mandi_${index}`,
        name: enamItem.apmc,
        location: enamItem.state,
        district: enamItem.apmc,
        coordinates: mandiCoords,
        distance: safeDistance,
        marketPrice: marketPrice,
        revenue: revenue,
        costs: {
          transport: transportCost,
          handling: handlingCost,
          other: 0,
          total: totalCosts
        },
        netProfit: netProfit,
        profitPerKm: netProfit / safeDistance,
        profitMargin: (netProfit / revenue) * 100,
        historicalInsight: `Live eNAM Price`,
      });
    });
  } else {
    throw new Error("No live trade data found for this crop today.");
  }

  // If we filtered out all mandis because they weren't in our coordinate file:
  if (mandiResults.length === 0) {
     throw new Error("Prices found, but mapping coordinates are missing. Try another crop.");
  }

  mandiResults.sort((a, b) => b.netProfit - a.netProfit);

  const bestMandi = mandiResults.length > 0 ? {
    id: mandiResults[0].id,
    name: mandiResults[0].name,
    netProfit: mandiResults[0].netProfit,
    distance: mandiResults[0].distance
  } : null;

  const nearestMandi = [...mandiResults].sort((a, b) => a.distance - b.distance)[0];

  const potentialSavings = bestMandi && nearestMandi && bestMandi.id !== nearestMandi.id
    ? bestMandi.netProfit - nearestMandi.netProfit
    : 0;

  return {
    mandis: mandiResults,
    bestMandi: bestMandi,
    nearestMandi: nearestMandi,
    potentialSavings: potentialSavings,
    totalMarketsCompared: mandiResults.length,
    cropDetails: selectedCrop,
    locationDetails: { name: location, coordinates: { lat: userLat, lng: userLng } }, 
    vehicleDetails: selectedVehicle,
    quantityInQuintals: quantityInQuintals
  };
};