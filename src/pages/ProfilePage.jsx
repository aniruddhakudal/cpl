import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './ProfilePage.css';
import '../App.css';

const API_BASE = 'https://cpl-backend-h9oc.onrender.com';

const fetchCategories = async (entity, cohort) => {
  if (!entity || !cohort) return [];
  try {
    const url = `${API_BASE}/v1/sports/cricket/tournaments?field=category&entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const values = result.values ?? result.data ?? [];
    return Array.isArray(values) ? values : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

const fetchSeasons = async (entity, cohort, category) => {
  if (!entity || !cohort || !category) return [];
  try {
    const url = `${API_BASE}/v1/sports/cricket/tournaments?field=season&entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}&category=${encodeURIComponent(category)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    const values = result.values ?? result.data ?? [];
    return Array.isArray(values) ? values : [];
  } catch (error) {
    console.error('Error fetching seasons:', error);
    return [];
  }
};

const fetchPlayers = async (entity, cohort) => {
  if (!entity || !cohort) return [];
  try {
    const url = `${API_BASE}/v1/sports/cricket/players?limit=0&entity=${encodeURIComponent(entity)}&cohort=${encodeURIComponent(cohort)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    let players = result.players ?? result.data ?? result.values ?? result;
    if (!Array.isArray(players)) players = result.data?.players ?? [];
    return Array.isArray(players) ? players : [];
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
};

const fetchPlayerDetails = async (playerId, entity, cohort, includeBreakdown = false) => {
  if (!playerId) return null;
  try {
    let url = `${API_BASE}/v1/sports/cricket/players/${encodeURIComponent(playerId)}/details`;
    const params = new URLSearchParams();
    if (entity) params.set('entity', entity);
    if (cohort) params.set('cohort', cohort);
    if (includeBreakdown) params.set('include_breakdown', 'true');
    if (params.toString()) url += `?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.profile ? result : (result.details ?? result.data ?? result);
  } catch (error) {
    console.error('Error fetching player details:', error);
    return null;
  }
};

const filterAndAggregateBreakdown = (breakdown, selectedCategories, selectedSeasons, singleCategory) => {
  if (!breakdown || !Array.isArray(breakdown) || breakdown.length === 0) return null;
  let filtered = breakdown;
  if (selectedCategories && selectedCategories.length > 0) {
    const catSet = new Set(selectedCategories.map((c) => String(c).toLowerCase()));
    filtered = filtered.filter((b) => b.category && catSet.has(String(b.category).toLowerCase()));
  }
  if (singleCategory && selectedSeasons && selectedSeasons.length > 0) {
    const seaSet = new Set(selectedSeasons.map((s) => String(s).toLowerCase()));
    filtered = filtered.filter((b) => b.season && seaSet.has(String(b.season).toLowerCase()));
  }
  if (filtered.length === 0) return null;
  const agg = { batting: {}, bowling: {}, fielding: {}, mvp: {} };
  const sumNum = (arr, key) => arr.reduce((s, x) => s + (Number(x[key]) || 0), 0);
  const sumF = (arr, key) => arr.reduce((s, x) => s + (parseFloat(x[key]) || 0), 0);
  const maxNum = (arr, key) => Math.max(0, ...arr.map((x) => Number(x[key]) || 0));
  if (filtered.some((b) => b.batting && Object.keys(b.batting).length)) {
    const bats = filtered.map((b) => b.batting).filter(Boolean);
    agg.batting = {
      total_matches: sumNum(bats, 'total_matches'),
      total_innings: sumNum(bats, 'total_innings'),
      total_runs: sumNum(bats, 'total_runs'),
      total_balls_faced: sumNum(bats, 'total_balls_faced'),
      fours: sumNum(bats, 'fours'),
      sixes: sumNum(bats, 'sixes'),
      fifties: sumNum(bats, 'fifties'),
      hundreds: sumNum(bats, 'hundreds'),
      not_outs: sumNum(bats, 'not_outs'),
      highest_score: maxNum(bats, 'highest_score'),
      average: bats.length ? (() => {
        const runs = sumNum(bats, 'total_runs');
        const inn = sumNum(bats, 'total_innings') - sumNum(bats, 'not_outs');
        return inn > 0 ? Math.round((runs / inn) * 100) / 100 : null;
      })() : null,
      strike_rate: (() => {
        const runs = sumNum(bats, 'total_runs');
        const bf = sumNum(bats, 'total_balls_faced');
        return bf > 0 ? Math.round((runs / bf) * 10000) / 100 : null;
      })(),
    };
  }
  if (filtered.some((b) => b.bowling && Object.keys(b.bowling).length)) {
    const bowls = filtered.map((b) => b.bowling).filter(Boolean);
    const wickets = sumNum(bowls, 'total_wickets');
    const runs = sumNum(bowls, 'total_runs_conceded');
    const overs = sumF(bowls, 'total_overs');
    agg.bowling = {
      total_matches: sumNum(bowls, 'total_matches'),
      total_innings: sumNum(bowls, 'total_innings'),
      total_wickets: wickets,
      total_balls: sumNum(bowls, 'total_balls'),
      total_overs: Math.round(overs * 10) / 10,
      total_runs_conceded: runs,
      maidens: sumNum(bowls, 'maidens'),
      dot_balls: sumNum(bowls, 'dot_balls'),
      best_bowling_wickets: maxNum(bowls, 'best_bowling_wickets'),
      economy: overs > 0 ? Math.round((runs / overs) * 100) / 100 : null,
      strike_rate: wickets > 0 ? Math.round((sumNum(bowls, 'total_balls') / wickets) * 100) / 100 : null,
      average: wickets > 0 ? Math.round((runs / wickets) * 100) / 100 : null,
    };
  }
  if (filtered.some((b) => b.fielding && Object.keys(b.fielding).length)) {
    const fiels = filtered.map((b) => b.fielding).filter(Boolean);
    agg.fielding = {
      total_matches: sumNum(fiels, 'total_matches'),
      catches: sumNum(fiels, 'catches'),
      caught_behind: sumNum(fiels, 'caught_behind'),
      run_outs: sumNum(fiels, 'run_outs'),
      assist_run_outs: sumNum(fiels, 'assist_run_outs'),
      stumpings: sumNum(fiels, 'stumpings'),
      caught_and_bowl: sumNum(fiels, 'caught_and_bowl'),
      total_catches: sumNum(fiels, 'total_catches'),
      total_dismissals: sumNum(fiels, 'total_dismissals'),
    };
  }
  if (filtered.some((b) => b.mvp && Object.keys(b.mvp).length)) {
    const mvps = filtered.map((b) => b.mvp).filter(Boolean);
    agg.mvp = {
      total_matches: sumNum(mvps, 'total_matches'),
      batting_points: Math.round(sumF(mvps, 'batting_points') * 1000) / 1000,
      bowling_points: Math.round(sumF(mvps, 'bowling_points') * 1000) / 1000,
      fielding_points: Math.round(sumF(mvps, 'fielding_points') * 1000) / 1000,
      total_points: Math.round(sumF(mvps, 'total_points') * 1000) / 1000,
    };
  }
  return agg;
};

const getPlayerLabel = (player) => {
  if (typeof player === 'string') return player;
  const name =
    player?.name ??
    player?.player_name ??
    player?.Player ??
    player?.display_name ??
    player?.full_name ??
    player?.Name;
  return name != null && name !== '' ? String(name) : null;
};

const getPlayerValue = (player) => {
  if (typeof player === 'string') return player;
  return player?.id ?? player?.player_id ?? player?.name ?? player?.player_name ?? JSON.stringify(player);
};

const getVal = (obj, ...keys) => {
  for (const key of keys) {
    const v = obj?.[key];
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return null;
};

const num = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const p = parseFloat(v);
    return isNaN(p) ? null : p;
  }
  if (v && typeof v === 'object' && typeof v.value === 'number') return v.value;
  return null;
};

const toDisplayValue = (v) => {
  if (v == null || v === '') return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null) {
    if (typeof v.value !== 'undefined') return toDisplayValue(v.value);
    return null;
  }
  return String(v);
};

const StatTile = ({ label, value }) => {
  const displayValue = toDisplayValue(value);
  if (displayValue == null || displayValue === '') return null;
  return (
    <div className="player-stat-tile">
      <span className="player-stat-tile__value">{displayValue}</span>
      <span className="player-stat-tile__label">{label}</span>
    </div>
  );
};

