import { useState, useEffect } from 'react';
import { getAllSeasonsData } from '../utils/dataLoader';
import BattingCharts from '../components/charts/BattingCharts';
import BowlingCharts from '../components/charts/BowlingCharts';
import FieldingCharts from '../components/charts/FieldingCharts';
import MVPCharts from '../components/charts/MVPCharts';
import TeamComparison from '../components/charts/TeamComparison';
import TournamentSelector from '../components/TournamentSelector';
import SeasonSelector from '../components/SeasonSelector';
import StatSelector from '../components/StatSelector';
import '../App.css';

const AllChartsDashboard = () => {
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

  const seasonData = data[selectedSeason];

  return (
    <div className="app">
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
      
      <div className="all-charts-container" style={{ padding: '20px' }}>
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>🏏 Batting Statistics</h2>
          <BattingCharts data={seasonData.batting} />
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>⚾ Bowling Statistics</h2>
          <BowlingCharts data={seasonData.bowling} />
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>🧤 Fielding Statistics</h2>
          <FieldingCharts data={seasonData.fielding} />
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>⭐ MVP Statistics</h2>
          <MVPCharts data={seasonData.mvp} />
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>👥 Team Comparison</h2>
          <TeamComparison data={seasonData} />
        </section>
      </div>
    </div>
  );
};

export default AllChartsDashboard;



