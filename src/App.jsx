import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import MenuBar from './components/MenuBar';
import CPLRulesPage from './pages/CPLRulesPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import CelebriaHomePage from './pages/CelebriaHomePage';
import CrickipediaHomePage from './pages/CrickipediaHomePage';
import './App.css';

// site_switch: set via env VITE_SITE_SWITCH = "celebria" | "crickipedia"
const siteSwitch = (import.meta.env.VITE_SITE_SWITCH || 'crickipedia').toLowerCase();
const isCelebria = siteSwitch === 'celebria';
const HomePage = isCelebria ? CelebriaHomePage : CrickipediaHomePage;

// When site_switch=celebria, hide /sports/cricket/:entity pages where entity !== "celebria" (redirect to home)
function RedirectIfNotCelebria({ children }) {
  const { entity } = useParams();
  if (entity && entity.toLowerCase() !== 'celebria') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <div className="app-layout">
      <MenuBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {isCelebria ? (
            <>
              <Route
                path="/sports/cricket/:entity/:cohort"
                element={
                  <RedirectIfNotCelebria>
                    <StatsPage />
                  </RedirectIfNotCelebria>
                }
              />
              <Route
                path="/sports/cricket/:entity/:cohort/profile"
                element={
                  <RedirectIfNotCelebria>
                    <ProfilePage />
                  </RedirectIfNotCelebria>
                }
              />
              <Route
                path="/sports/cricket/:entity/:cohort/cpl_rules"
                element={
                  <RedirectIfNotCelebria>
                    <CPLRulesPage />
                  </RedirectIfNotCelebria>
                }
              />
            </>
          ) : (
            <>
              <Route path="/sports/cricket/:entity/:cohort" element={<StatsPage />} />
              <Route path="/sports/cricket/:entity/:cohort/profile" element={<ProfilePage />} />
              <Route path="/sports/cricket/:entity/:cohort/cpl_rules" element={<CPLRulesPage />} />
              <Route path="/:entity/:cohort" element={<StatsPage />} />
              <Route path="/:entity/:cohort/profile" element={<ProfilePage />} />
              <Route path="/:entity/:cohort/cpl_rules" element={<CPLRulesPage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;
export { siteSwitch, isCelebria };

