import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTournaments } from '../utils/tournamentLoader';
import './TournamentSelector.css';

// Helper function to convert all letters to uppercase
const capitalizeAll = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.toUpperCase();
};

const TournamentSelector = ({ onTournamentChange, entity: propEntity, cohort: propCohort }) => {
  const params = useParams();
  // Use props if provided, otherwise get from URL params (both must be defined for fetch)
  const entity = propEntity ?? params.entity ?? '';
  const cohort = propCohort ?? params.cohort ?? '';
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tournaments when entity or cohort changes
  useEffect(() => {
    const loadTournaments = async () => {
      if (!entity || !cohort) {
        setTournaments([]);
        setSelectedTournament('');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchTournaments(entity, cohort);
        setTournaments(data);
        
        // Ensure "ALL" is selected by default if not already set
        if (selectedTournament !== 'ALL') {
          setSelectedTournament('ALL');
          if (onTournamentChange) {
            onTournamentChange('ALL', null);
          }
        }
      } catch (err) {
        setError(`Failed to load tournaments: ${err.message}`);
        console.error('Error loading tournaments:', err);
        setTournaments([]);
        setSelectedTournament('');
      } finally {
        setLoading(false);
      }
    };

    loadTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, cohort]);

  const handleTournamentChange = (e) => {
    const tournamentValue = e.target.value;
    setSelectedTournament(tournamentValue);
    
    // tournaments is an array of category values (strings)
    // Find the selected value in the array
    const tournament = tournaments.find(t => {
      const value = typeof t === 'string' ? t : (t.category || t.id || t.tournament_id || t.name || '');
      return String(value) === String(tournamentValue);
    });
    
    if (onTournamentChange) {
      onTournamentChange(tournamentValue, tournament);
    }
  };

  return (
    <div className="tournament-selector">
      <div className="selector-group">
        <label htmlFor="tournament-select">Tournament</label>
        <select
          id="tournament-select"
          value={selectedTournament}
          onChange={handleTournamentChange}
          className="selector-dropdown"
          disabled={loading || tournaments.length === 0}
        >
          {loading ? (
            <option value="">Loading tournaments...</option>
          ) : tournaments.length === 0 ? (
            <option value="">No tournaments available</option>
          ) : (
            <>
              <option value="ALL">ALL</option>
              {tournaments.map((tournament, index) => {
                // tournaments is an array of category values (strings from the "values" array)
                const categoryValue = typeof tournament === 'string' 
                  ? tournament 
                  : (tournament.category || tournament.id || tournament.tournament_id || tournament.name || `tournament-${index}`);
                const displayName = typeof tournament === 'string' 
                  ? tournament 
                  : (tournament.category || tournament.name || tournament.title || `Tournament ${index + 1}`);
                // Convert all letters to uppercase for display
                const capitalizedDisplayName = capitalizeAll(displayName);
                return (
                  <option key={categoryValue} value={categoryValue}>
                    {capitalizedDisplayName}
                  </option>
                );
              })}
            </>
          )}
        </select>
        {error && <span className="error-message">{error}</span>}
      </div>
    </div>
  );
};

export default TournamentSelector;

