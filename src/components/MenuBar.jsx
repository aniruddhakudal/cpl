import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { fetchCohorts } from '../utils/tournamentLoader';
import ThemeToggle from './ThemeToggle';
import './MenuBar.css';

const DEFAULT_ENTITY = 'celebria';

const siteSwitch = (import.meta.env.VITE_SITE_SWITCH || 'crickipedia').toLowerCase();
const isCelebria = siteSwitch === 'celebria';

const ENTITY_PAGES = ['shankeshwaram', 'shiroli', 'celebria'];

const TOURNAMENT_ITEMS = [
  { label: 'Celebria', path: '/celebria' },
  { label: 'Shankeshwaram', path: '/shankeshwaram' },
  { label: 'Shiroli', path: '/shiroli' },
];

const getEntityFromPath = (pathname) => {
  if (isCelebria) {
    const match = pathname.match(/^\/sports\/cricket\/celebria(?:\/|$)/);
    return match ? 'celebria' : DEFAULT_ENTITY;
  }
  // Entity landing pages: /shankeshwaram, /shiroli, /celebria
  const entityPageMatch = pathname.match(new RegExp(`^/(${ENTITY_PAGES.join('|')})(?:/|$)`));
  if (entityPageMatch) return entityPageMatch[1];
  const longMatch = pathname.match(/^\/sports\/cricket\/([^/]+)/);
  if (longMatch) return longMatch[1];
  const shortMatch = pathname.match(/^\/([^/]+)\/[^/]+/);
  return shortMatch ? shortMatch[1] : DEFAULT_ENTITY;
};

const getBasePath = (entity) => {
  if (isCelebria) return '/sports/cricket/celebria';
  return `/${entity}`;
};

const MenuBar = () => {
  const location = useLocation();
  const entity = getEntityFromPath(location.pathname);
  const basePath = getBasePath(entity);
  const [cohorts, setCohorts] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    const loadCohorts = async () => {
      const data = await fetchCohorts(entity);
      setCohorts(Array.isArray(data) ? data : []);
    };
    loadCohorts();
  }, [entity]);

  const cohortMenus = [
    { key: 'statboard', label: 'Statboard', basePath },
    { key: 'profile', label: 'Profile', basePath },
    { key: 'rules', label: 'Rules', basePath },
  ];

  const getCohortPath = (menu, cohort) => {
    if (menu.key === 'statboard') return `${menu.basePath}/${cohort}`;
    if (menu.key === 'profile') return `${menu.basePath}/${cohort}/profile`;
    if (menu.key === 'rules') return `${menu.basePath}/${cohort}/cpl_rules`;
    return menu.basePath;
  };

  const isCrickipedia = !isCelebria;

  const isTournamentsActive = () => {
    const path = location.pathname;
    return ENTITY_PAGES.some((e) => path === `/${e}` || path.startsWith(`/${e}/`));
  };

  const isMenuActive = (menu) => {
    const path = location.pathname;
    const entityPrefix = isCelebria ? '/sports/cricket/celebria/' : `/${entity}/`;
    if (menu.key === 'statboard') {
      return path.startsWith(entityPrefix) &&
        !path.endsWith('/profile') &&
        !path.endsWith('/cpl_rules');
    }
    if (menu.key === 'profile') return path.endsWith('/profile');
    if (menu.key === 'rules') return path.endsWith('/cpl_rules');
    return false;
  };

  return (
    <nav className="menu-bar">
      <div className="menu-bar__brand">
        <NavLink to="/" className="menu-bar__brand-link" aria-label="Crickipedia Stats - Home">
          <img
            src="/data/images/crickipedia/crickipedia_button1.png"
            alt="Crickipedia Stats"
            className="menu-bar__brand-img"
          />
        </NavLink>
      </div>
      <ul className="menu-bar__items">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `menu-bar__link ${isActive ? 'menu-bar__link--active' : ''}`
            }
            end
          >
            Home
          </NavLink>
        </li>
        {isCrickipedia ? (
          <li
            className="menu-bar__dropdown"
            onMouseEnter={() => setOpenDropdown('tournaments')}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              type="button"
              className={`menu-bar__link menu-bar__link--trigger ${
                isTournamentsActive() ? 'menu-bar__link--active' : ''
              }`}
              onClick={() => setOpenDropdown((prev) => (prev === 'tournaments' ? null : 'tournaments'))}
              aria-expanded={openDropdown === 'tournaments'}
              aria-haspopup="true"
            >
              Tournaments
            </button>
            <ul
              className={`menu-bar__dropdown-list ${
                openDropdown === 'tournaments' ? 'menu-bar__dropdown-list--open' : ''
              }`}
            >
              {TOURNAMENT_ITEMS.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `menu-bar__dropdown-link ${
                        isActive ? 'menu-bar__dropdown-link--active' : ''
                      }`
                    }
                    onClick={() => setOpenDropdown(null)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </li>
        ) : null}
        {cohortMenus.map((menu) => {
          const firstCohort = cohorts[0];
          const defaultCohort = firstCohort
            ? (typeof firstCohort === 'object' ? firstCohort.id || firstCohort.value : firstCohort)
            : 'men';
          const defaultPath = getCohortPath(menu, defaultCohort);
          const hasCohorts = cohorts.length > 0;
          return (
          <li
            key={menu.key}
            className="menu-bar__dropdown"
            onMouseEnter={() => setOpenDropdown(menu.key)}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            {hasCohorts ? (
              <button
                type="button"
                className={`menu-bar__link menu-bar__link--trigger ${
                  isMenuActive(menu) ? 'menu-bar__link--active' : ''
                }`}
                onClick={() => setOpenDropdown((prev) => (prev === menu.key ? null : menu.key))}
                aria-expanded={openDropdown === menu.key}
                aria-haspopup="true"
              >
                {menu.label}
              </button>
            ) : (
              <NavLink
                to={defaultPath}
                className={({ isActive }) =>
                  `menu-bar__link ${isActive ? 'menu-bar__link--active' : ''}`
                }
              >
                {menu.label}
              </NavLink>
            )}
            {hasCohorts && (
              <ul
                className={`menu-bar__dropdown-list ${
                  openDropdown === menu.key ? 'menu-bar__dropdown-list--open' : ''
                }`}
              >
                {cohorts.map((cohort) => {
                  const label = typeof cohort === 'object' ? cohort.label || cohort.id || cohort : cohort;
                  const value = typeof cohort === 'object' ? cohort.id || cohort.value || String(label) : String(cohort);
                  const cohortPath = getCohortPath(menu, value);
                  return (
                    <li key={value}>
                      <NavLink
                        to={cohortPath}
                        className={({ isActive }) =>
                          `menu-bar__dropdown-link ${
                            isActive ? 'menu-bar__dropdown-link--active' : ''
                          }`
                        }
                        onClick={() => setOpenDropdown(null)}
                      >
                        {String(label).charAt(0).toUpperCase() + String(label).slice(1)}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
          );
        })}
      </ul>
      <div className="menu-bar__actions">
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default MenuBar;
