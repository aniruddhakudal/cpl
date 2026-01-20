import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import ChartCard from '../ChartCard';
import SliderChart from './SliderChart';

const MVPCharts = ({ data }) => {
  const topMVPs = useMemo(() => {
    return [...data]
      .filter(p => p.Total > 0)
      .sort((a, b) => b.Total - a.Total)
      .slice(0, 15)
      .map(player => ({
        name: player['Player Name'].length > 15 
          ? player['Player Name'].substring(0, 15) + '...' 
          : player['Player Name'],
        fullName: player['Player Name'],
        total: parseFloat(player.Total.toFixed(2)),
        batting: parseFloat(player.Batting.toFixed(2)),
        bowling: parseFloat(player.Bowling.toFixed(2)),
        fielding: parseFloat(player.Fielding.toFixed(2)),
        team: player['Team Name']
      }));
  }, [data]);

  const mvpBreakdown = useMemo(() => {
    return topMVPs.slice(0, 10).map(player => ({
      name: player.name,
      fullName: player.fullName,
      batting: player.batting,
      bowling: player.bowling,
      fielding: player.fielding
    }));
  }, [topMVPs]);

  const teamMVPs = useMemo(() => {
    const teamMap = {};
    data.forEach(player => {
      const team = player['Team Name'];
      if (!teamMap[team]) {
        teamMap[team] = { total: 0, count: 0 };
      }
      teamMap[team].total += player.Total || 0;
      teamMap[team].count += 1;
    });
    return Object.entries(teamMap)
      .map(([name, stats]) => ({ 
        name, 
        total: parseFloat((stats.total / stats.count).toFixed(2)),
        players: stats.count
      }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  // Transform MVP data for slider chart
  const mvpDataForSlider = useMemo(() => {
    return data
      .filter(p => p.Total > 0)
      .map(player => ({
        name: player['Player Name'],
        team_name: player['Team Name'],
        Total: player.Total
      }));
  }, [data]);

  return (
    <>
      <SliderChart
        data={mvpDataForSlider}
        title="Top MVP Leaders (Interactive Slider)"
        dataKey="Total"
        sortKey="Total"
        color="#667eea"
        label="MVP Points"
      />
      <ChartCard title="Top MVP Leaders">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topMVPs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 1000,
                      position: 'relative'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{data.fullName}</p>
                      <p>Team: {data.team}</p>
                      <p>Total Points: {data.total}</p>
                      <p>Batting: {data.batting}</p>
                      <p>Bowling: {data.bowling}</p>
                      <p>Fielding: {data.fielding}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="total" fill="#667eea" name="Total MVP Points" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="MVP Points Breakdown (Top 10)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mvpBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 1000,
                      position: 'relative'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{data.fullName}</p>
                      <p>Batting: {data.batting}</p>
                      <p>Bowling: {data.bowling}</p>
                      <p>Fielding: {data.fielding}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="batting" stackId="a" fill="#4facfe" name="Batting Points" />
            <Bar dataKey="bowling" stackId="a" fill="#f093fb" name="Bowling Points" />
            <Bar dataKey="fielding" stackId="a" fill="#43e97b" name="Fielding Points" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Average MVP Points by Team">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamMVPs}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      zIndex: 1000,
                      position: 'relative'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{data.name}</p>
                      <p>Avg MVP Points: {data.total}</p>
                      <p>Players: {data.players}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="total" fill="#764ba2" name="Average MVP Points" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
};

export default MVPCharts;

