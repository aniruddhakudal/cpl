import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { fetchExpenses, formatAmount } from '../utils/expensesApi';
import {
  aggregateOutstandingByPerson,
  totalOutstandingAmount,
} from '../utils/expensesOutstanding';
import './ExpensesOutstandingModal.css';

const CHART_COLOR = '#d97706';

function truncateLabel(name, maxLen = 14) {
  const text = name || 'Unknown';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

const ExpensesOutstandingModal = ({ open, onClose, adminKey }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchExpenses({
        adminKey,
        status: 'All',
        paid: 'All',
        sortBy: 'expense_date',
        sortOrder: 'desc',
      });
      setChartData(aggregateOutstandingByPerson(result.data || []));
    } catch (err) {
      setError(err.message || 'Failed to load outstanding amounts.');
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const grandTotal = useMemo(() => totalOutstandingAmount(chartData), [chartData]);

  const tooltipStyle = useMemo(
    () => ({
      backgroundColor: theme === 'dark' ? 'rgba(26, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
      padding: '10px 12px',
      border: theme === 'dark' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: theme === 'dark' ? '0 4px 16px rgba(0,0,0,0.45)' : '0 2px 8px rgba(0,0,0,0.12)',
      color: theme === 'dark' ? '#f5f5f4' : '#333',
    }),
    [theme],
  );

  const displayData = useMemo(
    () =>
      chartData.map((row) => ({
        ...row,
        label: truncateLabel(row.name),
        fullName: row.name,
      })),
    [chartData],
  );

  const chartHeight = Math.min(520, Math.max(280, displayData.length * 36 + 120));

  if (!open) {
    return null;
  }

  return (
    <div className="expenses-modal-overlay" onClick={onClose}>
      <div
        className="expenses-modal expenses-outstanding-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expenses-outstanding-title"
      >
        <h2 id="expenses-outstanding-title">Outstanding amount by person</h2>
        <p className="expenses-form-note expenses-outstanding-note">
          Includes pending and approved expenses that are not declined and not yet marked paid.
          Grouped by &quot;Paid by&quot; name.
        </p>

        {loading && <p className="expenses-outstanding-status">Loading…</p>}
        {error && <p className="expenses-error" role="alert">{error}</p>}

        {!loading && !error && chartData.length === 0 && (
          <p className="expenses-outstanding-status">No outstanding expenses to show.</p>
        )}

        {!loading && !error && chartData.length > 0 && (
          <>
            <p className="expenses-outstanding-total">
              Total outstanding: <strong>{formatAmount(grandTotal)}</strong>
            </p>
            <div className="expenses-outstanding-chart">
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart
                  data={displayData}
                  margin={{ top: 12, right: 16, left: 8, bottom: 72 }}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.25)" />
                  <XAxis
                    dataKey="label"
                    interval={0}
                    angle={displayData.length > 6 ? -40 : 0}
                    textAnchor={displayData.length > 6 ? 'end' : 'middle'}
                    height={displayData.length > 6 ? 88 : 48}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${v}`
                    }
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(245, 158, 11, 0.12)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0].payload;
                      return (
                        <div style={tooltipStyle}>
                          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{row.fullName}</p>
                          <p style={{ margin: 0 }}>{formatAmount(row.amount)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="amount" name="Outstanding" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        <div className="expenses-modal-actions">
          <button type="button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesOutstandingModal;
