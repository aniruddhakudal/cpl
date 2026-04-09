import { useState, useEffect, useMemo } from 'react';
import { loadRulesFromDocx } from '../utils/rulesLoader';
import { useTheme } from '../contexts/ThemeContext';
import './CPLRulesPage.css';

function cplxRulesHtmlPath() {
  const base = import.meta.env.BASE_URL || '/';
  const rel = 'data/CPLX_rules.html';
  return base.endsWith('/') ? `${base}${rel}` : `${base}/${rel}`;
}

/** Matches index.css :root tokens so iframe content follows the app theme toggle. */
function injectCplxHtmlTheme(html, theme) {
  if (!html || !html.includes('</head>')) return html;
  const block =
    theme === 'dark'
      ? `
  html { color-scheme: dark; }
  body {
    color: #e0e0e0;
    background: rgba(30, 30, 46, 0.98);
  }
  table, p, li, td, th, strong, em { color: inherit; }
  td, th {
    border: 1px solid #4f4f6a;
  }
  hr.docx-hr {
    border-top-color: #64748b;
  }
  a { color: #8b9cff; }
`
      : `
  html { color-scheme: light; }
  body {
    color: #1e293b;
    background: #ffffff;
  }
  table, p, li, td, th, strong, em { color: inherit; }
  td, th {
    border: 1px solid #cbd5e1;
  }
  hr.docx-hr {
    border-top-color: #64748b;
  }
  a { color: #4f46e5; }
`;
  return html.replace(
    '</head>',
    `<style data-cplx-theme="${theme}">\n${block}\n</style>\n</head>`
  );
}

const CPLRulesPage = () => {
  const { theme } = useTheme();
  const [view, setView] = useState('cplx');
  const [cplxHtml, setCplxHtml] = useState(null);
  const [cplxLoading, setCplxLoading] = useState(false);
  const [cplxError, setCplxError] = useState(null);
  const [rules, setRules] = useState([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());

  useEffect(() => {
    if (view !== 'cplx') return;
    let cancelled = false;
    (async () => {
      try {
        setCplxLoading(true);
        setCplxError(null);
        const res = await fetch(cplxRulesHtmlPath(), { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Could not load CPL X rules (${res.status}). Run npm run convert:cplx-html if the file is missing.`);
        }
        const text = await res.text();
        if (!cancelled) setCplxHtml(text);
      } catch (err) {
        if (!cancelled) {
          setCplxError(err instanceof Error ? err.message : 'Failed to load CPL X rules.');
          setCplxHtml(null);
        }
      } finally {
        if (!cancelled) setCplxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view]);

  const cplxSrcDoc = useMemo(() => injectCplxHtmlTheme(cplxHtml, theme), [cplxHtml, theme]);

  useEffect(() => {
    if (view !== 'full' || rules.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingRules(true);
        setRulesError(null);
        const rulesData = await loadRulesFromDocx();
        if (!cancelled) setRules(rulesData);
      } catch (err) {
        if (!cancelled) {
          setRulesError('Failed to load rule book. Please ensure the rules file is accessible.');
        }
        console.error(err);
      } finally {
        if (!cancelled) setLoadingRules(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, rules.length]);

  const toggleRule = (index) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedRules(newExpanded);
  };

  const expandAll = () => {
    setExpandedRules(new Set(rules.map((_, index) => index)));
  };

  const collapseAll = () => {
    setExpandedRules(new Set());
  };

  return (
    <div className="rules-page">
      <header className="rules-header">
        <div className="rules-header-content">
          <img src="/data/cpl_logo.png" alt="CPL Logo" className="rules-logo" />
          <h1 className="rules-title">CPL Rules</h1>
        </div>
      </header>

      <div className="rules-view-toggle">
        <button
          type="button"
          className={`rules-view-btn ${view === 'cplx' ? 'rules-view-btn--active' : ''}`}
          onClick={() => setView('cplx')}
        >
          CPL X Rules
        </button>
        <button
          type="button"
          className={`rules-view-btn ${view === 'full' ? 'rules-view-btn--active' : ''}`}
          onClick={() => setView('full')}
        >
          Full rule book
        </button>
      </div>

      {view === 'cplx' && (
        <div className="rules-pdf-wrap">
          {cplxLoading && (
            <div className="rules-loading-container">
              <div className="spinner" />
              <p>Loading CPL X rules...</p>
            </div>
          )}
          {cplxError && !cplxLoading && (
            <div className="rules-error-container">
              <h2>Could not load rules</h2>
              <p>{cplxError}</p>
            </div>
          )}
          {!cplxLoading && !cplxError && cplxSrcDoc && (
            <iframe
              title="CPL X Rules"
              srcDoc={cplxSrcDoc}
              className="rules-pdf-frame rules-html-frame"
            />
          )}
        </div>
      )}

      {view === 'full' && (
        <>
          {loadingRules && (
            <div className="rules-loading-container">
              <div className="spinner" />
              <p>Loading rules...</p>
            </div>
          )}
          {rulesError && !loadingRules && (
            <div className="rules-error-container">
              <h2>Error</h2>
              <p>{rulesError}</p>
            </div>
          )}
          {!loadingRules && !rulesError && (
            <>
              <div className="rules-controls">
                <button type="button" onClick={expandAll} className="rules-control-btn">
                  Expand All
                </button>
                <button type="button" onClick={collapseAll} className="rules-control-btn">
                  Collapse All
                </button>
              </div>
              <div className="rules-content">
                {rules.length === 0 ? (
                  <p className="no-rules">
                    No rules found. Please ensure the rules file contains rules starting with &quot;Rule:&quot;.
                  </p>
                ) : (
                  rules.map((rule, index) => {
                    const isExpanded = expandedRules.has(index);
                    return (
                      <div key={index} className="rule-item">
                        <button
                          type="button"
                          className={`rule-header ${isExpanded ? 'expanded' : ''}`}
                          onClick={() => toggleRule(index)}
                          aria-expanded={isExpanded}
                        >
                          <span className="rule-number">Rule {rule.number}</span>
                          <span className="rule-title">{rule.title}</span>
                          <span className="rule-toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                        </button>
                        {isExpanded && (
                          <div className="rule-content">
                            <div
                              className="rule-body"
                              dangerouslySetInnerHTML={{ __html: rule.content }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CPLRulesPage;
