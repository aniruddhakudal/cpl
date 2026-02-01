import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TournamentSelector from '../components/TournamentSelector';
import SeasonSelector from '../components/SeasonSelector';
import StatSelector from '../components/StatSelector';
import BattingCharts from '../components/charts/BattingCharts';
import BowlingCharts from '../components/charts/BowlingCharts';
import FieldingCharts from '../components/charts/FieldingCharts';
import MVPCharts from '../components/charts/MVPCharts';
import ThemeToggle from '../components/ThemeToggle';
import '../App.css';

// Transform API data to match the format expected by BowlingCharts component
const transformBowlingData = (apiData) => {
  return apiData.map(player => {
    // Handle different possible field names from the API
    const getValue = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
          return obj[key];
        }
      }
      return 0;
    };

    // Normalize numeric values
    const normalizeNumber = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      player_id: getValue(player, 'player_id', 'id', 'playerId', 'ID', 'playerID') || getValue(player, 'name', 'player_name', 'player', 'Name', 'Player') || 'Unknown',
      name: getValue(player, 'name', 'player_name', 'player', 'Name', 'Player') || 'Unknown',
      total_wickets: normalizeNumber(getValue(player, 'total_wickets', 'wickets', 'Wickets', 'totalWickets')),
      economy: normalizeNumber(getValue(player, 'economy', 'economy_rate', 'Economy', 'economyRate', 'ER', 'er')),
      avg: normalizeNumber(getValue(player, 'avg', 'average', 'Average', 'bowlingAverage', 'bowling_avg')),
      highest_wicket: normalizeNumber(getValue(player, 'highest_wicket', 'best_wickets', 'bestWickets', 'Best', 'best')),
      runs: normalizeNumber(getValue(player, 'runs', 'total_runs', 'Runs', 'totalRuns', 'runs_conceded')),
      balls: normalizeNumber(getValue(player, 'balls', 'balls_bowled', 'Balls', 'ballsBowled', 'total_balls')),
      team_name: getValue(player, 'team_name', 'team', 'Team', 'teamName') || 'Unknown'
    };
  });
};

// Transform API data to match the format expected by BattingCharts component
const transformBattingData = (apiData) => {
  return apiData.map(player => {
    // Handle different possible field names from the API
    const getValue = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
          return obj[key];
        }
      }
      return 0;
    };

    // Normalize numeric values
    const normalizeNumber = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    return {
      player_id: getValue(player, 'player_id', 'id', 'playerId', 'ID', 'playerID') || getValue(player, 'name', 'player_name', 'player', 'Name', 'Player') || 'Unknown',
      name: getValue(player, 'name', 'player_name', 'player', 'Name', 'Player') || 'Unknown',
      total_runs: normalizeNumber(getValue(player, 'total_runs', 'runs', 'Runs', 'totalRuns')),
      strike_rate: normalizeNumber(getValue(player, 'strike_rate', 'strikeRate', 'SR', 'sr', 'strikeRate')),
      average: normalizeNumber(getValue(player, 'average', 'avg', 'Average', 'battingAverage')),
      '4s': normalizeNumber(getValue(player, '4s', 'fours', 'Fours', 'fours')),
      '6s': normalizeNumber(getValue(player, '6s', 'sixes', 'Sixes', 'sixes')),
      '30s': normalizeNumber(getValue(player, '30s', 'thirties', 'Thirties', 'thirties')),
      '50s': normalizeNumber(getValue(player, '50s', 'fifties', 'Fifties', 'fifties')),
      '100s': normalizeNumber(getValue(player, '100s', 'hundreds', 'Hundreds', 'centuries')),
      highest_run: normalizeNumber(getValue(player, 'highest_run', 'highestRun', 'highest_score', 'highestScore', 'HS', 'hs')),
      team_name: getValue(player, 'team_name', 'team', 'Team', 'teamName') || 'Unknown',
      ball_faced: normalizeNumber(getValue(player, 'ball_faced', 'ballsFaced', 'BF', 'bf')),
      not_out: normalizeNumber(getValue(player, 'not_out', 'notOut', 'NO', 'no')),
      innings: normalizeNumber(getValue(player, 'innings', 'Innings', 'matches', 'Matches'))
    };
  });
};

