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
  });
  //
  const [locationStatus, setLocationStatus] = useState('');
const handleDetectLocation = async () => {
    setLocationStatus('Locating...');
    try {
      // 1. Get GPS coordinates
      const coords = await getUserLocation();
      
      // 2. Find the state
      const detectedState = detectStateFromCoordinates(coords.lat, coords.lng);
      
      if (detectedState) {
        setLocationStatus(`Detected: ${detectedState.name}`);
        // Optional: You can auto-fill your form's location state here
          handleChange('location', detectedState.enam_name); 
      } else {
        setLocationStatus('State not recognized in database.');
      }
    } catch (error) {
      setLocationStatus(error.message); // Shows "Permission denied" etc.
    }
  };
  //

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
    });
    setErrors({});
    onReset();
  };

  const grains = mockData.crops.filter(c => c.category === "Grains & Seeds");
  const vegetables = mockData.crops.filter(c => c.category === "Fruits & Vegetables");
  const selectedCrop = mockData.crops.find(c => c.type === formData.crop);
  const selectedVehicle = mockData.vehicles.find(v => v.type === formData.vehicle);
  
  
  return (
    <div className="input-form-container">
      <h2 className="form-title">Trip Details</h2>
      
      <form onSubmit={handleSubmit} className="input-form">
        {/* Crop Selection - DROPDOWN */}
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
          
          <optgroup label="🌾 Grains, Seeds & Cash Crops">
            {grains.map((crop) => (
              <option key={crop.id} value={crop.type}>
                {crop.name}
              </option>
            ))}
          </optgroup>
          
          <optgroup label="🍅 Fruits & Vegetables">
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
                <span className="info-badge warning"> Perishable - {selectedCrop.shelfLife} days shelf life</span>
              ) : (
                <span className="info-badge success">Non-perishable - {selectedCrop.shelfLife} days shelf life</span>
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

        {/* Vehicle Selection - DROPDOWN */}
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
                {vehicle.name} - {vehicle.capacity} {vehicle.capacityUnit} (₹{vehicle.ratePerKm}/km)
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
        {/* Location Selection - DROPDOWN */}
        {/* State Selection - DROPDOWN */}
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
            {/* We map over our new states instead of mock locations */}
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
            <span className="summary-label">Estimated Transport:</span>
            <span className="summary-value">
              ₹{selectedVehicle.ratePerKm}/km
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
