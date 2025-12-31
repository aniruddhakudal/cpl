import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import ChartCard from '../ChartCard';
import SliderChart from './SliderChart';

const BattingCharts = ({ data }) => {
  const topRunScorers = useMemo(() => {
    return [...data]
      .sort((a, b) => b.total_runs - a.total_runs)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        runs: player.total_runs,
        team: player.team_name
      }));
  }, [data]);

  const strikeRateVsAverage = useMemo(() => {
    return data
      .filter(p => p.strike_rate > 0 && p.average > 0 && p.total_runs > 20)
      .map(player => ({
        name: player.name,
        strikeRate: parseFloat(player.strike_rate.toFixed(2)),
        average: parseFloat(player.average.toFixed(2)),
        runs: player.total_runs,
        team: player.team_name
      }));
  }, [data]);

  const boundaries = useMemo(() => {
    return [...data]
      .filter(p => (p['4s'] > 0 || p['6s'] > 0))
      .sort((a, b) => (b['4s'] + b['6s']) - (a['4s'] + a['6s']))
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        '4s': player['4s'],
        '6s': player['6s'],
        total: player['4s'] + player['6s']
      }));
  }, [data]);

  const fiftiesAndHundreds = useMemo(() => {
    const players = data.filter(p => p['50s'] > 0 || p['100s'] > 0);
    return players.map(player => ({
      name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
      fullName: player.name,
      '50s': player['50s'],
      '100s': player['100s']
    }));
  }, [data]);

  const highestScores = useMemo(() => {
    return [...data]
      .filter(p => p.highest_run > 0)
      .sort((a, b) => b.highest_run - a.highest_run)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        score: player.highest_run,
        team: player.team_name
      }));
  }, [data]);

  const teamRuns = useMemo(() => {
    const teamMap = {};
    data.forEach(player => {
      if (!teamMap[player.team_name]) {
        teamMap[player.team_name] = 0;
      }
      teamMap[player.team_name] += player.total_runs;
    });
    return Object.entries(teamMap)
      .map(([name, runs]) => ({ name, runs }))
      .sort((a, b) => b.runs - a.runs);
  }, [data]);

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140'];

  return (
    <>
      <SliderChart
        data={data}
        title="Top Run Scorers (Interactive Slider)"
        dataKey="total_runs"
        sortKey="total_runs"
        color="#667eea"
        label="Total Runs"
      />
      <ChartCard title="Top Run Scorers">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topRunScorers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{payload[0].payload.fullName}</p>
                      <p>Team: {payload[0].payload.team}</p>
                      <p>Runs: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="runs" fill="#667eea" name="Total Runs" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Strike Rate vs Average">
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="average" 
              name="Average" 
              label={{ value: 'Batting Average', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number" 
              dataKey="strikeRate" 
              name="Strike Rate" 
              label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{data.name}</p>
                      <p>Team: {data.team}</p>
                      <p>Average: {data.average}</p>
                      <p>Strike Rate: {data.strikeRate}</p>
                      <p>Total Runs: {data.runs}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Players" data={strikeRateVsAverage} fill="#667eea">
              {strikeRateVsAverage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Boundaries (4s and 6s)">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={boundaries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{payload[0].payload.fullName}</p>
                      <p>4s: {payload[0].payload['4s']}</p>
                      <p>6s: {payload[0].payload['6s']}</p>
                      <p>Total: {payload[0].payload.total}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="4s" fill="#4facfe" name="4s" />
            <Bar dataKey="6s" fill="#f093fb" name="6s" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Highest Individual Scores">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={highestScores}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}>
                      <p style={{ fontWeight: 'bold' }}>{payload[0].payload.fullName}</p>
                      <p>Team: {payload[0].payload.team}</p>
                      <p>Highest Score: {payload[0].value}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="score" fill="#43e97b" name="Highest Score" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {fiftiesAndHundreds.length > 0 && (
        <ChartCard title="50s and 100s">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={fiftiesAndHundreds}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="50s" fill="#fee140" name="50s" />
              <Bar dataKey="100s" fill="#fa709a" name="100s" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Total Runs by Team">
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={teamRuns}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="runs"
            >
              {teamRuns.map((entry, index) => (
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

export default BattingCharts;

