import './ProfitCards.css';
import PriceTrends from '../PriceTrends/PriceTrends';
import { useState } from 'react';

const ProfitCards = ({ results, selectedCrop, stateName = "RAJASTHAN" }) => {
  const [activeTrendId, setActiveTrendId] = useState(null);

  if (!results || results.length === 0) {
    return <div className="no-results">No markets found</div>;
  }

  // Sort by net profit 
  const sortedResults = [...results].sort((a, b) => b.netProfit - a.netProfit);
  const bestProfit = sortedResults[0].netProfit;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProfitBadge = (profit, maxProfit) => {
    const percentage = ((profit / maxProfit) * 100).toFixed(0);
    
    if (profit === maxProfit) {
      return { text: 'Best Choice', className: 'badge-best' };
    } else if (percentage >= 90) {
      return { text: 'Good Option', className: 'badge-good' };
    } else if (percentage >= 75) {
      return { text: 'Fair Option', className: 'badge-fair' };
    } else {
      return { text: 'Lower Profit', className: 'badge-low' };
    }
  };

  const getPriceAlert = (mandi) => {
    if (mandi.priceAlert) {
      if (mandi.priceAlert.trend === 'rising') {
        return {
          text: ` Price rising (${mandi.priceAlert.change}% in 3 days)`,
          className: 'alert-rising'
        };
      } else if (mandi.priceAlert.trend === 'falling') {
        return {
          text: ` Price falling (${mandi.priceAlert.change}% in 3 days)`,
          className: 'alert-falling'
        };
      }
    }
    return null;
  };

  const getPerishabilityWarning = (mandi) => {
    if (mandi.perishabilityWarning) {
      return {
        text: ` ${mandi.perishabilityWarning.message}`,
        className: 'warning-perishable'
      };
    }
    return null;
  };

  return (
    <div className="profit-cards-container">
      {sortedResults.map((mandi, index) => {
        const badge = getProfitBadge(mandi.netProfit, bestProfit);
        const priceAlert = getPriceAlert(mandi);
        const perishWarning = getPerishabilityWarning(mandi);
        const profitMargin = ((mandi.netProfit / mandi.revenue) * 100).toFixed(1);

        // Safe unique ID for toggling
        const cardId = mandi.id || mandi.name;

        return (
          <div 
            key={cardId}
            className={`profit-card ${index === 0 ? 'best-option' : ''}`}
          >
            {/* Header */}
            <div className="card-header">
              <div className="mandi-info">
                <h3 className="mandi-name">{mandi.name}</h3>
                <p className="mandi-location">{mandi.district}</p>
              </div>
              <div className={`profit-badge ${badge.className}`}>
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-text">{badge.text}</span>
              </div>
            </div>

            {/* Alerts & Warnings */}
            {(priceAlert || perishWarning) && (
              <div className="card-alerts">
                {priceAlert && (
                  <div className={`alert ${priceAlert.className}`}>
                    {priceAlert.text}
                  </div>
                )}
                {perishWarning && (
                  <div className={`alert ${perishWarning.className}`}>
                    {perishWarning.text}
                  </div>
                )}
              </div>
            )}

            {/* Main Profit Display */}
            <div className="profit-display">
              <div className="profit-amount">
                <span className="profit-label">Net Profit</span>
                <span className="profit-value">{formatCurrency(mandi.netProfit)}</span>
                <span className="profit-margin">
                  {profitMargin}% margin
                </span>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="card-metrics">
              <div className="metric">
                <div className="metric-content">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{mandi.distance.toFixed(1)} km</span>
                </div>
              </div>

              <div className="metric">
                <div className="metric-content">
                  <span className="metric-label">Market Price</span>
                  <span className="metric-value">
                    {formatCurrency(mandi.marketPrice)}/quintal
                  </span>
                </div>
              </div>

              <div className="metric">
                <div className="metric-content">
                  <span className="metric-label">Transport Cost</span>
                  <span className="metric-value">
                    {formatCurrency(mandi.costs.transport)}
                  </span>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="revenue-breakdown">
              <div className="breakdown-row">
                <span className="breakdown-label">Revenue:</span>
                <span className="breakdown-value positive">
                  + {formatCurrency(mandi.revenue)}
                </span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Transport:</span>
                <span className="breakdown-value negative">
                  - {formatCurrency(mandi.costs.transport)}
                </span>
              </div>
              <div className="breakdown-row">
                <span className="breakdown-label">Handling:</span>
                <span className="breakdown-value negative">
                  - {formatCurrency(mandi.costs.handling)}
                </span>
              </div>
              {mandi.costs.other && (
                <div className="breakdown-row">
                  <span className="breakdown-label">Other:</span>
                  <span className="breakdown-value negative">
                    - {formatCurrency(mandi.costs.other)}
                  </span>
                </div>
              )}
              <div className="breakdown-divider"></div>
              <div className="breakdown-row total">
                <span className="breakdown-label">Net Profit:</span>
                <span className="breakdown-value">
                  {formatCurrency(mandi.netProfit)}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            {mandi.historicalInsight && (
              <div className="historical-insight">
                <span className="insight-text">{mandi.historicalInsight}</span>
              </div>
            )}

            {/* Comparison with Best */}
            {index > 0 && (
              <div className="comparison-note">
                <span className="comparison-text">
                  {formatCurrency(bestProfit - mandi.netProfit)} less than best option
                </span>
              </div>
            )}

            {/*TREND CHART TOGGLE AND COMPONENT*/}
            <button 
              onClick={() => setActiveTrendId(activeTrendId === cardId ? null : cardId)}
              style={{ width: '100%', padding: '10px', marginTop: '15px', backgroundColor: '#fff', border: '1px solid #dadce0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', color: '#1a73e8', transition: 'background 0.2s' }}
            >
              {activeTrendId === cardId ? 'Hide Trends' : 'View 60-Day Trends'}
            </button>

            {activeTrendId === cardId && (
              <PriceTrends 
                stateName={stateName} 
                cropName={selectedCrop} 
                mandiName={mandi.name.split(' (')[0]} 
              />
            )}

          </div>
        );
      })}

      {/* Summary Insights */}
      <div className="cards-summary">
        <div className="summary-stat">
          <div className="stat-content">
            <span className="stat-value">{sortedResults.length}</span>
            <span className="stat-label">Markets Compared</span>
          </div>
        </div>
        
        <div className="summary-stat">
          <div className="stat-content">
            <span className="stat-value">
              {formatCurrency(sortedResults[0].netProfit - sortedResults[sortedResults.length - 1].netProfit)}
            </span>
            <span className="stat-label">Max Profit Difference</span>
          </div>
        </div>

        <div className="summary-stat">
          <div className="stat-content">
            <span className="stat-value">
              {sortedResults[0].distance.toFixed(0)} km
            </span>
            <span className="stat-label">Best Market Distance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitCards;