import { Link } from 'react-router-dom';

const CelebriaHomePage = () => {
  return (
    <div className="home-page">
      <img
        src="/data/cpl_logo.png"
        alt="CPL Logo"
        className="home-page__logo"
      />
      <h1 className="home-page__title">Welcome to Celebria</h1>
      <p className="home-page__subtitle home-page__subtitle--highlight">Cricket Stats Portal</p>

      <section className="home-page__cpl-announcement">
        <h2 className="home-page__cpl-heading">CPL X Registrations Open</h2>
        <p className="home-page__cpl-deadline">Last date: 5th March</p>
        <div className="home-page__cpl-links">
          <Link to="/cpl/register/cplx/men" className="home-page__cpl-link">
            Men
          </Link>
          <Link to="/cpl/register/cplx/kids" className="home-page__cpl-link">
            Kids
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CelebriaHomePage;
