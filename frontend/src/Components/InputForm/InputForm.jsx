import { useState } from 'react';
import mockData from '../../data/mockData.json';
import './InputForm.css';
import { getUserLocation, detectStateFromCoordinates } from '../../utils/stateDetector';
import stateBoundaries from '../../data/stateBoundaries.json';

const InputForm = ({ onSubmit, loading, onReset, hasResults }) => {
  const [formData, setFormData] = useState({
    crop: '',
    quantity: '',
    unit: 'quintal',
    vehicle: '',
    location: '',
    dieselRate: '90', // Default base diesel rate in ₹
  });
  
  const [locationStatus, setLocationStatus] = useState('');
  
  const handleDetectLocation = async () => {
    setLocationStatus('Locating...');
    try {
      const coords = await getUserLocation();
      const detectedState = detectStateFromCoordinates(coords.lat, coords.lng);
      
     if (detectedState) {
        // Save the exact Lat/Lng so the map knows where to start
        handleChange('originCoords', { lat: coords.lat, lng: coords.lng });
        // -------------------------

        if (detectedState.enam_name === 'RAJASTHAN') {
          setLocationStatus(`Detected: ${detectedState.name}`);
          handleChange('location', detectedState.enam_name); 
        } else {
          setLocationStatus(`Detected: ${detectedState.name}. (Note: MVP is currently limited to Rajasthan markets).`);
          handleChange('location', 'RAJASTHAN');
        }
      } else {
        setLocationStatus('Location not recognized. Defaulting to Rajasthan MVP.');
        handleChange('location', 'RAJASTHAN');
      }
    } catch (error) {
      setLocationStatus(`${error.message} Defaulting to Rajasthan.`);
      handleChange('location', 'RAJASTHAN');
    }
  };

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.crop) newErrors.crop = 'Please select a crop';
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Please enter valid quantity';
    }
    if (!formData.vehicle) newErrors.vehicle = 'Please select a vehicle';
    if (!formData.location) newErrors.location = 'Please select your location';
    if (!formData.dieselRate || formData.dieselRate <= 0) {
      newErrors.dieselRate = 'Please enter a valid diesel rate';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleFormReset = () => {
    setFormData({
      crop: '',
      quantity: '',
      unit: 'quintal',
      vehicle: '',
      location: '',
      dieselRate: '90',
    });
    setErrors({});
    onReset();
  };

  const grains = mockData.crops.filter(c => c.category === "Grains & Seeds");
  const vegetables = mockData.crops.filter(c => c.category === "Fruits & Vegetables");
  const selectedCrop = mockData.crops.find(c => c.type === formData.crop);
  const selectedVehicle = mockData.vehicles.find(v => v.type === formData.vehicle);
  
  // Calculate adjusted vehicle rate for the summary UI
  const baseDieselRate = 90; 
  const currentDieselRate = parseFloat(formData.dieselRate) || baseDieselRate;
  const adjustedRatePerKm = selectedVehicle 
    ? (selectedVehicle.ratePerKm * (currentDieselRate / baseDieselRate)).toFixed(2) 
    : 0;

  return (
    <div className="input-form-container">
      <h2 className="form-title">Trip Details</h2>
      
      <form onSubmit={handleSubmit} className="input-form">
        {/* Crop Selection */}
        <div className="form-group">
          <label htmlFor="crop" className="form-label">
            Crop Type <span className="required">*</span>
          </label>

          <select
          id="crop"
          className={`form-select ${errors.crop ? 'error' : ''}`}
          value={formData.crop}
          onChange={(e) => handleChange('crop', e.target.value)}
        >
          <option value="">-- Select Commodity --</option>
          
          <optgroup label=" Grains, Seeds & Cash Crops">
            {grains.map((crop) => (
              <option key={crop.id} value={crop.type}>
                {crop.name}
              </option>
            ))}
          </optgroup>
          
          <optgroup label=" Fruits & Vegetables">
            {vegetables.map((crop) => (
              <option key={crop.id} value={crop.type}>
                {crop.name}
              </option>
            ))}
          </optgroup>
          
        </select>
          {errors.crop && <span className="error-text">{errors.crop}</span>}
          {selectedCrop && (
            <div className="field-info">
              {selectedCrop.perishable ? (
                <span className="info-badge warning"> Perishable - {selectedCrop.shelfLifeDays} days shelf life</span>
              ) : (
                <span className="info-badge success"> Perishable - {selectedCrop.shelfLifeDays} days shelf life</span>
              )}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="form-group">
          <label htmlFor="quantity" className="form-label">
            Quantity <span className="required">*</span>
          </label>
          <div className="quantity-group">
            <input
              type="number"
              id="quantity"
              className={`form-input ${errors.quantity ? 'error' : ''}`}
              placeholder="Enter quantity"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              min="0"
              step="0.1"
            />
            <select
              className="form-select unit-select"
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
            >
              <option value="quintal">Quintal (क्विंटल)</option>
              <option value="ton">Ton (टन)</option>
              <option value="kg">Kilogram (किलो)</option>
            </select>
          </div>
          {errors.quantity && <span className="error-text">{errors.quantity}</span>}
        </div>

        {/* Vehicle Selection */}
        <div className="form-group">
          <label htmlFor="vehicle" className="form-label">
            Vehicle Type <span className="required">*</span>
          </label>
          <select
            id="vehicle"
            className={`form-select ${errors.vehicle ? 'error' : ''}`}
            value={formData.vehicle}
            onChange={(e) => handleChange('vehicle', e.target.value)}
          >
            <option value="">-- Select Vehicle --</option>
            {mockData.vehicles.map(vehicle => (
              <option key={vehicle.id} value={vehicle.type}>
                {vehicle.name} - {vehicle.capacity} {vehicle.capacityUnit} (Base: ₹{vehicle.ratePerKm}/km)
              </option>
            ))}
          </select>
          {errors.vehicle && <span className="error-text">{errors.vehicle}</span>}
          {selectedVehicle && (
            <div className="field-info">
              <span className="info-text">{selectedVehicle.description}</span>
            </div>
          )}
        </div>

        {/* Today's Diesel Rate Input */}
        <div className="form-group">
          <label htmlFor="dieselRate" className="form-label">
            Today's Diesel Rate (₹/Litre) <span className="required">*</span>
          </label>
          <input
            type="number"
            id="dieselRate"
            className={`form-input ${errors.dieselRate ? 'error' : ''}`}
            placeholder="e.g. 90"
            value={formData.dieselRate}
            onChange={(e) => handleChange('dieselRate', e.target.value)}
            min="1"
            step="0.1"
          />
          {errors.dieselRate && <span className="error-text">{errors.dieselRate}</span>}
        </div>

        {/* Location Detection Button */}
        <div className="location-detector">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={handleDetectLocation}
          >
            Auto-Detect My Location
          </button>
          {locationStatus && <p className="location-status-text">{locationStatus}</p>}
        </div>
        
        {/* State Selection */}
        <div className="form-group">
          <label htmlFor="location" className="form-label">
            Your State <span className="required">*</span>
          </label>
          <select
            id="location"
            className={`form-select ${errors.location ? 'error' : ''}`}
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          >
            <option value="">-- Select State --</option>
            {stateBoundaries.states.map(state => (
              <option key={state.state_id} value={state.enam_name}>
                {state.name}
              </option>
            ))}
          </select>
          {errors.location && <span className="error-text">{errors.location}</span>}
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          {hasResults && (
            <button
              type="button"
              className="btn-secondary"
              onClick={handleFormReset}
            >
              Reset
            </button>
          )}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-small"></span>
                Calculating...
              </>
            ) : (
              <>
                Find Best Market
              </>
            )}
          </button>
        </div>
      </form>

      {/* Summary Card */}
      {selectedVehicle && formData.quantity && (
        <div className="trip-summary">
          <h3 className="summary-title">Trip Summary</h3>
          <div className="summary-item">
            <span className="summary-label">Adjusted Transport Cost:</span>
            <span className="summary-value">
              ₹{adjustedRatePerKm}/km
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Vehicle Capacity:</span>
            <span className="summary-value">{selectedVehicle.capacity} {selectedVehicle.capacityUnit}</span>
          </div>
          {formData.quantity && (
            <div className="summary-item">
              <span className="summary-label">Load:</span>
              <span className="summary-value">
                {formData.quantity} {formData.unit}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InputForm;