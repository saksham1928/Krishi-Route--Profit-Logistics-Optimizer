import './ImpactMetrics.css';

const ImpactMetrics = ({ results, tripData }) => {
  if (!results || !results.mandis || results.mandis.length === 0) {
    return null;
  }

  const mandis = results.mandis;
  const bestMandi = mandis[0]; 
  const worstMandi = mandis[mandis.length - 1];
  const nearestMandi = [...mandis].sort((a, b) => a.distance - b.distance)[0];

  // Calculate key metrics
  const totalMarketsCompared = mandis.length;
  const maxProfitDifference = bestMandi.netProfit - worstMandi.netProfit;
  const potentialSavings = nearestMandi.id !== bestMandi.id 
    ? bestMandi.netProfit - nearestMandi.netProfit 
    : 0;
  
  const bestProfitMargin = ((bestMandi.netProfit / bestMandi.revenue) * 100).toFixed(1);
  const averageDistance = (mandis.reduce((sum, m) => sum + m.distance, 0) / mandis.length).toFixed(1);
  
  // Extra distance to best market
  const extraDistance = bestMandi.distance - nearestMandi.distance;
  
  // ROI calculation (profit gain per extra km traveled)
  const roi = extraDistance > 0 
    ? (potentialSavings / extraDistance).toFixed(0)
    : 0;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getImpactLevel = () => {
    if (potentialSavings > 5000) return { level: 'high', text: 'High Impact', color: '#10b981' };
    if (potentialSavings > 2000) return { level: 'medium', text: 'Medium Impact', color: '#f59e0b' };
    return { level: 'low', text: 'Low Impact', color: '#6b7280' };
  };

  const impact = getImpactLevel();

  return (
    <div className="impact-metrics-container">
      <div className="impact-hero" style={{ borderLeftColor: impact.color, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div className="hero-content" style={{ flex: '1 1 300px' }}>
          <h2 className="hero-title">
            {potentialSavings > 0 
              ? `You could earn ${formatCurrency(potentialSavings)} more!`
              : `${bestMandi.name} is your best option!`
            }
          </h2>
          <p className="hero-subtitle">
            {potentialSavings > 0
              ? `By traveling ${extraDistance.toFixed(0)} km extra to ${bestMandi.name} instead of your nearest market`
              : `You're already choosing the most profitable market in your area`
            }
          </p>
          <div className="impact-badge" style={{ backgroundColor: impact.color }}>
            {impact.text}
          </div>
        </div>
        
        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.5)', padding: '15px 20px', borderRadius: '12px', minWidth: '200px' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: '#5f6368', fontWeight: 'bold' }}>Estimated Net Profit</p>
            <h1 style={{ margin: '0 0 10px 0', fontSize: '2.8rem', color: '#10b981', lineHeight: '1' }}>{formatCurrency(bestMandi.netProfit)}</h1>
            <span style={{ background: '#fce8e6', color: '#d93025', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: '1px solid #fad2cf' }}>
               Live Diesel Rates Applied
            </span>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-content">
            <div className="metric-value">{totalMarketsCompared}</div>
            <div className="metric-label">Markets Compared</div>
            <div className="metric-detail">Avg. distance: {averageDistance} km</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(bestMandi.netProfit)}</div>
            <div className="metric-label">Best Profit</div>
            <div className="metric-detail">{bestProfitMargin}% margin at {bestMandi.name}</div>
          </div>
        </div>

        {potentialSavings > 0 && (
          <div className="metric-card warning">
            <div className="metric-content">
              <div className="metric-value">{formatCurrency(potentialSavings)}</div>
              <div className="metric-label">Potential Gain</div>
              <div className="metric-detail">vs nearest market ({nearestMandi.name})</div>
            </div>
          </div>
        )}

        {roi > 0 && (
          <div className="metric-card info">
            <div className="metric-content">
              <div className="metric-value">₹{roi}/km</div>
              <div className="metric-label">Return per Extra KM</div>
              <div className="metric-detail">Worth traveling {extraDistance.toFixed(0)} km extra</div>
            </div>
          </div>
        )}

        <div className="metric-card neutral">
          <div className="metric-content">
            <div className="metric-value">{formatCurrency(maxProfitDifference)}</div>
            <div className="metric-label">Profit Spread</div>
            <div className="metric-detail">Between best and worst option</div>
          </div>
        </div>
      </div>

      <div className="insights-panel">
        <h3 className="insights-title">Key Insights</h3>
        <div className="insights-list">
          {nearestMandi.id !== bestMandi.id && (
            <div className="insight-item highlight">
              <div className="insight-content">
                <strong>Don't settle for nearest!</strong>
                <p>
                  Your nearest market ({nearestMandi.name} - {nearestMandi.distance.toFixed(0)} km) 
                  would give you {formatCurrency(nearestMandi.netProfit)}, but traveling 
                  {' '}{extraDistance.toFixed(0)} km more to {bestMandi.name} adds 
                  {' '}{formatCurrency(potentialSavings)} to your pocket.
                </p>
              </div>
            </div>
          )}

          <div className="insight-item">
            <div className="insight-content">
              <strong>Optimal distance-to-profit ratio</strong>
              <p>
                {bestMandi.name} offers the best balance: 
                ₹{(bestMandi.netProfit / bestMandi.distance).toFixed(0)} profit per km traveled.
              </p>
            </div>
          </div>

          <div className="insight-item">
            <div className="insight-content">
              <strong>Transport costs managed</strong>
              <p>
                Transport to {bestMandi.name} costs {formatCurrency(bestMandi.costs.transport)}, 
                which is only {((bestMandi.costs.transport / bestMandi.revenue) * 100).toFixed(1)}% 
                of your revenue - well within profitable range.
              </p>
            </div>
          </div>

          {bestMandi.marketPrice > worstMandi.marketPrice && (
            <div className="insight-item">
              <div className="insight-content">
                <strong>Price advantage identified</strong>
                <p>
                  {bestMandi.name} is paying {formatCurrency(bestMandi.marketPrice)}/quintal, 
                  which is {formatCurrency(bestMandi.marketPrice - worstMandi.marketPrice)} more 
                  than the lowest-paying market.
                </p>
              </div>
            </div>
          )}

          {bestMandi.priceAlert && (
            <div className={`insight-item ${bestMandi.priceAlert.trend === 'falling' ? 'warning-item' : ''}`}>
              <span className="insight-icon">
                {bestMandi.priceAlert.trend === 'rising' ? 'UP' : 'DOWN'}
              </span>
              <div className="insight-content">
                <strong>Price trend alert</strong>
                <p>
                  Prices at {bestMandi.name} have been {bestMandi.priceAlert.trend} 
                  {' '}({bestMandi.priceAlert.change}% over 3 days). 
                  {bestMandi.priceAlert.trend === 'falling' 
                    ? ' Consider visiting soon before prices drop further.'
                    : ' Good timing - prices are on the rise!'
                  }
                </p>
              </div>
            </div>
          )}

          {bestMandi.perishabilityWarning && (
            <div className="insight-item warning-item">
              <div className="insight-content">
                <strong>Perishability notice</strong>
                <p>{bestMandi.perishabilityWarning.message}</p>
              </div>
            </div>
          )}

          {bestMandi.historicalInsight && (
            <div className="insight-item">
              <div className="insight-content">
                <strong>Historical pattern</strong>
                <p>{bestMandi.historicalInsight}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="action-suggestion">
        <div className="suggestion-content">
          <h4>Recommended Action</h4>
          <p>
            Load your {tripData.quantity} {tripData.unit} of {tripData.crop} on 
            your {tripData.vehicle} and head to <strong>{bestMandi.name}</strong>.
            {potentialSavings > 0 && (
              <> The extra {extraDistance.toFixed(0)} km will earn you 
              {' '}{formatCurrency(potentialSavings)} more than your nearest market.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactMetrics;