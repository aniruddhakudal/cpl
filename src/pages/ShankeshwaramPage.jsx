import './ShankeshwaramPage.css';

const ShankeshwaramPage = () => {
  return (
    <div className="shankeshwaram-page">
      <div className="shankeshwaram-hero">
        <div className="shankeshwaram-presents">
        <p>Shankeshwaram Residency</p>
        <p>presents</p>
      </div>
        <div className="shankeshwaram-logo-wrap">
          <img
            src="/data/images/shankeshwaram/srpl_logo.png"
            alt="SRPL Logo"
            className="shankeshwaram-logo"
          />
        </div>
        <h2 className="shankeshwaram-section-title">SRPL Season2 - Sponsors</h2>
        <div className="shankeshwaram-sponsors-wrap">
          <img
            src="/data/images/shankeshwaram/srpl_2026_sponsor2.jpeg"
            alt="SRPL 2026 Sponsors"
            className="shankeshwaram-sponsor-img"
          />
          <img
            src="/data/images/shankeshwaram/srpl_2026_banner.jpeg"
            alt="SRPL 2026 Teams Banner"
            className="shankeshwaram-banner"
          />          
        </div>
        <h2 className="shankeshwaram-section-title shankeshwaram-section-title--teams">SRPL Season2 - Teams</h2>
        <div className="shankeshwaram-banner-wrap">
          <img
            src="/data/images/shankeshwaram/srpl_2026_team.jpeg"
            alt="SRPL 2026 Team"
            className="shankeshwaram-sponsor-img"
          />          
        </div>
      </div>
    </div>
  );
};

export default ShankeshwaramPage;
