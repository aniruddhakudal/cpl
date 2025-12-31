import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import ChartCard from '../ChartCard';

const TeamComparison = ({ data }) => {
  const teamStats = useMemo(() => {
    const teamMap = {};
    
    // Aggregate batting stats
    data.batting.forEach(player => {
      const team = player.team_name;
      if (!teamMap[team]) {
        teamMap[team] = {
          name: team,
          runs: 0,
          wickets: 0,
          dismissals: 0,
          mvpPoints: 0,
          players: 0
        };
      }
      teamMap[team].runs += player.total_runs || 0;
      teamMap[team].players += 1;
    });

    // Aggregate bowling stats
    data.bowling.forEach(player => {
      const team = player.team_name;
      if (teamMap[team]) {
        teamMap[team].wickets += player.total_wickets || 0;
      }
    });

    // Aggregate fielding stats
    data.fielding.forEach(player => {
      const team = player.team_name;
      if (teamMap[team]) {
        teamMap[team].dismissals += player.total_dismissal || 0;
      }
    });

    // Aggregate MVP stats
    data.mvp.forEach(player => {
      const team = player['Team Name'];
      if (teamMap[team]) {
        teamMap[team].mvpPoints += player.Total || 0;
      }
    });

    return Object.values(teamMap).map(team => ({
      ...team,
      avgMVP: team.players > 0 ? parseFloat((team.mvpPoints / team.players).toFixed(2)) : 0
    }));
  }, [data]);

  const teamComparison = useMemo(() => {
    return teamStats.map(team => ({
      name: team.name,
      runs: team.runs,
      wickets: team.wickets,
      dismissals: team.dismissals,
      mvpPoints: parseFloat(team.mvpPoints.toFixed(2))
    }));
  }, [teamStats]);

  const normalizedData = useMemo(() => {
    if (teamStats.length === 0) return [];
    
    const maxRuns = Math.max(...teamStats.map(t => t.runs));
    const maxWickets = Math.max(...teamStats.map(t => t.wickets));
    const maxDismissals = Math.max(...teamStats.map(t => t.dismissals));
    const maxMVP = Math.max(...teamStats.map(t => t.mvpPoints));

    return teamStats.map(team => ({
      name: team.name,
      runs: maxRuns > 0 ? parseFloat(((team.runs / maxRuns) * 100).toFixed(2)) : 0,
      wickets: maxWickets > 0 ? parseFloat(((team.wickets / maxWickets) * 100).toFixed(2)) : 0,
      dismissals: maxDismissals > 0 ? parseFloat(((team.dismissals / maxDismissals) * 100).toFixed(2)) : 0,
      mvpPoints: maxMVP > 0 ? parseFloat(((team.mvpPoints / maxMVP) * 100).toFixed(2)) : 0
    }));
  }, [teamStats]);

  return (
    <>
      <ChartCard title="Team Performance Comparison">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="runs" fill="#667eea" name="Total Runs" />
            <Bar dataKey="wickets" fill="#764ba2" name="Total Wickets" />
            <Bar dataKey="dismissals" fill="#43e97b" name="Total Dismissals" />
            <Bar dataKey="mvpPoints" fill="#f093fb" name="MVP Points" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Team Performance Radar (Normalized)">
        <ResponsiveContainer width="100%" height={500}>
          <RadarChart data={normalizedData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar name="Runs" dataKey="runs" stroke="#667eea" fill="#667eea" fillOpacity={0.6} />
            <Radar name="Wickets" dataKey="wickets" stroke="#764ba2" fill="#764ba2" fillOpacity={0.6} />
            <Radar name="Dismissals" dataKey="dismissals" stroke="#43e97b" fill="#43e97b" fillOpacity={0.6} />
            <Radar name="MVP Points" dataKey="mvpPoints" stroke="#f093fb" fill="#f093fb" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Total Runs by Team">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="runs" fill="#667eea" name="Total Runs" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Total Wickets by Team">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={teamStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="wickets" fill="#764ba2" name="Total Wickets" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </>
  );
};

export default TeamComparison;

