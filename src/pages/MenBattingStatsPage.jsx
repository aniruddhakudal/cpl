import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import TournamentSelector from '../components/TournamentSelector';
import SeasonSelector from '../components/SeasonSelector';
import StatSelector from '../components/StatSelector';
import BattingCharts from '../components/charts/BattingCharts';
import ThemeToggle from '../components/ThemeToggle';
import '../App.css';

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

const MenBattingStatsPage = () => {
  const { entity, cohort } = useParams();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [category, setCategory] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null);
  const [battingData, setBattingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch batting stats when "Batting" is selected and all required values are available
  useEffect(() => {
    const fetchBattingStats = async () => {
      // Only fetch if "Batting" is selected and entity/cohort are available
      // Allow "ALL" for category and season
      if (selectedStat !== 'Batting' || !category || !selectedSeason?.id || !entity || !cohort) {
        setBattingData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Build URL with parameters, skipping "ALL" values
        let url = `https://cpl-backend-h9oc.onrender.com/v1/sports/cricket/batting_stats?entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&limit=0`;
        
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
        let battingData = result.data || result.batting_stats || result;
        
        // If it's wrapped in another property, try common names
        if (!Array.isArray(battingData)) {
          battingData = battingData.players || battingData.stats || battingData.results || battingData;
        }
        
        // Ensure it's an array
        if (!Array.isArray(battingData)) {
          throw new Error('Unexpected data format from API');
        }
        
        // Transform the data to match expected format
        const transformedData = transformBattingData(battingData);
        setBattingData(transformedData);
      } catch (err) {
        setError(`Failed to load batting statistics: ${err.message}`);
        console.error('Error fetching batting stats:', err);
        setBattingData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBattingStats();
  }, [selectedStat, category, selectedSeason?.id, entity, cohort]);

  return (
    <div className="app">
      <ThemeToggle />
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
          <p>Loading batting statistics...</p>
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
            <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
              🏏 Batting Statistics
            </h2>
            <BattingCharts data={battingData} selectedSeason={selectedSeason?.id} />
          </section>
        </div>
      )}

      {!loading && !error && selectedStat === 'Batting' && battingData && battingData.length === 0 && (
        <div className="error-container" style={{ minHeight: '200px' }}>
          <h2>No Data Available</h2>
          <p>No batting statistics found for the selected filters.</p>
        </div>
      )}
    </div>
  );
};

export default MenBattingStatsPage;