// Transform API data to match the format expected by FieldingCharts component
const transformFieldingData = (apiData) => {
  return apiData.map(player => {
    const getValue = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
          return obj[key];
        }
      }
      return 0;
    };
    const normalizeNumber = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    return {
      player_id: getValue(player, 'player_id', 'id', 'playerId') || getValue(player, 'name', 'player_name') || 'Unknown',
      name: getValue(player, 'name', 'player_name', 'player', 'Name', 'Player') || 'Unknown',
      total_dismissal: normalizeNumber(getValue(player, 'total_dismissal', 'dismissals', 'totalDismissals', 'Dismissals')),
      total_catches: normalizeNumber(getValue(player, 'total_catches', 'catches', 'Catches', 'totalCatches')),
      run_outs: normalizeNumber(getValue(player, 'run_outs', 'runOuts', 'Run Outs', 'run_outs')),
      team_name: getValue(player, 'team_name', 'team', 'Team', 'teamName') || 'Unknown'
    };
  });
};

// Transform API data to match the format expected by MVPCharts component
const transformMVPData = (apiData) => {
  return apiData.map(player => {
    const getValue = (obj, ...keys) => {
      for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
          return obj[key];
        }
      }
      return 0;
    };
    const normalizeNumber = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    return {
      'Player Name': getValue(player, 'player_name', 'name', 'player', 'Player Name', 'playerName') || 'Unknown',
      'Team Name': getValue(player, 'team_name', 'team', 'Team', 'Team Name', 'teamName') || 'Unknown',
      Total: normalizeNumber(getValue(player, 'total', 'Total', 'mvp_points', 'mvpPoints', 'total_points', 'totalPoints')),
      Batting: normalizeNumber(getValue(player, 'batting', 'Batting', 'batting_points', 'battingPoints')),
      Bowling: normalizeNumber(getValue(player, 'bowling', 'Bowling', 'bowling_points', 'bowlingPoints')),
      Fielding: normalizeNumber(getValue(player, 'fielding', 'Fielding', 'fielding_points', 'fieldingPoints'))
    };
  });
};

const ALL_SEASON = { id: 'ALL', data: null };

