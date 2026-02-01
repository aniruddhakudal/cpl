import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { fetchCohorts } from '../utils/tournamentLoader';
import ThemeToggle from './ThemeToggle';
import './MenuBar.css';

const DEFAULT_ENTITY = 'celebria';

const getEntityFromPath = (pathname) => {
  const match = pathname.match(/^\/sports\/cricket\/([^/]+)/);
  return match ? match[1] : DEFAULT_ENTITY;
};

const MenuBar = () => {
  const location = useLocation();
  const entity = getEntityFromPath(location.pathname);
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
    { key: 'statboard', label: 'Statboard', basePath: `/sports/cricket/${entity}` },
    { key: 'profile', label: 'Profile', basePath: `/sports/cricket/${entity}` },
    { key: 'rules', label: 'Rules', basePath: `/sports/cricket/${entity}` },
  ];

  const getCohortPath = (menu, cohort) => {
    if (menu.key === 'statboard') return `${menu.basePath}/${cohort}`;
    if (menu.key === 'profile') return `${menu.basePath}/${cohort}/profile`;
    if (menu.key === 'rules') return `${menu.basePath}/${cohort}/cpl_rules`;
    return menu.basePath;
  };

  const isMenuActive = (menu) => {
    if (menu.key === 'statboard') {
      return location.pathname.startsWith(`/sports/cricket/${entity}/`) &&
        !location.pathname.endsWith('/profile') &&
        !location.pathname.endsWith('/cpl_rules');
    }
    if (menu.key === 'profile') return location.pathname.endsWith('/profile');
    if (menu.key === 'rules') return location.pathname.endsWith('/cpl_rules');
    return false;
  };

  return (
    <nav className="menu-bar">
      <div className="menu-bar__brand">Crickipedia Stats</div>
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
              <span
                className={`menu-bar__link menu-bar__link--trigger ${
                  isMenuActive(menu) ? 'menu-bar__link--active' : ''
                }`}
              >
                {menu.label}
              </span>
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
