import { useState, useEffect } from 'react';
import { loadRulesFromDocx } from '../utils/rulesLoader';
import './CPLRulesPage.css';

const CPLRulesPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRules, setExpandedRules] = useState(new Set());

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        const rulesData = await loadRulesFromDocx();
        setRules(rulesData);
        setError(null);
      } catch (err) {
        setError('Failed to load rules. Please ensure the rules file is accessible.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const toggleRule = (index) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRules(newExpanded);
  };

  const expandAll = () => {
    const allIndices = new Set(rules.map((_, index) => index));
    setExpandedRules(allIndices);
  };

  const collapseAll = () => {
    setExpandedRules(new Set());
  };

  if (loading) {
    return (
      <div className="rules-loading-container">
        <div className="spinner"></div>
        <p>Loading rules...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rules-error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="rules-page">
      <header className="rules-header">
        <div className="rules-header-content">
          <img 
            src="/data/cpl_logo.png" 
            alt="CPL Logo" 
            className="rules-logo"
          />
          <h1 className="rules-title">CPL Rule Book</h1>
        </div>
      </header>
      
      <div className="rules-controls">
        <button onClick={expandAll} className="rules-control-btn">
          Expand All
        </button>
        <button onClick={collapseAll} className="rules-control-btn">
          Collapse All
        </button>
      </div>

      <div className="rules-content">
        {rules.length === 0 ? (
          <p className="no-rules">No rules found. Please ensure the rules file contains rules starting with "Rule:".</p>
        ) : (
          rules.map((rule, index) => {
            const isExpanded = expandedRules.has(index);
            return (
              <div key={index} className="rule-item">
                <button
                  className={`rule-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleRule(index)}
                  aria-expanded={isExpanded}
                >
                  <span className="rule-number">Rule {rule.number}</span>
                  <span className="rule-title">{rule.title}</span>
                  <span className="rule-toggle-icon">
                    {isExpanded ? '▼' : '▶'}
                  </span>
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
    </div>
  );
};

export default CPLRulesPage;