const StatsPage = () => {
  const { entity, cohort } = useParams();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(ALL_SEASON);
  const [category, setCategory] = useState('ALL');
  const [selectedStat, setSelectedStat] = useState(null);
  const [battingData, setBattingData] = useState(null);
  const [bowlingData, setBowlingData] = useState(null);
  const [fieldingData, setFieldingData] = useState(null);
  const [mvpData, setMvpData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch stats when a stat type is selected and all required values are available
  useEffect(() => {
    const fetchStats = async () => {
      // Only fetch if a stat is selected and entity/cohort are available
      // Allow "ALL" for category and season
      if (!selectedStat || !category || !selectedSeason?.id || !entity || !cohort) {
        setBattingData(null);
        setBowlingData(null);
        setFieldingData(null);
        setMvpData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Build URL with parameters, skipping "ALL" values
        let url = '';
        if (selectedStat === 'Batting') {
          url = `https://cpl-backend-h9oc.onrender.com/v1/sports/cricket/batting_stats?entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&limit=0`;
        } else if (selectedStat === 'Bowling') {
          url = `https://cpl-backend-h9oc.onrender.com/v1/sports/cricket/bowling_stats?entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&limit=0`;
        } else if (selectedStat === 'Fielding') {
          url = `https://cpl-backend-h9oc.onrender.com/v1/sports/cricket/fielding_stats?entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&limit=0`;
        } else if (selectedStat === 'MVP') {
          url = `https://cpl-backend-h9oc.onrender.com/v1/sports/cricket/mvp_stats?entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&limit=0`;
        } else {
          setBattingData(null);
          setBowlingData(null);
          setFieldingData(null);
          setMvpData(null);
          setLoading(false);
          return;
        }
        
        // Only add category if it's not "ALL"
        if (category && category !== 'ALL') {
          url += `&category=${encodeURIComponent(category)}`;
        }
        
        // Only add season if it's not "ALL"
        if (selectedSeason?.id && selectedSeason.id !== 'ALL') {
          url += `&season=${encodeURIComponent(selectedSeason.id)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        // Handle different possible response structures
        let statsData = result.data || result.batting_stats || result.bowling_stats || result.fielding_stats || result.mvp_stats || result;
        
        // If it's wrapped in another property, try common names
        if (!Array.isArray(statsData)) {
          statsData = statsData.players || statsData.stats || statsData.results || statsData;
        }
        
        // Ensure it's an array
        if (!Array.isArray(statsData)) {
          throw new Error('Unexpected data format from API');
        }
        
        // Transform the data based on stat type
        if (selectedStat === 'Batting') {
          const transformedData = transformBattingData(statsData);
          setBattingData(transformedData);
          setBowlingData(null);
          setFieldingData(null);
          setMvpData(null);
        } else if (selectedStat === 'Bowling') {
          const transformedData = transformBowlingData(statsData);
          setBowlingData(transformedData);
          setBattingData(null);
          setFieldingData(null);
          setMvpData(null);
        } else if (selectedStat === 'Fielding') {
          const transformedData = transformFieldingData(statsData);
          setFieldingData(transformedData);
          setBattingData(null);
          setBowlingData(null);
          setMvpData(null);
        } else if (selectedStat === 'MVP') {
          const transformedData = transformMVPData(statsData);
          setMvpData(transformedData);
          setBattingData(null);
          setBowlingData(null);
          setFieldingData(null);
        }
      } catch (err) {
        const statName = selectedStat === 'Batting' ? 'batting' : selectedStat === 'Bowling' ? 'bowling' : selectedStat === 'Fielding' ? 'fielding' : selectedStat === 'MVP' ? 'MVP' : 'statistics';
        setError(`Failed to load ${statName} statistics: ${err.message}`);
        console.error(`Error fetching ${statName} stats:`, err);
        setBattingData(null);
        setBowlingData(null);
        setFieldingData(null);
        setMvpData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedStat, category, selectedSeason?.id, entity, cohort]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏏 {entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : ''} {cohort ? cohort.charAt(0).toUpperCase() + cohort.slice(1) : ''} Stats</h1>
        <div className="selectors-container">
          <TournamentSelector 
            entity={entity}
            cohort={cohort}
            onTournamentChange={(tournamentId, tournament) => {
              setSelectedTournament({ id: tournamentId, data: tournament });
              setCategory(tournamentId); // Set category when tournament is selected
            }}
          />
          <SeasonSelector 
            entity={entity}
            cohort={cohort}
            category={category}
            onSeasonChange={(seasonId, season) => {
              setSelectedSeason({ id: seasonId, data: season });
            }}
          />
          <StatSelector 
            category={category}
            selectedSeason={selectedSeason?.id}
            onStatChange={(stat) => {
              setSelectedStat(stat);
            }}
          />
        </div>        
      </header>
      
      {loading && (
        <div className="loading-container" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
          <p>Loading {selectedStat?.toLowerCase() || 'statistics'}...</p>
        </div>
      )}

      {error && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && selectedStat === 'Batting' && battingData && battingData.length > 0 && (
        <div className="all-charts-container" style={{ padding: '20px' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              🏏 Batting Statistics
            </h2>
            <BattingCharts data={battingData} selectedSeason={selectedSeason?.id} />
          </section>
        </div>
      )}

      {!loading && !error && selectedStat === 'Bowling' && bowlingData && bowlingData.length > 0 && (
        <div className="all-charts-container" style={{ padding: '20px' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              🎯 Bowling Statistics
            </h2>
            <BowlingCharts data={bowlingData} />
          </section>
        </div>
      )}

      {!loading && !error && selectedStat === 'Fielding' && fieldingData && fieldingData.length > 0 && (
        <div className="all-charts-container" style={{ padding: '20px' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              🧤 Fielding Statistics
            </h2>
            <FieldingCharts data={fieldingData} />
          </section>
        </div>
      )}

      {!loading && !error && selectedStat === 'MVP' && mvpData && mvpData.length > 0 && (
        <div className="all-charts-container" style={{ padding: '20px' }}>
          <section style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              ⭐ MVP Statistics
            </h2>
            <MVPCharts data={mvpData} />
          </section>
        </div>
      )}

      {!loading && !error && selectedStat === 'Batting' && battingData && battingData.length === 0 && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>No Data Available</h2>
          <p>No batting statistics found for the selected filters.</p>
        </div>
      )}

      {!loading && !error && selectedStat === 'Bowling' && bowlingData && bowlingData.length === 0 && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>No Data Available</h2>
          <p>No bowling statistics found for the selected filters.</p>
        </div>
      )}

      {!loading && !error && selectedStat === 'Fielding' && fieldingData && fieldingData.length === 0 && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>No Data Available</h2>
          <p>No fielding statistics found for the selected filters.</p>
        </div>
      )}

      {!loading && !error && selectedStat === 'MVP' && mvpData && mvpData.length === 0 && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>No Data Available</h2>
          <p>No MVP statistics found for the selected filters.</p>
        </div>
      )}
    </div>
  );
};

export default StatsPage;
