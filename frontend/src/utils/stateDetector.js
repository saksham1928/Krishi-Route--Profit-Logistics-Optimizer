import stateBoundaries from '../data/stateBoundaries.json';

/**
 * Asks the browser for the user's current GPS location.
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    // Check if the browser actually supports Geolocation
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    // Ask for the location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        // Handle cases where the user clicks "Block" or GPS is off
        switch(error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Location permission denied. Please select your state manually."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get user location timed out."));
            break;
          default:
            reject(new Error("An unknown error occurred getting location."));
        }
      }
    );
  });
};

/**
 * Takes Lat/Lng and finds which state bounding box it falls into.
 */
export const detectStateFromCoordinates = (lat, lng) => {
  for (const state of stateBoundaries.states) {
    const { north, south, east, west } = state.bounds;
    
    // Check if the coordinates fall inside this state's box
    if (lat <= north && lat >= south && lng <= east && lng >= west) {
      return state; 
    }
  }
  
  return null; // Coordinate is not in our known state boundaries
};