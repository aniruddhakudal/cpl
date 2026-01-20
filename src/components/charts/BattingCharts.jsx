import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import ChartCard from '../ChartCard';
import SliderChart from './SliderChart';

const BattingCharts = ({ data, selectedSeason }) => {
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
  
  // Aggregate runs by player_id for Top Run Scorers chart
  const aggregatedRunScorers = useMemo(() => {
    const playerMap = new Map();
    
    data.forEach(player => {
      const playerId = player.player_id || player.name || 'Unknown';
      
      if (playerMap.has(playerId)) {
        // Aggregate runs and other cumulative stats
        const existing = playerMap.get(playerId);
        existing.total_runs += player.total_runs || 0;
        existing['4s'] += player['4s'] || 0;
        existing['6s'] += player['6s'] || 0;
        existing.ball_faced += player.ball_faced || 0;
        existing.innings += player.innings || 0;
        existing.not_out += player.not_out || 0;
        existing['50s'] += player['50s'] || 0;
        existing['100s'] += player['100s'] || 0;
        // Keep the highest score
        if (player.highest_run > existing.highest_run) {
          existing.highest_run = player.highest_run;
        }
        // Recalculate average and strike rate based on aggregated data
        if (existing.ball_faced > 0) {
          existing.strike_rate = (existing.total_runs / existing.ball_faced) * 100;
        }
        const dismissals = existing.innings - existing.not_out;
        if (dismissals > 0) {
          existing.average = existing.total_runs / dismissals;
        }
      } else {
        // First occurrence of this player
        playerMap.set(playerId, {
          player_id: playerId,
          name: player.name || 'Unknown',
          total_runs: player.total_runs || 0,
          strike_rate: player.strike_rate || 0,
          average: player.average || 0,
          '4s': player['4s'] || 0,
          '6s': player['6s'] || 0,
          '50s': player['50s'] || 0,
          '100s': player['100s'] || 0,
          highest_run: player.highest_run || 0,
          team_name: player.team_name || 'Unknown',
          ball_faced: player.ball_faced || 0,
          not_out: player.not_out || 0,
          innings: player.innings || 0
        });
      }
    });
    
    return Array.from(playerMap.values());
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
    // Aggregate 4s and 6s by player_id
    const playerMap = new Map();
    
    data.forEach(player => {
      const playerId = player.player_id || player.name || 'Unknown';
      const fours = player['4s'] || 0;
      const sixes = player['6s'] || 0;
      
      // Only process players with at least one boundary
      if (fours > 0 || sixes > 0) {
        if (playerMap.has(playerId)) {
          // Aggregate boundaries for existing player
          const existing = playerMap.get(playerId);
          existing['4s'] += fours;
          existing['6s'] += sixes;
          existing.total = existing['4s'] + existing['6s'];
        } else {
          // First occurrence of this player
          playerMap.set(playerId, {
            player_id: playerId,
            name: player.name || 'Unknown',
            '4s': fours,
            '6s': sixes,
            total: fours + sixes
          });
        }
      }
    });
    
    // Convert to array, sort by total boundaries, and format
    return Array.from(playerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        '4s': player['4s'],
        '6s': player['6s'],
        total: player.total
      }));
  }, [data]);

  const fiftiesAndHundreds = useMemo(() => {
    // Aggregate 30s, 50s and 100s by player_id
    const playerMap = new Map();
    
    data.forEach(player => {
      const playerId = player.player_id || player.name || 'Unknown';
      const thirties = player['30s'] || 0;
      const fifties = player['50s'] || 0;
      const hundreds = player['100s'] || 0;
      
      // Only process players with at least one 30, 50 or 100
      if (thirties > 0 || fifties > 0 || hundreds > 0) {
        if (playerMap.has(playerId)) {
          // Aggregate 30s, 50s and 100s for existing player
          const existing = playerMap.get(playerId);
          existing['30s'] += thirties;
          existing['50s'] += fifties;
          existing['100s'] += hundreds;
        } else {
          // First occurrence of this player
          playerMap.set(playerId, {
            player_id: playerId,
            name: player.name || 'Unknown',
            '30s': thirties,
            '50s': fifties,
            '100s': hundreds
          });
        }
      }
    });
    
    // Convert to array, sort by total count (30s + 50s + 100s), and format
    return Array.from(playerMap.values())
      .sort((a, b) => {
        const totalA = a['30s'] + a['50s'] + a['100s'];
        const totalB = b['30s'] + b['50s'] + b['100s'];
        return totalB - totalA; // Descending order
      })
      .map(player => ({
        name: player.name.length > 15 ? player.name.substring(0, 15) + '...' : player.name,
        fullName: player.name,
        '30s': player['30s'],
        '50s': player['50s'],
        '100s': player['100s']
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
        data={aggregatedRunScorers}
        title="Top Run Scorers (Interactive Slider)"
        dataKey="total_runs"
        sortKey="total_runs"
        color="#667eea"
        label="Total Runs"
      />

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
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{data.name}</p>
                      <p style={{ color: tooltipStyle.color }}>Team: {data.team}</p>
                      <p style={{ color: tooltipStyle.color }}>Average: {data.average}</p>
                      <p style={{ color: tooltipStyle.color }}>Strike Rate: {data.strikeRate}</p>
                      <p style={{ color: tooltipStyle.color }}>Total Runs: {data.runs}</p>
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
                    <div style={tooltipStyle}>
                      <p style={{ fontWeight: 'bold', color: tooltipStyle.color }}>{payload[0].payload.fullName}</p>
                      <p style={{ color: tooltipStyle.color }}>4s: {payload[0].payload['4s']}</p>
                      <p style={{ color: tooltipStyle.color }}>6s: {payload[0].payload['6s']}</p>
                      <p style={{ color: tooltipStyle.color }}>Total: {payload[0].payload.total}</p>
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

      <SliderChart
        data={data.filter(p => p.highest_run > 0)}
        title="Highest Individual Scores (Interactive Slider)"
        dataKey="highest_run"
        sortKey="highest_run"
        color="#43e97b"
        label="Highest Score"
      />

      {fiftiesAndHundreds.length > 0 && (
        <ChartCard title="30s, 50s and 100s">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={fiftiesAndHundreds}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="30s" fill="#4facfe" name="30s" />
              <Bar dataKey="50s" fill="#fee140" name="50s" />
              <Bar dataKey="100s" fill="#fa709a" name="100s" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {selectedSeason && selectedSeason !== 'ALL' && (
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
      )}
    </>
  );
};

export default BattingCharts;

