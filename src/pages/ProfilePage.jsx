import { useState, useEffect } from 'react';
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

const fetchPlayerDetails = async (playerId, entity, cohort, categoryFilter, seasonFilter) => {
  if (!playerId) return null;
  try {
    let url = `${API_BASE}/v1/sports/cricket/players/${encodeURIComponent(playerId)}/details`;
    const params = new URLSearchParams();
    if (entity) params.set('entity', entity);
    if (cohort) params.set('cohort', cohort);
    if (categoryFilter && categoryFilter.trim()) params.set('category', categoryFilter.trim());
    if (seasonFilter && seasonFilter.trim()) params.set('season', seasonFilter.trim());
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

const StatCard = ({ title, icon, stats }) => (
  <div className="player-stat-card">
    <h3 className="player-stat-card__title">
      <span className="player-stat-card__icon">{icon}</span>
      {title}
    </h3>
    <div className="player-stat-card__grid">
      {stats
        .map(([label, v]) => [label, toDisplayValue(v)])
        .filter(([, v]) => v != null && v !== '')
        .map(([label, value]) => (
          <div key={label} className="player-stat-card__item">
            <span className="player-stat-card__value">{value}</span>
            <span className="player-stat-card__label">{label}</span>
          </div>
        ))}
    </div>
  </div>
);

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
      const first = data.length > 0 ? data[0] : null;
      setSelectedPlayer(first ? getPlayerValue(first) : '');
      setSelectedPlayerName(first ? getPlayerLabel(first) ?? '' : '');
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
    const categoryFilter = selectedCategories.length > 0 ? selectedCategories.join(',') : '';
    const seasonFilter =
      selectedCategories.length === 1 && selectedSeasons.length > 0 ? selectedSeasons.join(',') : '';
    const load = async () => {
      setDetailsLoading(true);
      const data = await fetchPlayerDetails(
        selectedPlayer,
        entity,
        cohort,
        categoryFilter,
        seasonFilter
      );
      setPlayerDetails(data);
      setDetailsLoading(false);
    };
    load();
  }, [selectedPlayer, entity, cohort, selectedCategories, selectedSeasons]);

  const hasParams = Boolean(entity && cohort);

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
  const bat = raw.batting || raw.batting_stats || {};
  const bowl = raw.bowling || raw.bowling_stats || {};
  const field = raw.fielding || raw.fielding_stats || {};

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

  const showSeasonFilter = selectedCategories.length === 1;
  const singleSelectedCategory = selectedCategories[0];

  return (
    <div className="profile-page">
      <h1>Player Profile</h1>
      <p className="profile-page__subtitle">
        {entity?.charAt(0).toUpperCase()}{entity?.slice(1)} · {cohort?.charAt(0).toUpperCase()}{cohort?.slice(1)}
      </p>
      <div className="profile-page__selector">
        <label htmlFor="player-select">Select Player</label>
        <select
          id="player-select"
          value={selectedPlayer}
          onChange={(e) => {
            const value = e.target.value;
            const option = e.target.selectedOptions?.[0];
            const label = option?.text ?? '';
            setSelectedPlayer(value);
            setSelectedPlayerName(label);
          }}
          className="selector-dropdown"
          disabled={players.length === 0}
        >
          <option value="">Select a player</option>
          {[...players]
            .sort((a, b) => (getPlayerLabel(a) ?? '').localeCompare(getPlayerLabel(b) ?? '', undefined, { sensitivity: 'base' }))
            .map((player) => (
              <option key={getPlayerValue(player)} value={getPlayerValue(player)}>
                {getPlayerLabel(player) ?? getPlayerValue(player)}
              </option>
            ))}
        </select>
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
              <StatCard title="Batting" icon="🏏" stats={battingStats} />
            )}
            {bowlingStats.some(([, v]) => v != null && v !== '') && (
              <StatCard title="Bowling" icon="🎯" stats={bowlingStats} />
            )}
            {fieldingStats.some(([, v]) => v != null && v !== '') && (
              <StatCard title="Fielding" icon="🧤" stats={fieldingStats} />
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