const ProfilePage = () => {
  const { entity, cohort } = useParams();
  const [players, setPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [playerDetails, setPlayerDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const playerDropdownRef = useRef(null);

  useEffect(() => {
    if (!entity || !cohort) {
      setPlayers([]);
      setCategories([]);
      setSelectedCategories([]);
      setSeasons([]);
      setSelectedSeasons([]);
      setSelectedPlayer('');
      setSelectedPlayerName('');
      setPlayerDetails(null);
      return;
    }
    const loadCategories = async () => {
      const data = await fetchCategories(entity, cohort);
      setCategories(data);
      setSelectedCategories(data);
    };
    loadCategories();
  }, [entity, cohort]);

  useEffect(() => {
    if (!entity || !cohort) return;
    const load = async () => {
      setLoading(true);
      const data = await fetchPlayers(entity, cohort);
      setPlayers(data);
      setSelectedPlayer('');
      setSelectedPlayerName('');
      setPlayerDetails(null);
      setLoading(false);
    };
    load();
  }, [entity, cohort]);

  useEffect(() => {
    if (selectedCategories.length !== 1) {
      setSeasons([]);
      setSelectedSeasons([]);
      return;
    }
    const category = selectedCategories[0];
    const load = async () => {
      const data = await fetchSeasons(entity, cohort, category);
      setSeasons(data);
      setSelectedSeasons([]);
    };
    load();
  }, [entity, cohort, selectedCategories]);

  useEffect(() => {
    if (!selectedPlayer) {
      setPlayerDetails(null);
      return;
    }
    const load = async () => {
      setDetailsLoading(true);
      const data = await fetchPlayerDetails(
        selectedPlayer,
        entity,
        cohort,
        true
      );
      setPlayerDetails(data);
      setDetailsLoading(false);
    };
    load();
  }, [selectedPlayer, entity, cohort]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (playerDropdownRef.current && !playerDropdownRef.current.contains(e.target)) {
        setPlayerDropdownOpen(false);
        setPlayerSearchQuery('');
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setPlayerDropdownOpen(false);
        setPlayerSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const hasParams = Boolean(entity && cohort);

  const sortedPlayers = [...players].sort((a, b) =>
    (getPlayerLabel(a) ?? '').localeCompare(getPlayerLabel(b) ?? '', undefined, { sensitivity: 'base' })
  );
  const searchLower = (playerSearchQuery || '').trim().toLowerCase();
  const filteredPlayers = searchLower
    ? sortedPlayers.filter((p) =>
        (getPlayerLabel(p) ?? '').toLowerCase().includes(searchLower)
      )
    : sortedPlayers;

  if (!hasParams) {
    return (
      <div className="profile-page">
        <h1>Profile</h1>
        <p>Select a cohort from the menu to view player profiles.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
          <p>Loading players...</p>
        </div>
      </div>
    );
  }

  const selectedPlayerObj = players.find((p) => String(getPlayerValue(p)) === String(selectedPlayer));
  const raw = playerDetails || {};
  const profile = raw.profile || raw;
  const hasBreakdown = raw.breakdown && Array.isArray(raw.breakdown) && raw.breakdown.length > 0;
  const showSeasonFilter = selectedCategories.length === 1;
  const singleSelectedCategory = selectedCategories[0];
  const filteredByBreakdown = hasBreakdown
    ? filterAndAggregateBreakdown(
        raw.breakdown,
        selectedCategories,
        showSeasonFilter ? selectedSeasons : [],
        showSeasonFilter
      )
    : null;
  const bat = hasBreakdown
    ? (filteredByBreakdown?.batting ?? {})
    : (raw.batting || raw.batting_stats || {});
  const bowl = hasBreakdown
    ? (filteredByBreakdown?.bowling ?? {})
    : (raw.bowling || raw.bowling_stats || {});
  const field = hasBreakdown
    ? (filteredByBreakdown?.fielding ?? {})
    : (raw.fielding || raw.fielding_stats || {});

  const playerName =
    getVal(profile, 'name', 'player_name', 'Player') ||
    getVal(raw, 'name', 'player_name', 'Player') ||
    selectedPlayerName ||
    (selectedPlayerObj ? getPlayerLabel(selectedPlayerObj) : null) ||
    'Player';

  const battingStats = [
    ['Total Runs', num(getVal(bat, 'total_runs')) ?? getVal(bat, 'total_runs')],
    ['Average', num(getVal(bat, 'average')) ?? getVal(bat, 'average')],
    ['Strike Rate', num(getVal(bat, 'strike_rate')) ?? getVal(bat, 'strike_rate')],
    ['Highest Score', num(getVal(bat, 'highest_score')) ?? getVal(bat, 'highest_score')],
    ['50s', num(getVal(bat, 'fifties')) ?? getVal(bat, 'fifties')],
    ['100s', num(getVal(bat, 'hundreds')) ?? getVal(bat, 'hundreds')],
    ['4s', num(getVal(bat, 'fours')) ?? getVal(bat, 'fours')],
    ['6s', num(getVal(bat, 'sixes')) ?? getVal(bat, 'sixes')],
    ['Not Outs', num(getVal(bat, 'not_outs')) ?? getVal(bat, 'not_outs')],
    ['Balls Faced', num(getVal(bat, 'total_balls_faced')) ?? getVal(bat, 'total_balls_faced')],
    ['Innings', num(getVal(bat, 'total_innings')) ?? getVal(bat, 'total_innings')],
    ['Matches', num(getVal(bat, 'total_matches')) ?? getVal(bat, 'total_matches')],
  ];
  const bowlingStats = [
    ['Wickets', num(getVal(bowl, 'total_wickets')) ?? getVal(bowl, 'total_wickets')],
    ['Economy', num(getVal(bowl, 'economy')) ?? getVal(bowl, 'economy')],
    ['Average', num(getVal(bowl, 'average')) ?? getVal(bowl, 'average')],
    ['Strike Rate', num(getVal(bowl, 'strike_rate')) ?? getVal(bowl, 'strike_rate')],
    ['Best Bowling', getVal(bowl, 'best_bowling_wickets') ?? getVal(bowl, 'best_bowling_wickets')],
    ['Runs Conceded', num(getVal(bowl, 'total_runs_conceded')) ?? getVal(bowl, 'total_runs_conceded')],
    ['Balls', num(getVal(bowl, 'total_balls')) ?? getVal(bowl, 'total_balls')],
    ['Overs', num(getVal(bowl, 'total_overs')) ?? getVal(bowl, 'total_overs')],
    ['Maidens', num(getVal(bowl, 'maidens')) ?? getVal(bowl, 'maidens')],
    ['Matches', num(getVal(bowl, 'total_matches')) ?? getVal(bowl, 'total_matches')],
  ];
  const fieldingStats = [
    ['Total Dismissals', num(getVal(field, 'total_dismissals')) ?? getVal(field, 'total_dismissals')],
    ['Total Catches', num(getVal(field, 'total_catches')) ?? getVal(field, 'total_catches')],
    ['Catches', num(getVal(field, 'catches')) ?? getVal(field, 'catches')],
    ['Run Outs', num(getVal(field, 'run_outs')) ?? getVal(field, 'run_outs')],
    ['Caught Behind', num(getVal(field, 'caught_behind')) ?? getVal(field, 'caught_behind')],
    ['Assist Run Outs', num(getVal(field, 'assist_run_outs')) ?? getVal(field, 'assist_run_outs')],
    ['Stumpings', num(getVal(field, 'stumpings')) ?? getVal(field, 'stumpings')],
    ['Caught & Bowl', num(getVal(field, 'caught_and_bowl')) ?? getVal(field, 'caught_and_bowl')],
    ['Matches', num(getVal(field, 'total_matches')) ?? getVal(field, 'total_matches')],
  ];

  const teamName = getVal(profile, 'team_name', 'team', 'Team') ?? getVal(selectedPlayerObj, 'team_name', 'team', 'Team');

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleSeason = (season) => {
    setSelectedSeasons((prev) =>
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  return (
    <div className="profile-page">
      <h1>Player Profile</h1>
      <p className="profile-page__subtitle">
        {entity?.charAt(0).toUpperCase()}{entity?.slice(1)} · {cohort?.charAt(0).toUpperCase()}{cohort?.slice(1)}
      </p>
      <div className="profile-page__selector" ref={playerDropdownRef}>
        <label htmlFor="player-select">Select Player</label>
        <div className="player-searchable-dropdown">
          <button
            type="button"
            id="player-select"
            className={`selector-dropdown player-searchable-dropdown__trigger ${playerDropdownOpen ? 'player-searchable-dropdown__trigger--open' : ''}`}
            onClick={() => setPlayerDropdownOpen((o) => !o)}
            disabled={players.length === 0}
            aria-haspopup="listbox"
            aria-expanded={playerDropdownOpen}
          >
            {selectedPlayerName || 'Select a player'}
          </button>
          {playerDropdownOpen && (
            <div className="player-searchable-dropdown__panel" role="listbox">
              <input
                type="text"
                className="player-searchable-dropdown__search"
                placeholder="Search players..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                autoFocus
              />
              <ul className="player-searchable-dropdown__list">
                {filteredPlayers.length === 0 ? (
                  <li className="player-searchable-dropdown__item player-searchable-dropdown__item--empty">
                    No players match &quot;{playerSearchQuery}&quot;
                  </li>
                ) : (
                  filteredPlayers.map((player) => {
                    const value = getPlayerValue(player);
                    const label = getPlayerLabel(player) ?? value;
                    const isSelected = String(value) === String(selectedPlayer);
                    return (
                      <li
                        key={value}
                        role="option"
                        aria-selected={isSelected}
                        className={`player-searchable-dropdown__item ${isSelected ? 'player-searchable-dropdown__item--selected' : ''}`}
                        onClick={() => {
                          setSelectedPlayer(value);
                          setSelectedPlayerName(label);
                          setPlayerSearchQuery('');
                          setPlayerDropdownOpen(false);
                        }}
                      >
                        {label}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      {players.length === 0 && !loading && (
        <p className="profile-page__empty">No players found for the selected entity and cohort.</p>
      )}
      {detailsLoading && selectedPlayer && (
        <div className="profile-page__loading-details">
          <div className="spinner"></div>
          <p>Loading player stats...</p>
        </div>
      )}
      {!detailsLoading && selectedPlayer && playerDetails && (
        <div className="player-profile">
          <header className="player-profile__header">
            <div className="player-profile__avatar">
              {playerName.charAt(0).toUpperCase()}
            </div>
            <div className="player-profile__info">
              <h2 className="player-profile__name">{playerName}</h2>
              {teamName && <p className="player-profile__team">{teamName}</p>}
            </div>
          </header>
          {categories.length > 0 && (
            <div className="profile-page__categories">
              <span className="profile-page__categories-label">Filter by category</span>
              <div className="profile-page__categories-list">
                {categories.map((cat) => (
                  <label key={cat} className="profile-page__category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                    />
                    <span>{cat.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {showSeasonFilter && seasons.length > 0 && (
            <div className="profile-page__categories profile-page__seasons">
              <span className="profile-page__categories-label">
                Filter by season ({singleSelectedCategory?.toUpperCase()})
              </span>
              <div className="profile-page__categories-list">
                {seasons.map((season) => (
                  <label key={season} className="profile-page__category-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedSeasons.includes(season)}
                      onChange={() => toggleSeason(season)}
                    />
                    <span>{season.toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="player-profile__stats">
            {battingStats.some(([, v]) => v != null && v !== '') && (
              <div className="player-stat-section">
                <h3 className="player-stat-section__title">
                  <span className="player-stat-section__icon">🏏</span>
                  Batting
                </h3>
                <div className="player-stat-tiles">
                  {battingStats.map(([label, v]) => (
                    <StatTile key={label} label={label} value={v} />
                  ))}
                </div>
              </div>
            )}
            {bowlingStats.some(([, v]) => v != null && v !== '') && (
              <div className="player-stat-section">
                <h3 className="player-stat-section__title">
                  <span className="player-stat-section__icon">🎯</span>
                  Bowling
                </h3>
                <div className="player-stat-tiles">
                  {bowlingStats.map(([label, v]) => (
                    <StatTile key={label} label={label} value={v} />
                  ))}
                </div>
              </div>
            )}
            {fieldingStats.some(([, v]) => v != null && v !== '') && (
              <div className="player-stat-section">
                <h3 className="player-stat-section__title">
                  <span className="player-stat-section__icon">🧤</span>
                  Fielding
                </h3>
                <div className="player-stat-tiles">
                  {fieldingStats.map(([label, v]) => (
                    <StatTile key={label} label={label} value={v} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {!detailsLoading && selectedPlayer && playerDetails === null && (
        <p className="profile-page__empty">Unable to load player details.</p>
      )}
    </div>
  );
};

export default ProfilePage;
