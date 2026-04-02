import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './RouteMap.css';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMap = ({ origin, mandis, bestMandi }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef([]);
  const [selectedMandi, setSelectedMandi] = useState(bestMandi?.id || null);

  // Validate coordinates
  const isValidCoordinate = (coord) => {
    return coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && 
           !isNaN(coord.lng);
  };

  useEffect(() => {
    // Cleanup function to remove map when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Validate origin coordinates
    if (!origin || !origin.coordinates) {
      console.error('Origin coordinates missing:', origin);
      return;
    }

    const originCoords = origin.coordinates;
    if (!isValidCoordinate(originCoords)) {
      console.error('Invalid origin coordinates:', originCoords);
      return;
    }

    // Validate mandis
    if (!mandis || mandis.length === 0) {
      console.warn('No mandis provided to map');
      return;
    }

    // Initialize map only once
    if (!mapInstanceRef.current && mapRef.current) {
      try {
        mapInstanceRef.current = L.map(mapRef.current, {
          center: [originCoords.lat, originCoords.lng],
          zoom: 8,
          zoomControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      } catch (error) {
        console.error('Error initializing map:', error);
        return;
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers and polylines
    markersRef.current.forEach(marker => marker.remove());
    polylinesRef.current.forEach(polyline => polyline.remove());
    markersRef.current = [];
    polylinesRef.current = [];

    // Create custom icons
    const originIcon = L.divIcon({
      className: 'custom-marker origin-marker',
      html: '<div class="marker-pin origin"><span class="marker-icon">🏠</span></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    const bestMandiIcon = L.divIcon({
      className: 'custom-marker best-marker',
      html: '<div class="marker-pin best"><span class="marker-icon">⭐</span></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    const mandiIcon = L.divIcon({
      className: 'custom-marker mandi-marker',
      html: '<div class="marker-pin mandi"><span class="marker-icon">🏪</span></div>',
      iconSize: [35, 35],
      iconAnchor: [17.5, 35],
      popupAnchor: [0, -35],
    });

    // Add origin marker
    const originMarker = L.marker([originCoords.lat, originCoords.lng], { 
      icon: originIcon 
    }).addTo(map);

    originMarker.bindPopup(`
      <div class="map-popup">
        <strong>Your Location</strong><br/>
        ${origin.name || 'Current Position'}
      </div>
    `);

    markersRef.current.push(originMarker);

    // Create bounds to fit all markers
    const bounds = L.latLngBounds([[originCoords.lat, originCoords.lng]]);

    // Add mandi markers and routes
    mandis.forEach((mandi) => {
      // Validate mandi coordinates
      if (!mandi.coordinates || !isValidCoordinate(mandi.coordinates)) {
        console.warn('Invalid coordinates for mandi:', mandi.name, mandi.coordinates);
        return;
      }

      const isBest = mandi.id === bestMandi?.id;
      const isSelected = mandi.id === selectedMandi;

      // Add marker
      const marker = L.marker(
        [mandi.coordinates.lat, mandi.coordinates.lng],
        { icon: isBest ? bestMandiIcon : mandiIcon }
      ).addTo(map);

      // Popup content
      const popupContent = `
        <div class="map-popup ${isBest ? 'best-popup' : ''}">
          ${isBest ? '<div class="popup-badge">⭐ Best Choice</div>' : ''}
          <strong>${mandi.name}</strong><br/>
          <span class="popup-detail"> ${mandi.distance.toFixed(1)} km away</span><br/>
          <span class="popup-detail">₹${mandi.netProfit.toLocaleString('en-IN')} profit</span><br/>
          <span class="popup-detail"> ₹${mandi.marketPrice}/quintal</span>
          ${mandi.historicalInsight ? `<br/><span class="popup-insight">💡 ${mandi.historicalInsight}</span>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);

      // Add route line
      const routeLine = L.polyline(
        [
          [originCoords.lat, originCoords.lng],
          [mandi.coordinates.lat, mandi.coordinates.lng]
        ],
        {
          color: isBest ? '#10b981' : isSelected ? '#3b82f6' : '#94a3b8',
          weight: isBest ? 4 : isSelected ? 3 : 2,
          opacity: isBest ? 0.9 : isSelected ? 0.7 : 0.4,
          dashArray: isBest ? null : '5, 10',
        }
      ).addTo(map);

      polylinesRef.current.push(routeLine);

      // Add to bounds
      bounds.extend([mandi.coordinates.lat, mandi.coordinates.lng]);

      // Click handler for marker
      marker.on('click', () => {
        setSelectedMandi(mandi.id);
      });
    });

    // Fit map to show all markers
    map.fitBounds(bounds, { padding: [50, 50] });

  }, [origin, mandis, bestMandi, selectedMandi]);

  const handleMandiSelect = (mandiId) => {
    setSelectedMandi(mandiId);

    // Find and open popup for selected mandi
    const mandi = mandis.find(m => m.id === mandiId);
    if (mandi && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [mandi.coordinates.lat, mandi.coordinates.lng],
        11
      );
    }
  };

  // Validate props before rendering
  if (!origin || !origin.coordinates || !isValidCoordinate(origin.coordinates)) {
    return (
      <div className="map-error">
        <p> Unable to display map: Invalid origin coordinates</p>
        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          Origin data: {JSON.stringify(origin)}
        </p>
      </div>
    );
  }

  if (!mandis || mandis.length === 0) {
    return (
      <div className="map-error">
        <p> No markets available to display on map</p>
      </div>
    );
  }

  return (
    <div className="route-map-container">
      {/* Map Controls */}
      <div className="map-controls">
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-marker origin-legend">🏠</span>
            <span className="legend-text">Your Location</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker best-legend">⭐</span>
            <span className="legend-text">Best Market</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker mandi-legend">🏪</span>
            <span className="legend-text">Other Markets</span>
          </div>
        </div>

        {/* Quick Market Selector */}
        {mandis.length > 0 && (
          <div className="market-selector">
            <label className="selector-label">Quick Jump:</label>
            <select
              className="selector-dropdown"
              value={selectedMandi || ''}
              onChange={(e) => handleMandiSelect(e.target.value)}
            >
              {mandis.map((mandi, index) => (
                <option key={mandi.id || index} value={mandi.id}>
                  {mandi.name} ({mandi.distance.toFixed(0)} km - ₹{mandi.netProfit.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="map-element"></div>

      {/* Map Info Panel */}
      <div className="map-info-panel">
        <div className="info-item">
          <div className="info-content">
            <span className="info-label">Total Distance</span>
            <span className="info-value">
              {mandis.reduce((sum, m) => sum + m.distance, 0).toFixed(0)} km covered
            </span>
          </div>
        </div>

        <div className="info-item">
          <div className="info-content">
            <span className="info-label">Best Route</span>
            <span className="info-value">
              {bestMandi?.name} ({bestMandi?.distance?.toFixed(0)} km)
            </span>
          </div>
        </div>

        <div className="info-item">
          <div className="info-content">
            <span className="info-label">Est. Travel Time</span>
            <span className="info-value">
              {Math.ceil((bestMandi?.distance || 0) / 40)} hours
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
