import { useState} from 'react';
import InputForm from '../InputForm/InputForm';
import ProfitCards from '../ProfitCards/ProfitCards';
import CostBreakdown from '../CostBreakdown/CostBreakdown';
import ImpactMetrics from '../ImpactMetrics/ImpactMetrics';
import RouteMap from '../RouteMap/RouteMap';
import { calculateProfitability } from '../../services/profitCalculator';
import './Dashboard.css';
import { fetchLivePrices } from '../../services/enamApi';

const Dashboard = () => {
  const [tripData, setTripData] = useState(null);
  const [profitResults, setProfitResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTripSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Check if the user auto-detected a state. 
      // (Assuming you saved the detected state name in formData.location)
      const userState = formData.location || "RAJASTHAN"; // Fallback for testing
      const selectedCrop = formData.crop || "-- Select Commodity --";

      console.log(`Fetching live data for ${selectedCrop} in ${userState}...`);
      
      // 2. Call our new eNAM API service
      const liveData = await fetchLivePrices(userState, selectedCrop);
      
      console.log("SUCCESS! Here is the live data from the Government:", liveData);

      // (We will plug this liveData into calculateProfitability in the next step!)
      
      setTripData(formData);
      // Temporarily keeping your old profit results so the app doesn't break
      const finalResults = calculateProfitability(formData, liveData); 
      setProfitResults(finalResults);
      
    } catch (err) {
      setError('Failed to fetch live prices from eNAM. Please try again.');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTripData(null);
    setProfitResults(null);
    setError(null);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Krishi-Route</h1>
          <p className="tagline">Smart Market Selection for Maximum Profit</p>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Panel - Input Form */}
        <aside className="input-panel">
          <InputForm 
            onSubmit={handleTripSubmit} 
            loading={loading}
            onReset={handleReset}
            hasResults={!!profitResults}
          />
        </aside>

        {/* Right Panel - Results */}
        <main className="results-panel">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analyzing markets and calculating optimal routes...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">Error</div>
              <h3>Something went wrong</h3>
              <p>{error}</p>
              <button onClick={handleReset} className="btn-secondary">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && !profitResults && (
            <div className="empty-state">
              <h3>Ready to Find Your Best Market</h3>
              <p>Select your crop, quantity, vehicle, and location to compare mandi prices and maximize your profit</p>
              <div className="feature-list">
                <div className="feature-item">
                  <span>Real-time price comparison</span>
                </div>
                <div className="feature-item">
                  <span>Transport cost calculation</span>
                </div>
                <div className="feature-item">
                  <span>Profit optimization</span>
                </div>
                <div className="feature-item">
                  <span>Distance-based analysis</span>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && profitResults && (
            <div className="results-container">
              {/* Impact Metrics at Top */}
              <ImpactMetrics 
                results={profitResults}
                tripData={tripData}
              />
              <section className="section map-section">
                <h2 className="section-title">Route Visualization</h2>
                <div className="map-wrapper">
                  <RouteMap 
                    origin={profitResults.locationDetails}
                    mandis={profitResults.mandis}
                    bestMandi={profitResults.bestMandi}
                  />
                </div>
              </section>

              {/* Profit Comparison Cards */}
              <section className="section">
                <h2 className="section-title">Market Comparison</h2>
                <ProfitCards 
                  results={profitResults.mandis}
                  selectedCrop={tripData.crop}
                />
              </section>

              {/* Cost Breakdown Chart */}
              <section className="section">
                <h2 className="section-title">Cost Analysis</h2>
                <CostBreakdown 
                  mandis={profitResults.mandis}
                />
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
