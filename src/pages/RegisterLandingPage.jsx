import { Link } from 'react-router-dom';
import './RegisterLandingPage.css';

const REGISTRATION_SEASON = 'cplx';
const COHORTS = [
  { cohort: 'men', label: 'Men' },
  { cohort: 'kids', label: 'Kids' },
];

const RegisterLandingPage = () => {
  return (
    <div className="register-landing">
      <h1 className="register-landing__title">Join CPL</h1>
      <p className="register-landing__subtitle">Select your cohort to register</p>
      <div className="register-landing__cohorts">
        {COHORTS.map(({ cohort, label }) => (
          <Link
            key={cohort}
            to={`/cpl/register/${REGISTRATION_SEASON}/${cohort}`}
            className="register-landing__cohort-card"
          >
            <span className="register-landing__cohort-label">{label}</span>
          </Link>
        ))}
      </div>
      <p className="register-landing__admin-link">
        <Link to="/admin/registrations">Admin</Link>
      </p>
    </div>
  );
};

export default RegisterLandingPage;
