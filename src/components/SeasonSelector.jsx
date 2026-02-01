import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSeasons } from '../utils/tournamentLoader';
import './TournamentSelector.css';

// Helper function to convert all letters to uppercase
const capitalizeAll = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.toUpperCase();
};

const SeasonSelector = ({ onSeasonChange, entity: propEntity, cohort: propCohort, category }) => {
  const params = useParams();
  // Use props if provided, otherwise get from URL params
  const entity = propEntity || params.entity;
  const cohort = propCohort || params.cohort;
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch seasons when entity, cohort, or category changes
  useEffect(() => {
    const loadSeasons = async () => {
      if (!entity || !cohort) {
        setSeasons([]);
        setSelectedSeason('');
        return;
      }

      // Reset selection to "ALL" when category changes
      if (category) {
        setSelectedSeason('ALL');
        if (onSeasonChange) {
          onSeasonChange('ALL', null);
        }
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchSeasons(entity, cohort, category);
        
        // Sort seasons in descending order
        const sortedData = [...data].sort((a, b) => {
          const aValue = typeof a === 'string' ? a : (a.season || a.id || a.name || '');
          const bValue = typeof b === 'string' ? b : (b.season || b.id || b.name || '');
          
          // Try to parse as numbers for numeric comparison, otherwise use string comparison
          const aNum = parseFloat(aValue);
          const bNum = parseFloat(bValue);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            // Both are numbers, sort numerically in descending order
            return bNum - aNum;
          } else {
            // String comparison in descending order
            return bValue.localeCompare(aValue);
          }
        });
        
        setSeasons(sortedData);
        
        // Ensure "ALL" is selected by default if not already set
        if (selectedSeason !== 'ALL') {
          setSelectedSeason('ALL');
          if (onSeasonChange) {
            onSeasonChange('ALL', null);
          }
        }
      } catch (err) {
        setError(`Failed to load seasons: ${err.message}`);
        console.error('Error loading seasons:', err);
        setSeasons([]);
        setSelectedSeason('');
      } finally {
        setLoading(false);
      }
    };

    loadSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity, cohort, category]);

  const handleSeasonChange = (e) => {
    const seasonValue = e.target.value;
    setSelectedSeason(seasonValue);
    
    // seasons is an array of season values (strings)
    // Find the selected value in the array
    const season = seasons.find(s => {
      const value = typeof s === 'string' ? s : (s.season || s.id || s.name || '');
      return String(value) === String(seasonValue);
    });
    
    if (onSeasonChange) {
      onSeasonChange(seasonValue, season);
    }
  };

  return (
    <div className="tournament-selector">
      <div className="selector-group">
        <label htmlFor="season-select">Season</label>
        <select
          id="season-select"
          value={selectedSeason}
          onChange={handleSeasonChange}
          className="selector-dropdown"
          disabled={loading || seasons.length === 0 || !category}
        >
          {!category ? (
            <option value="">Select a tournament first</option>
          ) : loading ? (
            <option value="">Loading seasons...</option>
          ) : seasons.length === 0 ? (
            <option value="">No seasons available</option>
          ) : (
            <>
              <option value="ALL">ALL</option>
              {seasons.map((season, index) => {
                // seasons is an array of season values (strings from the "values" array)
                const seasonValue = typeof season === 'string' 
                  ? season 
                  : (season.season || season.id || season.name || `season-${index}`);
                const displayName = typeof season === 'string' 
                  ? season 
                  : (season.season || season.name || season.title || `Season ${index + 1}`);
                // Convert all letters to uppercase for display
                const capitalizedDisplayName = capitalizeAll(displayName);
                return (
                  <option key={seasonValue} value={seasonValue}>
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

export default SeasonSelector;

