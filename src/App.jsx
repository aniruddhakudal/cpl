import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import MenuBar from './components/MenuBar';
import CPLRulesPage from './pages/CPLRulesPage';
import CplXSchedulePage from './pages/CplXSchedulePage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import CelebriaHomePage from './pages/CelebriaHomePage';
import CrickipediaHomePage from './pages/CrickipediaHomePage';
import ShankeshwaramPage from './pages/ShankeshwaramPage';
import ShiroliPage from './pages/ShiroliPage';
import CelebriaEntityPage from './pages/CelebriaEntityPage';
import RegistrationPage from './pages/RegistrationPage';
import RegisterLandingPage from './pages/RegisterLandingPage';
import AdminRegistrationsPage from './pages/AdminRegistrationsPage';
import TossPage from './pages/TossPage';
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

// Redirect /celebria/:cohort to /sports/cricket/celebria/:cohort when in celebria mode
function RedirectCelebriaCohort({ suffix = '' }) {
  const { cohort } = useParams();
  const path = `/sports/cricket/celebria/${cohort}${suffix}`;
  return <Navigate to={path} replace />;
}

// Redirect /register/:cohort to /cpl/register/cplx/:cohort
function LegacyRegisterRedirect() {
  const { cohort } = useParams();
  return <Navigate to={`/cpl/register/cplx/${cohort || 'men'}`} replace />;
}

function App() {
  return (
    <div className="app-layout">
      <MenuBar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/toss" element={<TossPage />} />
          {isCelebria && (
            <>
              <Route path="/cpl/register" element={<RegisterLandingPage />} />
              <Route path="/cpl/register/:season/:cohort" element={<RegistrationPage />} />
              <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
              {/* Legacy redirects */}
              <Route path="/register" element={<Navigate to="/cpl/register" replace />} />
              <Route path="/register/:cohort" element={<LegacyRegisterRedirect />} />
            </>
          )}

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
              <Route
                path="/sports/cricket/:entity/:cohort/cpl_x_schedule"
                element={
                  <RedirectIfNotCelebria>
                    <CplXSchedulePage />
                  </RedirectIfNotCelebria>
                }
              />
              <Route path="/celebria" element={<Navigate to="/" replace />} />
              <Route path="/celebria/:cohort" element={<RedirectCelebriaCohort />} />
              <Route path="/celebria/:cohort/profile" element={<RedirectCelebriaCohort suffix="/profile" />} />
              <Route path="/celebria/:cohort/cpl_rules" element={<RedirectCelebriaCohort suffix="/cpl_rules" />} />
              <Route
                path="/celebria/:cohort/cpl_x_schedule"
                element={<RedirectCelebriaCohort suffix="/cpl_x_schedule" />}
              />
            </>
          ) : (
            <>
              <Route path="/shankeshwaram" element={<ShankeshwaramPage />} />
              <Route path="/shiroli" element={<ShiroliPage />} />
              <Route path="/celebria" element={<CelebriaEntityPage />} />
              <Route path="/sports/cricket/:entity/:cohort" element={<StatsPage />} />
              <Route path="/sports/cricket/:entity/:cohort/profile" element={<ProfilePage />} />
              <Route path="/sports/cricket/:entity/:cohort/cpl_rules" element={<CPLRulesPage />} />
              <Route path="/:entity/:cohort" element={<StatsPage />} />
              <Route path="/:entity/:cohort/profile" element={<ProfilePage />} />
              <Route path="/:entity/:cohort/cpl_rules" element={<CPLRulesPage />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
export { siteSwitch, isCelebria };

