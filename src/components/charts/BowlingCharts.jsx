import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, LineChart, Line
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ChartCard';
import SliderChart from './SliderChart';

const BowlingCharts = ({ data }) => {
  const { theme } = useTheme();
  
  const tooltipStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(30, 30, 46, 0.98)' : 'rgba(255, 255, 255, 0.95)',
    padding: '10px',
    border: theme === 'dark' ? '1px solid #667eea' : '1px solid #ccc',
    borderRadius: '4px',
    zIndex: 1000,
    position: 'relative',
    color: theme === 'dark' ? '#e0e0e0' : '#333'
  };
  
  const topWicketTakers = useMemo(() => {
    return [...data]
      .filter(p => p.total_wickets > 0)
      .sort((a, b) => b.total_wickets - a.total_wickets)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        wickets: player.total_wickets,
        team: player.team_name
      }));
  }, [data]);

  const economyVsWickets = useMemo(() => {
    return data
      .filter(p => p.economy > 0 && p.total_wickets > 0)
      .map(player => ({
        name: player.name,
        economy: parseFloat(player.economy.toFixed(2)),
        wickets: player.total_wickets,
        team: player.team_name,
        average: player.avg || 0
      }));
  }, [data]);

  const bestBowlingFigures = useMemo(() => {
    return [...data]
      .filter(p => p.highest_wicket > 0)
      .sort((a, b) => {
        if (b.highest_wicket !== a.highest_wicket) {
          return b.highest_wicket - a.highest_wicket;
        }
        return (a.runs || 0) - (b.runs || 0);
      })
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        wickets: player.highest_wicket,
        runs: player.runs || 0,
        team: player.team_name
      }));
  }, [data]);

  const economyRate = useMemo(() => {
    return [...data]
      .filter(p => p.economy > 0 && p.balls > 0)
      .sort((a, b) => a.economy - b.economy)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        economy: parseFloat(player.economy.toFixed(2)),
        team: player.team_name
      }));
  }, [data]);

  const bowlingAverage = useMemo(() => {
    return [...data]
      .filter(p => p.avg > 0 && p.total_wickets > 0)
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        average: parseFloat(player.avg.toFixed(2)),
        wickets: player.total_wickets,
        team: player.team_name
      }));
  }, [data]);

  const teamWickets = useMemo(() => {
    const teamMap = {};
    data.forEach(player => {
      if (!teamMap[player.team_name]) {
        teamMap[player.team_name] = 0;
      }
      teamMap[player.team_name] += player.total_wickets || 0;
    });
    return Object.entries(teamMap)
      .map(([name, wickets]) => ({ name, wickets }))
      .sort((a, b) => b.wickets - a.wickets);
  }, [data]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  return (
    <>
      <SliderChart
        data={data.filter(p => p.total_wickets > 0)}
        title="Top Wicket Takers (Interactive Slider)"
        dataKey="total_wickets"
        sortKey="total_wickets"
        color="#764ba2"
        label="Total Wickets"
      />
      <ChartCard title="Top Wicket Takers">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topWicketTakers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{payload[0].payload.fullName}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {payload[0].payload.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Wickets: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="wickets" fill="#764ba2" name="Total Wickets" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Economy Rate vs Wickets">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="economy" 
              name="Economy" 
              label={{ value: 'Economy Rate', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="wickets" 
              name="Wickets" 
              label={{ value: 'Total Wickets', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{data.name}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {data.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Economy: {data.economy}</p>
                      <p style={{ color: tooltipStyle.color }}>Wickets: {data.wickets}</p>
                      <p style={{ color: tooltipStyle.color }}>Average: {data.average.toFixed(2)}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Bowlers" data={economyVsWickets} fill="#764ba2">
              {economyVsWickets.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Best Bowling Figures">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={bestBowlingFigures}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{data.fullName}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {data.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Best: {data.wickets}/{data.runs}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="wickets" fill="#f093fb" name="Wickets" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Best Economy Rates">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={economyRate}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis reversed />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{payload[0].payload.fullName}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {payload[0].payload.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Economy: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="economy" fill="#4facfe" name="Economy Rate" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Best Bowling Averages">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={bowlingAverage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis reversed />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{data.fullName}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {data.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Average: {data.average}</p>
                      <p style={{ color: tooltipStyle.color }}>Wickets: {data.wickets}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="average" fill="#00f2fe" name="Bowling Average" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Total Wickets by Team">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamWickets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="wickets" fill="#43e97b" name="Total Wickets" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
};

export default BowlingCharts;

