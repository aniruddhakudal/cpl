import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { fetchCohorts } from '../utils/tournamentLoader';
import ThemeToggle from './ThemeToggle';
import './MenuBar.css';

const DEFAULT_ENTITY = 'celebria';
const CLOSE_DELAY_MS = 200;
const CLICK_OPEN_GRACE_MS = 250;

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

const MOBILE_BREAKPOINT = 768;

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
};

const MenuBar = () => {
  const location = useLocation();
  const entity = getEntityFromPath(location.pathname);
  const basePath = getBasePath(entity);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cohorts, setCohorts] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const closeTimeoutRef = useRef(null);
  const clickOpenTimeRef = useRef(0);

  const closeDrawer = () => setDrawerOpen(false);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const scheduleClose = (key) => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown((prev) => (prev === key ? null : prev));
      closeTimeoutRef.current = null;
    }, CLOSE_DELAY_MS);
  };

  const handleDropdownEnter = (key) => {
    clearCloseTimeout();
    setOpenDropdown(key);
  };

  const handleDropdownLeave = (key) => {
    if (Date.now() - clickOpenTimeRef.current < CLICK_OPEN_GRACE_MS) return;
    scheduleClose(key);
  };

  const handleDropdownClick = (key) => {
    clearCloseTimeout();
    setOpenDropdown((prev) => {
      const willOpen = prev !== key;
      if (willOpen) clickOpenTimeRef.current = Date.now();
      return willOpen ? key : null;
    });
  };

  const navRef = useRef(null);

  useEffect(() => {
    return () => clearCloseTimeout();
  }, []);

  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenDropdown(null);
        clearCloseTimeout();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  useEffect(() => {
    const loadCohorts = async () => {
      const data = await fetchCohorts(entity);
      setCohorts(Array.isArray(data) ? data : []);
    };
    loadCohorts();
  }, [entity]);

  useEffect(() => {
    if (drawerOpen && isMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, isMobile]);

  const cohortMenus = [
    { key: 'statboard', label: 'Stats', basePath },
    { key: 'profile', label: 'Players', basePath },
  ];

  const getCohortPath = (menu, cohort) => {
    if (menu.key === 'statboard') return `${menu.basePath}/${cohort}`;
    if (menu.key === 'profile') return `${menu.basePath}/${cohort}/profile`;
    return menu.basePath;
  };

  const firstCohort = cohorts[0];
  const defaultCohort = firstCohort
    ? (typeof firstCohort === 'object' ? firstCohort.id || firstCohort.value : firstCohort)
    : 'men';
  const rulesPath = `${basePath}/${defaultCohort}/cpl_rules`;

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
        !path.endsWith('/cpl_rules') &&
        !path.endsWith('/cpl_x_schedule');
    }
    if (menu.key === 'register') return path.startsWith('/cpl/register');
    if (menu.key === 'profile') return path.endsWith('/profile');
    return false;
  };

  const linkProps = (to, extra = {}) => ({
    to,
    className: ({ isActive }) => `menu-bar__link ${isActive ? 'menu-bar__link--active' : ''}`,
    onClick: isMobile ? closeDrawer : undefined,
    ...extra,
  });

  return (
    <>
      <nav ref={navRef} className={`menu-bar ${isCelebria ? 'menu-bar--centered' : ''} ${isMobile ? 'menu-bar--mobile' : ''}`}>
        {!isCelebria && (
          <div className="menu-bar__brand">
            <NavLink to="/" className="menu-bar__brand-link" aria-label="Crickipedia Stats - Home">
              <img
                src="/data/images/crickipedia/crickipedia_button1.png"
                alt="Crickipedia Stats"
                className="menu-bar__brand-img"
              />
            </NavLink>
          </div>
        )}
        {isMobile && (
          <button
            type="button"
            className="menu-bar__hamburger"
            onClick={() => setDrawerOpen((o) => !o)}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={drawerOpen}
          >
            <span className="menu-bar__hamburger-bar" />
            <span className="menu-bar__hamburger-bar" />
            <span className="menu-bar__hamburger-bar" />
          </button>
        )}
      <ul className={`menu-bar__items ${isMobile ? 'menu-bar__items--desktop-only' : ''}`}>
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
        {isCelebria && (
          <li>
            <a
              href="https://raneonkar.com/cpl/"
              target="_blank"
              rel="noopener noreferrer"
              className="menu-bar__link"
            >
              Auction
            </a>
          </li>
        )}
        {isCelebria && (
          <li>
            <NavLink
              to="/cpl/register"
              className={({ isActive }) =>
                `menu-bar__link ${isActive ? 'menu-bar__link--active' : ''}`
              }
              onClick={isMobile ? closeDrawer : undefined}
            >
              Join CPL
            </NavLink>
          </li>
        )}
        {isCrickipedia ? (
          <li
            className="menu-bar__dropdown"
            onMouseEnter={() => handleDropdownEnter('tournaments')}
            onMouseLeave={() => handleDropdownLeave('tournaments')}
          >
            <button
              type="button"
              className={`menu-bar__link menu-bar__link--trigger ${
                isTournamentsActive() ? 'menu-bar__link--active' : ''
              }`}
              onClick={() => handleDropdownClick('tournaments')}
              onMouseEnter={() => handleDropdownEnter('tournaments')}
              onMouseLeave={() => handleDropdownLeave('tournaments')}
              aria-expanded={openDropdown === 'tournaments'}
              aria-haspopup="true"
            >
              Tournaments
            </button>
            <ul
              className={`menu-bar__dropdown-list ${
                openDropdown === 'tournaments' ? 'menu-bar__dropdown-list--open' : ''
              }`}
              onMouseEnter={() => handleDropdownEnter('tournaments')}
              onMouseLeave={() => handleDropdownLeave('tournaments')}
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
        {(!isCrickipedia || location.pathname !== '/') &&
        cohortMenus.map((menu) => {
          const defaultPath = getCohortPath(menu, defaultCohort);
          const hasCohorts = cohorts.length > 0;
          return (
          <li
            key={menu.key}
            className="menu-bar__dropdown"
            onMouseEnter={() => handleDropdownEnter(menu.key)}
            onMouseLeave={() => handleDropdownLeave(menu.key)}
          >
            {hasCohorts ? (
              <button
                type="button"
                className={`menu-bar__link menu-bar__link--trigger ${
                  isMenuActive(menu) ? 'menu-bar__link--active' : ''
                }`}
                onClick={() => handleDropdownClick(menu.key)}
                onMouseEnter={() => handleDropdownEnter(menu.key)}
                onMouseLeave={() => handleDropdownLeave(menu.key)}
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
                onMouseEnter={() => handleDropdownEnter(menu.key)}
                onMouseLeave={() => handleDropdownLeave(menu.key)}
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
        {(!isCrickipedia || location.pathname !== '/') && (
          <li>
            <NavLink
              to={rulesPath}
              className={({ isActive }) =>
                `menu-bar__link ${isActive ? 'menu-bar__link--active' : ''}`
              }
            >
              Rules
            </NavLink>
          </li>
        )}
      </ul>
      <div className="menu-bar__actions">
        <ThemeToggle />
      </div>
    </nav>

    {isMobile && (
      <>
        <div
          className={`menu-bar__drawer-backdrop ${drawerOpen ? 'menu-bar__drawer-backdrop--open' : ''}`}
          onClick={closeDrawer}
          aria-hidden="true"
        />
        <aside
          className={`menu-bar__drawer ${drawerOpen ? 'menu-bar__drawer--open' : ''}`}
          aria-label="Navigation menu"
        >
          <ul className="menu-bar__drawer-list">
            <li>
              <NavLink {...linkProps('/', { end: true })}>Home</NavLink>
            </li>
            {isCelebria && (
              <li>
                <a
                  href="https://raneonkar.com/cpl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="menu-bar__link"
                  onClick={closeDrawer}
                >
                  Auction
                </a>
              </li>
            )}
            {isCelebria && (
              <li>
                <NavLink {...linkProps('/cpl/register')}>Join CPL</NavLink>
              </li>
            )}
            {isCrickipedia && TOURNAMENT_ITEMS.map((item) => (
              <li key={item.path}>
                <NavLink {...linkProps(item.path)}>{item.label}</NavLink>
              </li>
            ))}
            {(!isCrickipedia || location.pathname !== '/') &&
              cohorts.map((cohort) => {
                const value = typeof cohort === 'object' ? cohort.id || cohort.value || cohort.label : cohort;
                const label = typeof cohort === 'object' ? cohort.label || cohort.id || cohort : cohort;
                const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
                return (
                  <li key={`stats-${value}`}>
                    <NavLink {...linkProps(`${basePath}/${value}`)}>
                      {cap(label)} Stats
                    </NavLink>
                  </li>
                );
              })}
            {(!isCrickipedia || location.pathname !== '/') &&
              cohorts.map((cohort) => {
                const value = typeof cohort === 'object' ? cohort.id || cohort.value || cohort.label : cohort;
                const label = typeof cohort === 'object' ? cohort.label || cohort.id || cohort : cohort;
                const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
                return (
                  <li key={`players-${value}`}>
                    <NavLink {...linkProps(`${basePath}/${value}/profile`)}>
                      {cap(label)} Players
                    </NavLink>
                  </li>
                );
              })}
            {(!isCrickipedia || location.pathname !== '/') && (
              <li>
                <NavLink {...linkProps(rulesPath)}>Rules</NavLink>
              </li>
            )}
          </ul>
        </aside>
      </>
    )}
    </>
  );
};

export default MenuBar;
