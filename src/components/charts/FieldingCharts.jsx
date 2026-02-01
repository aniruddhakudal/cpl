import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ChartCard';

const FieldingCharts = ({ data }) => {
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
  
  const topFielders = useMemo(() => {
    return [...data]
      .filter(p => p.total_dismissal > 0)
      .sort((a, b) => b.total_dismissal - a.total_dismissal)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        dismissals: player.total_dismissal,
        catches: player.total_catches,
        runOuts: player.run_outs,
        team: player.team_name
      }));
  }, [data]);

  const catches = useMemo(() => {
    return [...data]
      .filter(p => p.total_catches > 0)
      .sort((a, b) => b.total_catches - a.total_catches)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        catches: player.total_catches,
        team: player.team_name
      }));
  }, [data]);

  const runOuts = useMemo(() => {
    return [...data]
      .filter(p => p.run_outs > 0)
      .sort((a, b) => b.run_outs - a.run_outs)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        runOuts: player.run_outs,
        team: player.team_name
      }));
  }, [data]);

  const teamDismissals = useMemo(() => {
    const teamMap = {};
    data.forEach(player => {
      if (!teamMap[player.team_name]) {
        teamMap[player.team_name] = 0;
      }
      teamMap[player.team_name] += player.total_dismissal || 0;
    });
    return Object.entries(teamMap)
      .map(([name, dismissals]) => ({ name, dismissals }))
      .sort((a, b) => b.dismissals - a.dismissals);
  }, [data]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  return (
    <>
      <ChartCard title="Top Fielders (Total Dismissals)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topFielders}>
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
                      <p style={{ color: tooltipStyle.color }}>Total Dismissals: {data.dismissals}</p>
                      <p style={{ color: tooltipStyle.color }}>Catches: {data.catches}</p>
                      <p style={{ color: tooltipStyle.color }}>Run Outs: {data.runOuts}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="dismissals" fill="#43e97b" name="Total Dismissals" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Most Catches">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={catches}>
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
                      <p style={{ color: tooltipStyle.color }}>Catches: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="catches" fill="#4facfe" name="Catches" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {runOuts.length > 0 && (
        <ChartCard title="Most Run Outs">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={runOuts}>
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
                        <p style={{ color: tooltipStyle.color }}>Run Outs: {payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Bar dataKey="runOuts" fill="#fa709a" name="Run Outs" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Total Dismissals by Team">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={teamDismissals}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="dismissals"
            >
              {teamDismissals.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
};

export default FieldingCharts;

