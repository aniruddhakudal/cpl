/** Expenses included: not declined, and not marked paid (pending + approved unpaid). */

export function isOutstandingExpense(expense) {
  if (!expense || expense.status === 'Declined') {
    return false;
  }
  if (expense.status === 'Approved' && expense.is_paid) {
    return false;
  }
  return true;
}

export function aggregateOutstandingByPerson(expenses) {
  const totals = new Map();

  for (const expense of expenses || []) {
    if (!isOutstandingExpense(expense)) {
      continue;
    }
    const person = (expense.made_by || '').trim() || 'Unknown';
    const amount = Number(expense.amount);
    if (Number.isNaN(amount)) {
      continue;
    }
    totals.set(person, (totals.get(person) || 0) + amount);
  }

  return [...totals.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function totalOutstandingAmount(chartData) {
  return (chartData || []).reduce((sum, row) => sum + row.amount, 0);
}
