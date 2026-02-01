import { Routes, Route } from 'react-router-dom';
import MenuBar from './components/MenuBar';
import CPLRulesPage from './pages/CPLRulesPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function HomePage() {
  return (
    <div className="home-page">
      <h1 className="home-page__title">Welcome to Crickipedia Stats</h1>
    </div>
  );
}

function App() {
  return (
    <div className="app-layout">
      <MenuBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sports/cricket/:entity/:cohort" element={<StatsPage />} />
          <Route path="/sports/cricket/:entity/:cohort/profile" element={<ProfilePage />} />
          <Route path="/sports/cricket/:entity/:cohort/cpl_rules" element={<CPLRulesPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

