/**
 * Loads pre-converted rules from JSON.
 * Rules are pre-converted at build time via: npm run build:rules
 */
export const loadRulesFromDocx = async () => {
  try {
    const response = await fetch('/data/CPL_RULES.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rules = await response.json();
    return Array.isArray(rules) ? rules : [];
  } catch (error) {
    console.error('Error loading rules:', error);
    throw error;
  }
};
