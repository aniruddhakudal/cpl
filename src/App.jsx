import { useState, useEffect } from 'react';
import { getAllSeasonsData } from './utils/dataLoader';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('cpl1');

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
      <header className="app-header">
        <h1>🏏 CPL Cricket Tournament Dashboard</h1>
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

export default App;

