const CrickipediaHomePage = () => {
  return (
    <div className="home-page">
      <img
        src="/data/images/crickipedia/crickipedia_logo1.png"
        alt="Crickipedia Stats"
        className="home-page__logo"
      />
      <h1 className="home-page__title">Welcome to Crickipedia Stats</h1>
      <p className="home-page__subtitle">Explore cricket statistics and leaderboards</p>
      <p className="home-page__welcome">
        Your local cricket, your stats, your charts. Dive in—explore your profile, track your
        performance, and generate stunning charts for any tournament you choose. It's all here.
      </p>
    </div>
  );
};

export default CrickipediaHomePage;
