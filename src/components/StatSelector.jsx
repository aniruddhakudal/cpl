import { useState, useEffect } from 'react';
import './TournamentSelector.css';

// Helper function to convert all letters to uppercase
const capitalizeAll = (str) => {
  if (!str || typeof str !== 'string') return str;
  return str.toUpperCase();
};

const StatSelector = ({ onStatChange, category, selectedSeason }) => {
  const [selectedStat, setSelectedStat] = useState('');

  const statOptions = ['Batting', 'Bowling', 'Fielding', 'MVP'];

  // Reset selection when tournament or season changes
  useEffect(() => {
    // Reset if category is not "ALL" and either category or season is missing
    if (category !== 'ALL' && (!category || !selectedSeason)) {
      setSelectedStat('');
    }
  }, [category, selectedSeason]);

  const handleStatChange = (e) => {
    const statValue = e.target.value;
    setSelectedStat(statValue);
    
    if (onStatChange) {
      onStatChange(statValue);
    }
  };

  return (
    <div className="tournament-selector">
      <div className="selector-group">
        <label htmlFor="stat-select">STAT</label>
        <select
          id="stat-select"
          value={selectedStat}
          onChange={handleStatChange}
          className="selector-dropdown"
          disabled={!category || (category !== 'ALL' && !selectedSeason)}
        >
          {!category ? (
            <option value="">Select a tournament first</option>
          ) : category === 'ALL' ? (
            <>
              <option value="">Select a stat</option>
              {statOptions.map((stat) => {
                const capitalizedDisplayName = capitalizeAll(stat);
                return (
                  <option key={stat} value={stat}>
                    {capitalizedDisplayName}
                  </option>
                );
              })}
            </>
          ) : !selectedSeason ? (
            <option value="">Select a season first</option>
          ) : (
            <>
              <option value="">Select a stat</option>
              {statOptions.map((stat) => {
                const capitalizedDisplayName = capitalizeAll(stat);
                return (
                  <option key={stat} value={stat}>
                    {capitalizedDisplayName}
                  </option>
                );
              })}
            </>
          )}
        </select>
      </div>
    </div>
  );
};

export default StatSelector;

