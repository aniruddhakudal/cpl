import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ChartCard';
import './SliderChart.css';

const SliderChart = ({ data, title, dataKey, sortKey, color = '#667eea', label = 'Value' }) => {
  const { theme } = useTheme();
  const [sliderValue, setSliderValue] = useState(10);
  const maxPlayers = Math.min(data.length, 30);
  
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.95)',
    padding: '10px',
    border: theme === 'dark' ? '1px solid #667eea' : '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 1000,
    position: 'relative',
    color: theme === 'dark' ? '#e0e0e0' : '#333'
  };

  const filteredData = useMemo(() => {
    return [...data]
      .sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0))
      .slice(0, sliderValue)
      .map(player => ({
        name: player.name && player.name.length > 15 
          ? player.name.substring(0, 15) + '...' 
          : player.name || 'Unknown',
        fullName: player.name || 'Unknown',
        value: player[dataKey] || 0,
        team: player.team_name || player['Team Name'] || 'Unknown'
      }));
  }, [data, sliderValue, sortKey, dataKey]);

  return (
    <ChartCard title={title}>
      <div className="slider-chart-container">
        <div className="slider-controls">
          <label htmlFor="player-slider" className="slider-label">
            Number of Players: <span className="slider-value">{sliderValue}</span>
          </label>
          <input
            id="player-slider"
            type="range"
            min="5"
            max={maxPlayers}
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="slider"
          />
          <div className="slider-range">
            <span>5</span>
            <span>{maxPlayers}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', marginBottom: '5px', color: tooltipStyle.color }}>
                        {payload[0].payload.fullName}
                      </p>
                      <p style={{ margin: '2px 0', color: tooltipStyle.color }}>Team: {payload[0].payload.team}</p>
                      <p style={{ margin: '2px 0', fontWeight: '600', color: tooltipStyle.color }}>
                        {label}: {payload[0].value}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="value" fill={color} name={label} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default SliderChart;

