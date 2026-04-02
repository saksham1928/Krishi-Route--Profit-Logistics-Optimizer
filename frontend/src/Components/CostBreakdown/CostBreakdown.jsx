import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import './CostBreakdown.css';

const CostBreakdown = ({ mandis }) => {
  const [chartType, setChartType] = useState('stacked'); // 'stacked' or 'pie'
  const [selectedMandi, setSelectedMandi] = useState(null);

  if (!mandis || mandis.length === 0) {
    return <div className="no-data">No cost data available</div>;
  }

  // Prepare data for stacked bar chart
  const stackedData = mandis.map((mandi) => ({
    name: mandi.name.length > 15 ? mandi.name.substring(0, 15) + '...' : mandi.name,
    fullName: mandi.name,
    revenue: mandi.revenue,
    transport: mandi.costs.transport,
    handling: mandi.costs.handling,
    other: mandi.costs.other || 0,
    netProfit: mandi.netProfit,
  }));

  // Prepare data for pie chart (selected mandi or best mandi)
  const pieDataMandi = selectedMandi || mandis[0];
  const pieData = [
    { name: 'Net Profit', value: pieDataMandi.netProfit, color: '#10b981' },
    { name: 'Transport Cost', value: pieDataMandi.costs.transport, color: '#ef4444' },
    { name: 'Handling Cost', value: pieDataMandi.costs.handling, color: '#f59e0b' },
  ];
  
  if (pieDataMandi.costs.other) {
    pieData.push({ 
      name: 'Other Costs', 
      value: pieDataMandi.costs.other, 
      color: '#8b5cf6' 
    });
  }

  const COLORS = {
    revenue: '#3b82f6',
    transport: '#ef4444',
    handling: '#f59e0b',
    other: '#8b5cf6',
    netProfit: '#10b981',
  };

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalCosts = data.transport + data.handling + data.other;
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.fullName}</p>
          <div className="tooltip-divider"></div>
          <p className="tooltip-item revenue">
            <span className="tooltip-label">Revenue:</span>
            <span className="tooltip-value">₹{data.revenue.toLocaleString('en-IN')}</span>
          </p>
          <p className="tooltip-item cost">
            <span className="tooltip-label">Transport:</span>
            <span className="tooltip-value">₹{data.transport.toLocaleString('en-IN')}</span>
          </p>
          <p className="tooltip-item cost">
            <span className="tooltip-label">Handling:</span>
            <span className="tooltip-value">₹{data.handling.toLocaleString('en-IN')}</span>
          </p>
          {data.other > 0 && (
            <p className="tooltip-item cost">
              <span className="tooltip-label">Other:</span>
              <span className="tooltip-value">₹{data.other.toLocaleString('en-IN')}</span>
            </p>
          )}
          <div className="tooltip-divider"></div>
          <p className="tooltip-item total">
            <span className="tooltip-label">Total Costs:</span>
            <span className="tooltip-value">₹{totalCosts.toLocaleString('en-IN')}</span>
          </p>
          <p className="tooltip-item profit">
            <span className="tooltip-label">Net Profit:</span>
            <span className="tooltip-value">₹{data.netProfit.toLocaleString('en-IN')}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie chart
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / pieDataMandi.revenue) * 100).toFixed(1);
      
      return (
        <div className="custom-tooltip">
          <p className="tooltip-title">{data.name}</p>
          <p className="tooltip-item">
            <span className="tooltip-value">₹{data.value.toLocaleString('en-IN')}</span>
            <span className="tooltip-percentage">({percentage}% of revenue)</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="pie-label"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="cost-breakdown-container">
      {/* Controls */}
      <div className="breakdown-controls">
        <div className="chart-type-selector">
          <button
            className={`chart-type-btn ${chartType === 'stacked' ? 'active' : ''}`}
            onClick={() => setChartType('stacked')}
          >
             Comparison View
          </button>
          <button
            className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
          >
             Distribution View
          </button>
        </div>

        {chartType === 'pie' && (
          <div className="mandi-selector">
            <label htmlFor="mandi-select">Select Market:</label>
            <select
              id="mandi-select"
              value={selectedMandi?.id || mandis[0].id}
              onChange={(e) => {
                const mandi = mandis.find(m => m.id === e.target.value);
                setSelectedMandi(mandi);
              }}
            >
              {mandis.map((mandi) => (
                <option key={mandi.id} value={mandi.id}>
                  {mandi.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Chart Display */}
      {chartType === 'stacked' ? (
        <div className="chart-wrapper">
          <h3 className="chart-title">Cost Comparison Across Markets</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={stackedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
              <Bar dataKey="revenue" fill={COLORS.revenue} name="Revenue" radius={[8, 8, 0, 0]} />
              <Bar dataKey="transport" fill={COLORS.transport} name="Transport Cost" stackId="costs" />
              <Bar dataKey="handling" fill={COLORS.handling} name="Handling Cost" stackId="costs" />
              <Bar dataKey="other" fill={COLORS.other} name="Other Costs" stackId="costs" />
              <Bar dataKey="netProfit" fill={COLORS.netProfit} name="Net Profit" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="chart-wrapper pie-wrapper">
          <h3 className="chart-title">
            Revenue Distribution - {pieDataMandi.name}
          </h3>
          <div className="pie-chart-container">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend and Stats */}
            <div className="pie-stats">
              <div className="stat-card">
                <span className="stat-label">Total Revenue</span>
                <span className="stat-value revenue-color">
                  ₹{pieDataMandi.revenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Costs</span>
                <span className="stat-value cost-color">
                  ₹{(pieDataMandi.costs.transport + pieDataMandi.costs.handling + (pieDataMandi.costs.other || 0)).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="stat-card highlight">
                <span className="stat-label">Net Profit</span>
                <span className="stat-value profit-color">
                  ₹{pieDataMandi.netProfit.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cost Efficiency Analysis */}
      <div className="efficiency-analysis">
        <h4 className="analysis-title"> Cost Efficiency Insights</h4>
        <div className="efficiency-cards">
          {mandis.slice(0, 3).map((mandi, index) => {
            const totalCosts = mandi.costs.transport + mandi.costs.handling + (mandi.costs.other || 0);
            const costRatio = ((totalCosts / mandi.revenue) * 100).toFixed(1);
            const profitPerKm = (mandi.netProfit / mandi.distance).toFixed(0);

            return (
              <div key={index} className="efficiency-card">
                <div className="efficiency-header">
                  <span className="efficiency-rank">#{index + 1}</span>
                  <span className="efficiency-name">{mandi.name}</span>
                </div>
                <div className="efficiency-metrics">
                  <div className="efficiency-metric">
                    <span className="metric-label">Cost Ratio:</span>
                    <span className={`metric-value ${costRatio < 20 ? 'good' : costRatio < 30 ? 'medium' : 'high'}`}>
                      {costRatio}%
                    </span>
                  </div>
                  <div className="efficiency-metric">
                    <span className="metric-label">Profit/km:</span>
                    <span className="metric-value">₹{profitPerKm}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CostBreakdown;
