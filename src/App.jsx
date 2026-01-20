import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllSeasonsData } from './utils/dataLoader';
import Dashboard from './components/Dashboard';
import CPLRulesPage from './pages/CPLRulesPage';
import MenBattingStatsPage from './pages/MenBattingStatsPage';
import TournamentSelector from './components/TournamentSelector';
import SeasonSelector from './components/SeasonSelector';
import StatSelector from './components/StatSelector';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function PlaceholderPage() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      position: 'relative'
    }}>
      <ThemeToggle />
      <img
        src="https://via.placeholder.com/800x600/667eea/ffffff?text=Placeholder+Image"
        alt="Placeholder"
        style={{
          maxWidth: '90%',
          height: 'auto',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
}

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('cpl1');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [selectedSeasonFromAPI, setSelectedSeasonFromAPI] = useState(null);
  const [category, setCategory] = useState(null);
  const [entity, setEntity] = useState('adults');
  const [cohort, setCohort] = useState('adults');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allData = await getAllSeasonsData();
        setData(allData);
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please ensure the data files are accessible.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="app">
      <ThemeToggle />
      <header className="app-header">
        <h1>🏏 CPL Cricket Tournament Dashboard</h1>
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
              setSelectedSeasonFromAPI({ id: seasonId, data: season });
            }}
          />
          <StatSelector 
            category={category}
            selectedSeason={selectedSeasonFromAPI?.id}
            onStatChange={(stat) => {
              // Handle stat selection if needed
            }}
          />
        </div>
        <div className="season-selector">
          <button
            className={selectedSeason === 'cpl1' ? 'active' : ''}
            onClick={() => setSelectedSeason('cpl1')}
          >
            Season 1 (CPL1)
          </button>
          <button
            className={selectedSeason === 'cpl2' ? 'active' : ''}
            onClick={() => setSelectedSeason('cpl2')}
          >
            Season 2 (CPL2)
          </button>
        </div>
      </header>
      <Dashboard data={data[selectedSeason]} season={selectedSeason} />
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage />} />
      <Route path="/sports/cricket/adults/dashboard" element={<DashboardPage />} />
      <Route path="/sports/cricket/adults/cpl_rules" element={<CPLRulesPage />} />
      <Route path="/sports/cricket/:entity/:cohort" element={<MenBattingStatsPage />} />
    </Routes>
  );
}

export default App;

