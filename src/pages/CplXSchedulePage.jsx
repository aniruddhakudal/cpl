import { useState, useEffect, useMemo } from 'react';
import './CplXSchedulePage.css';

function scheduleJsonPath() {
  const base = import.meta.env.BASE_URL || '/';
  const rel = 'data/cpl_x_schedule.json';
  return base.endsWith('/') ? `${base}${rel}` : `${base}/${rel}`;
}

function inferTeamColumnIndices(headers) {
  return headers
    .map((h, i) => ({ h: String(h || '').trim().toLowerCase(), i }))
    .filter(({ h }) => /team|home|away|side|vs\b|versus/.test(h))
    .map(({ i }) => i);
}

/**
 * @param {unknown} data
 * @returns {null | { title: string, headers: string[], teamColumnIndices: number[], rows: string[][] }}
 */
function normalizeSchedule(data) {
  if (!data || typeof data !== 'object') return null;
  const headers = data.headers;
  if (!Array.isArray(headers) || headers.length === 0) return null;
  const headerStrs = headers.map((h) => String(h));
  let rows = data.rows;
  if (!Array.isArray(rows)) return null;

  if (rows.length && typeof rows[0] === 'object' && !Array.isArray(rows[0])) {
    rows = rows.map((obj) => headerStrs.map((h) => (obj[h] != null ? String(obj[h]).trim() : '')));
  } else {
    rows = rows.map((r) => headerStrs.map((_, i) => (Array.isArray(r) && r[i] != null ? String(r[i]).trim() : '')));
  }

  let teamColumnIndices = data.teamColumnIndices;
  if (!Array.isArray(teamColumnIndices) || teamColumnIndices.length === 0) {
    teamColumnIndices = inferTeamColumnIndices(headerStrs);
  }
  if (teamColumnIndices.length === 0 && headerStrs.length >= 2) {
    teamColumnIndices = [headerStrs.length - 2, headerStrs.length - 1];
  }

  return {
    title: typeof data.title === 'string' ? data.title : 'CPL X schedule',
    headers: headerStrs,
    teamColumnIndices,
    rows,
  };
}

export default function CplXSchedulePage() {
  const [schedule, setSchedule] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chipSearch, setChipSearch] = useState('');
  const [selectedTeams, setSelectedTeams] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await fetch(scheduleJsonPath(), { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Could not load schedule (${res.status}). Add public/data/cpl_x_schedule.json`);
        }
        const data = await res.json();
        const norm = normalizeSchedule(data);
        if (!norm) {
          throw new Error('Invalid schedule JSON: need headers and rows.');
        }
        if (!cancelled) setSchedule(norm);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load schedule.');
          setSchedule(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const teamsInTable = useMemo(() => {
    if (!schedule) return [];
    const set = new Set();
    for (const row of schedule.rows) {
      for (const i of schedule.teamColumnIndices) {
        const v = row[i]?.trim();
        if (v) set.add(v);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [schedule]);

  const normalizedChipSearch = chipSearch.trim().toLowerCase();
  const filteredChips = useMemo(() => {
    if (!normalizedChipSearch) return teamsInTable;
    return teamsInTable.filter((t) => t.toLowerCase().includes(normalizedChipSearch));
  }, [teamsInTable, normalizedChipSearch]);

  const filteredRows = useMemo(() => {
    if (!schedule) return [];
    if (selectedTeams.size === 0) return schedule.rows;
    return schedule.rows.filter((row) =>
      schedule.teamColumnIndices.some((i) => {
        const cell = row[i]?.trim();
        return cell && selectedTeams.has(cell);
      })
    );
  }, [schedule, selectedTeams]);

  const toggleTeam = (name) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const clearTeams = () => setSelectedTeams(new Set());

  if (loading) {
    return (
      <div className="schedule-page">
        <p className="schedule-page__meta schedule-page__meta--center">Loading schedule…</p>
      </div>
    );
  }

  if (loadError || !schedule) {
    return (
      <div className="schedule-page">
        <header className="schedule-page__header">
          <h1 className="schedule-page__title">CPL X schedule</h1>
        </header>
        <p className="schedule-page__meta schedule-page__meta--warn">{loadError || 'No schedule data.'}</p>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <header className="schedule-page__header">
        <h1 className="schedule-page__title">CPL X schedule</h1>
        {schedule.title ? <p className="schedule-page__subtitle schedule-page__subtitle--title">{schedule.title}</p> : null}
        <p className="schedule-page__subtitle">
          Built from <code className="schedule-page__code">public/cpl_x_schedule.jpeg</code> via{' '}
          <code className="schedule-page__code">npm run convert:cpl-x-schedule</code> (writes{' '}
          <code className="schedule-page__code">public/data/cpl_x_schedule.json</code>). CSV fallback:{' '}
          <code className="schedule-page__code">npm run import:cpl-x-schedule</code>.
        </p>
      </header>

      <section className="schedule-page__toolbar" aria-label="Filter by team">
        <label className="schedule-page__filter-label" htmlFor="schedule-chip-search">
          Find teams (narrows chips)
        </label>
        <input
          id="schedule-chip-search"
          type="search"
          className="schedule-page__filter-input"
          placeholder="Type part of a team name…"
          value={chipSearch}
          onChange={(e) => setChipSearch(e.target.value)}
          autoComplete="off"
        />
        <p className="schedule-page__filter-hint">
          Select one or more teams to show only fixtures involving those teams. Clear selection to show all rows.
        </p>
        <div className="schedule-page__chips" role="group" aria-label="Teams in schedule">
          {filteredChips.map((t) => {
            const on = selectedTeams.has(t);
            return (
              <button
                key={t}
                type="button"
                className={`schedule-page__chip ${on ? 'schedule-page__chip--active' : ''}`}
                onClick={() => toggleTeam(t)}
                aria-pressed={on}
              >
                {t}
              </button>
            );
          })}
        </div>
        {selectedTeams.size > 0 && (
          <div className="schedule-page__selection-actions">
            <span className="schedule-page__meta">
              Showing rows for {selectedTeams.size} team(s) · {filteredRows.length} row(s)
            </span>
            <button type="button" className="schedule-page__clear-btn" onClick={clearTeams}>
              Show all teams
            </button>
          </div>
        )}
      </section>

      <div className="schedule-page__table-wrap">
        <table className="schedule-table">
          <thead>
            <tr>
              {schedule.headers.map((h, colIdx) => (
                <th key={`${colIdx}-${h || 'col'}`} className="schedule-table__th">
                  {String(h).trim() ? h : `Column ${colIdx + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="schedule-table__td schedule-table__td--empty" colSpan={schedule.headers.length}>
                  No fixtures match the selected teams.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, idx) => (
                <tr
                  key={`${idx}-${row.join('|')}`}
                  className={idx % 2 === 0 ? 'schedule-table__tr schedule-table__tr--stripe-a' : 'schedule-table__tr schedule-table__tr--stripe-b'}
                >
                  {schedule.headers.map((_, colIdx) => (
                    <td key={colIdx} className="schedule-table__td">
                      {row[colIdx] ?? ''}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
