import React, { useState, useEffect } from 'react';
import InputForm from '../InputForm/InputForm';
import ProfitCards from '../ProfitCards/ProfitCards';
import CostBreakdown from '../CostBreakdown/CostBreakdown';
import ImpactMetrics from '../ImpactMetrics/ImpactMetrics';
import RouteMap from '../RouteMap/RouteMap';
import { calculateProfitability } from '../../services/profitCalculator';
import { fetchLivePrices } from '../../services/enamApi';
import './Dashboard.css';

const Dashboard = () => {
  const [tripData, setTripData] = useState(null);
  const [profitResults, setProfitResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Consolidated loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  
  const loadingMessages = [
    "Securely connecting to eNAM Government Servers...",
    "Fetching live market prices for Rajasthan...",
    "Calculating real-time diesel & transport costs...",
    "Running Haversine routing algorithms...",
    "Plotting optimal profitability..."
  ];

  // Cycles the loading text
  useEffect(() => {
    let interval;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 800);
    } else {
      setLoadingStep(0); // Reset when done
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleTripSubmit = async (formData) => {
    setIsLoading(true);
    setError(null);
    setProfitResults(null);
    
    try {
      const userState = formData.location || "RAJASTHAN"; 
      const selectedCrop = formData.crop || "-- Select Commodity --";

      console.log(`Fetching live data for ${selectedCrop} in ${userState}...`);
      
      const liveData = await fetchLivePrices(userState, selectedCrop);
      console.log("SUCCESS! Here is the live data from the Government:", liveData);
      
      setTripData(formData);
      
      const finalResults = calculateProfitability(formData, liveData); 
      setProfitResults(finalResults);
      
    } catch (err) {
      setError('Failed to fetch live prices from eNAM. Please try again.');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
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
            loading={isLoading}
            onReset={handleReset}
            hasResults={!!profitResults}
          />
        </aside>

        {/* Right Panel - Results */}
        <main className="results-panel">
          
          {/* THE WAITING ROOM - Dynamic Loader */}
          {isLoading && (
            <div className="loading-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '50px', height: '50px', border: '4px solid #e0e0e0', borderTop: '4px solid #1e8e3e', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h3 style={{ color: '#202124', fontSize: '1.3rem', marginBottom: '8px' }}>{loadingMessages[loadingStep]}</h3>
              <p style={{ color: '#5f6368' }}>Analyzing markets and calculating optimal routes...</p>
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

          {!isLoading && !error && !profitResults && (
            <div className="empty-state">
              <h3>Ready to Find Your Best Market</h3>
              <p>Select your crop, quantity, vehicle, and location to compare mandi prices and maximize your profit</p>
              <div className="feature-list">
                <div className="feature-item"><span>Real-time price comparison</span></div>
                <div className="feature-item"><span>Transport cost calculation</span></div>
                <div className="feature-item"><span>Profit optimization</span></div>
                <div className="feature-item"><span>Distance-based analysis</span></div>
              </div>
            </div>
          )}

          {/* THE RESULTS PANEL */}
          {!isLoading && !error && profitResults && (
            <div className="results-container">
              
              {/* LIVE DATA FLEX BADGE */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <div className="live-badge-container">
                  <div className="pulsing-dot"></div>
                  Live eNAM Data
                </div>
              </div>

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
      
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;