import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import ScheduleButton from '../components/ScheduleButton';
import ExpensesOutstandingModal from '../components/ExpensesOutstandingModal';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import {
  ADMIN_KEY_STORAGE,
  adminUpdateExpense,
  approveExpense,
  buildExpenseFormData,
  createExpense,
  declineExpense,
  deleteExpense,
  downloadExpensesExport,
  downloadReceipt,
  fetchExpenses,
  formatAmount,
  formatExpenseDate,
  resubmitExpense,
  paymentStatusClassName,
  paymentStatusLabel,
  setExpensePaid,
  statusClassName,
  validateSubmitterUpi,
} from '../utils/expensesApi';
import './ExpensesPage.css';

const emptyForm = {
  description: '',
  made_by: '',
  amount: '',
  expense_date: '',
  submitter_contact: '',
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminKeyInput, setAdminKeyInput] = useState('');
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem(ADMIN_KEY_STORAGE) || '');
  const [adminMessage, setAdminMessage] = useState('');

  const [statusFilter, setStatusFilter] = useState('All');
  const [paidFilter, setPaidFilter] = useState('All');
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const [form, setForm] = useState(emptyForm);
  const [receiptFiles, setReceiptFiles] = useState([]);
  const [contactError, setContactError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);

  const [actionExpense, setActionExpense] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminRemark, setAdminRemark] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const [resubmitExpenseItem, setResubmitExpenseItem] = useState(null);
  const [resubmitForm, setResubmitForm] = useState(emptyForm);
  const [resubmitContact, setResubmitContact] = useState('');
  const [resubmitFiles, setResubmitFiles] = useState([]);
  const [resubmitError, setResubmitError] = useState('');
  const [resubmitSubmitting, setResubmitSubmitting] = useState(false);
  const [editExpenseItem, setEditExpenseItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editFiles, setEditFiles] = useState([]);
  const [editContactError, setEditContactError] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [downloadingReceiptId, setDownloadingReceiptId] = useState(null);
  const [paidUpdatingId, setPaidUpdatingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [outstandingOpen, setOutstandingOpen] = useState(false);

  const handleDownloadReceipt = async (receipt) => {
    setDownloadingReceiptId(receipt.id);
    try {
      await downloadReceipt(receipt);
    } catch (err) {
      window.alert(err.message || 'Failed to download receipt.');
    } finally {
      setDownloadingReceiptId(null);
    }
  };

  const loadExpenses = useCallback(async (key = adminKey) => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchExpenses({
        adminKey: key,
        status: statusFilter,
        paid: paidFilter,
        sortBy,
        sortOrder,
      });
      setExpenses(result.data || []);
      setIsAdmin(Boolean(result.is_admin));
      if (key && !result.is_admin) {
        sessionStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey('');
        setIsAdmin(false);
        setAdminMessage('Invalid admin key.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }, [adminKey, statusFilter, paidFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminMessage('');
    const key = adminKeyInput.trim();
    if (!key) {
      setAdminMessage('Enter admin key.');
      return;
    }
    try {
      const result = await fetchExpenses({ adminKey: key });
      if (result.is_admin) {
        sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
        setAdminKey(key);
        setIsAdmin(true);
        setExpenses(result.data || []);
        setAdminKeyInput('');
        setAdminMessage('Admin access enabled.');
        return;
      }
      throw new Error('Invalid admin key.');
    } catch (err) {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE);
      setAdminKey('');
      setIsAdmin(false);
      setAdminMessage(err.message || 'Invalid admin key.');
    }
  };

  const handleExportZip = async () => {
    if (!isAdmin) return;
    setExporting(true);
    setFormSuccess('');
    try {
      await downloadExpensesExport({
        adminKey,
        status: statusFilter,
        paid: paidFilter,
        sortBy,
        sortOrder,
      });
      setFormSuccess('Download started (Excel + receipts ZIP).');
    } catch (err) {
      window.alert(err.message || 'Failed to export expenses.');
    } finally {
      setExporting(false);
    }
  };

  const handleTogglePaid = async (expense) => {
    const nextPaid = !expense.is_paid;
    const action = nextPaid ? 'mark as paid' : 'mark as unpaid';
    const confirmed = window.confirm(
      `${action.charAt(0).toUpperCase() + action.slice(1)} for "${expense.description}"?`,
    );
    if (!confirmed) return;

    setPaidUpdatingId(expense.id);
    try {
      await setExpensePaid(expense.id, nextPaid, adminKey);
      setFormSuccess(nextPaid ? 'Marked as paid.' : 'Marked as unpaid.');
      await loadExpenses();
    } catch (err) {
      window.alert(err.message || 'Failed to update paid status.');
    } finally {
      setPaidUpdatingId(null);
    }
  };

  const handleDeleteExpense = async (expense) => {
    const confirmed = window.confirm(
      `Delete expense "${expense.description}" (${formatAmount(expense.amount)})?`,
    );
    if (!confirmed) return;

    try {
      await deleteExpense(expense.id, adminKey);
      await loadExpenses();
    } catch (err) {
      window.alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey('');
    setAdminKeyInput('');
    setIsAdmin(false);
    setAdminMessage('');
    loadExpenses('');
  };

  const mergeReceiptFiles = (existing, incoming, maxTotal) => {
    const merged = [...existing];
    for (const file of incoming) {
      if (merged.length >= maxTotal) break;
      const isDuplicate = merged.some(
        (item) =>
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified,
      );
      if (!isDuplicate) {
        merged.push(file);
      }
    }
    return merged;
  };

  const handleReceiptChange = (e, setter, maxTotal = 3) => {
    const incoming = Array.from(e.target.files || []);
    setter((prev) => mergeReceiptFiles(prev, incoming, maxTotal));
    e.target.value = '';
  };

  const removeReceiptFile = (index, setter) => {
    setter((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const renderReceiptPicker = (files, setter, maxTotal, inputId, hint) => {
    if (maxTotal <= 0) {
      return (
        <p className="expenses-receipt-hint">Maximum of 3 receipts already attached.</p>
      );
    }

    return (
    <div className="expenses-receipt-picker">
      <label htmlFor={inputId}>
        Receipts (up to {maxTotal} image{maxTotal === 1 ? '' : 's'} or PDFs)
      </label>
      <p className="expenses-receipt-hint">
        {hint || 'Pick files one at a time or select multiple together.'}
      </p>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        disabled={files.length >= maxTotal}
        onChange={(e) => handleReceiptChange(e, setter, maxTotal)}
      />
      {files.length > 0 && (
        <ul className="expenses-file-list">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`}>
              <span>{file.name}</span>
              <button
                type="button"
                className="expenses-file-remove"
                onClick={() => removeReceiptFile(index, setter)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="expenses-file-count">{files.length} / {maxTotal} selected</p>
    </div>
    );
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setContactError('');

    const phoneError = validateSubmitterUpi(form.submitter_contact);
    if (phoneError) {
      setContactError(phoneError);
      return;
    }
    if (receiptFiles.length > 3) {
      setFormError('Maximum 3 receipt files allowed.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = buildExpenseFormData(
        {
          description: form.description.trim(),
          made_by: form.made_by.trim(),
          amount: form.amount,
          expense_date: form.expense_date,
          submitter_contact: form.submitter_contact.trim(),
        },
        receiptFiles,
      );
      const result = await createExpense(formData);
      setForm(emptyForm);
      setReceiptFiles([]);
      const warnings = result.receipt_warnings || [];
      setFormSuccess(
        warnings.length > 0
          ? `Expense submitted. Note: ${warnings[0]}`
          : 'Expense submitted for approval.',
      );
      setSubmitModalOpen(false);
      await loadExpenses();
    } catch (err) {
      setFormError(err.message || 'Failed to submit expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitModal = () => {
    setFormError('');
    setFormSuccess('');
    setContactError('');
    setSubmitModalOpen(true);
  };

  const closeSubmitModal = () => {
    if (submitting) return;
    setSubmitModalOpen(false);
    setFormError('');
    setContactError('');
  };

  const openApprove = (expense) => {
    setActionExpense(expense);
    setActionType('approve');
    setAdminRemark('');
    setActionError('');
  };

  const openDecline = (expense) => {
    setActionExpense(expense);
    setActionType('decline');
    setDeclineReason('');
    setActionError('');
  };

  const closeActionModal = () => {
    setActionExpense(null);
    setActionType('');
    setAdminRemark('');
    setDeclineReason('');
    setActionError('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionExpense) return;
    setActionError('');
    setActionSubmitting(true);
    try {
      if (actionType === 'approve') {
        await approveExpense(actionExpense.id, adminRemark.trim(), adminKey);
      } else {
        if (!declineReason.trim()) {
          setActionError('Decline reason is required.');
          setActionSubmitting(false);
          return;
        }
        await declineExpense(actionExpense.id, declineReason.trim(), adminKey);
      }
      closeActionModal();
      await loadExpenses();
    } catch (err) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const openResubmit = (expense) => {
    setResubmitExpenseItem(expense);
    setResubmitForm({
      description: expense.description,
      made_by: expense.made_by,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      submitter_contact: '',
    });
    setResubmitContact('');
    setResubmitFiles([]);
    setResubmitError('');
  };

  const closeResubmit = () => {
    setResubmitExpenseItem(null);
    setResubmitForm(emptyForm);
    setResubmitContact('');
    setResubmitFiles([]);
    setResubmitError('');
  };

  const openAdminEdit = (expense) => {
    setEditExpenseItem(expense);
    setEditForm({
      description: expense.description,
      made_by: expense.made_by,
      amount: String(expense.amount),
      expense_date: expense.expense_date,
      submitter_contact: expense.submitter_contact || '',
    });
    setEditFiles([]);
    setEditContactError('');
    setEditError('');
  };

  const closeAdminEdit = () => {
    if (editSubmitting) return;
    setEditExpenseItem(null);
    setEditForm(emptyForm);
    setEditFiles([]);
    setEditContactError('');
    setEditError('');
  };

  const handleAdminEditSubmit = async (e) => {
    e.preventDefault();
    if (!editExpenseItem) return;
    setEditError('');
    setEditContactError('');

    const upiError = validateSubmitterUpi(editForm.submitter_contact);
    if (upiError) {
      setEditContactError(upiError);
      return;
    }

    const existingCount = (editExpenseItem.receipts || []).length;
    if (existingCount + editFiles.length > 3) {
      setEditError('Maximum 3 receipt files allowed per expense.');
      return;
    }

    setEditSubmitting(true);
    try {
      const formData = buildExpenseFormData(
        {
          description: editForm.description.trim(),
          made_by: editForm.made_by.trim(),
          amount: editForm.amount,
          expense_date: editForm.expense_date,
          submitter_contact: editForm.submitter_contact.trim(),
        },
        editFiles,
      );
      const result = await adminUpdateExpense(editExpenseItem.id, formData, adminKey);
      if (result.receipt_warnings?.length) {
        setFormSuccess(`Expense updated. Note: ${result.receipt_warnings[0]}`);
      } else {
        setFormSuccess('Expense updated.');
      }
      closeAdminEdit();
      await loadExpenses();
    } catch (err) {
      setEditError(err.message || 'Failed to update expense.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleResubmit = async (e) => {
    e.preventDefault();
    if (!resubmitExpenseItem) return;
    setResubmitError('');

    const phoneError = validateSubmitterUpi(resubmitContact);
    if (phoneError) {
      setResubmitError(phoneError);
      return;
    }
    const existingCount = (resubmitExpenseItem.receipts || []).length;
    if (existingCount + resubmitFiles.length > 3) {
      setResubmitError('Maximum 3 receipt files allowed per expense.');
      return;
    }

    setResubmitSubmitting(true);
    try {
      const formData = buildExpenseFormData(
        {
          description: resubmitForm.description.trim(),
          made_by: resubmitForm.made_by.trim(),
          amount: resubmitForm.amount,
          expense_date: resubmitForm.expense_date,
          submitter_contact: resubmitContact.trim(),
        },
        resubmitFiles,
      );
      const result = await resubmitExpense(resubmitExpenseItem.id, formData);
      if (result.receipt_warnings?.length) {
        setFormSuccess(`Resubmitted. Note: ${result.receipt_warnings[0]}`);
      }
      closeResubmit();
      await loadExpenses();
    } catch (err) {
      setResubmitError(err.message || 'Failed to resubmit expense.');
    } finally {
      setResubmitSubmitting(false);
    }
  };

  return (
    <div className="expenses-page ganpati-theme">
      <ThemeToggle />

      <header className="expenses-header">
        <Link to="/" className="expenses-back-link">
          ← Back to Home
        </Link>
        <h1 className="expenses-title">Celebria Ganpati Festival 2026</h1>
        <p className="expenses-subtitle">Expense Sheet</p>
        <ScheduleButton className="expenses-back-link">View Schedule</ScheduleButton>
      </header>

      <main className="expenses-content">
        <section className="expenses-list-section">
          <div className="expenses-toolbar">
            <h2>All Expenses</h2>
            <div className="expenses-toolbar-actions">
              <button type="button" className="expenses-submit-open" onClick={openSubmitModal}>
                Submit expense
              </button>
              <button
                type="button"
                className="expenses-outstanding-open"
                onClick={() => setOutstandingOpen(true)}
              >
                Outstanding by person
              </button>
            </div>
            <div className="expenses-controls">
              <label>
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Declined">Declined</option>
                </select>
              </label>
              <label>
                Payment
                <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Unpaid">Unpaid (approved)</option>
                  <option value="Paid">Paid</option>
                </select>
              </label>
              <label>
                Sort by
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="expense_date">Expense Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                  <option value="created_at">Submitted</option>
                </select>
              </label>
              <label>
                Order
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </label>
            </div>
          </div>

          {formSuccess && <p className="expenses-success expenses-success--banner">{formSuccess}</p>}

          {!isAdmin && (
            <form className="expenses-admin-login" onSubmit={handleAdminLogin}>
              <label htmlFor="adminKey">Admin access (approve / decline / edit)</label>
              <div className="expenses-admin-login-row">
                <input
                  id="adminKey"
                  type="password"
                  value={adminKeyInput}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  placeholder="Enter admin key"
                />
                <button type="submit">Unlock</button>
              </div>
              {adminMessage && <p className="expenses-admin-message">{adminMessage}</p>}
            </form>
          )}

          {isAdmin && (
            <div className="expenses-admin-banner">
              <span>Admin mode enabled</span>
              <div className="expenses-admin-banner-actions">
                <button
                  type="button"
                  className="expenses-export-btn"
                  onClick={handleExportZip}
                  disabled={exporting || loading}
                >
                  {exporting ? 'Preparing export...' : 'Download Excel + receipts (ZIP)'}
                </button>
                <button type="button" className="expenses-admin-logout" onClick={handleAdminLogout}>
                  Log out
                </button>
              </div>
            </div>
          )}

          {error && <p className="expenses-error" role="alert">{error}</p>}
          {!loading && !error && expenses.length === 0 && (
            <p className="expenses-empty">No expenses yet.</p>
          )}

          {!loading && expenses.length > 0 && (
            <div className="expenses-table-wrap">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Paid By</th>
                    <th>Amount</th>
                    <th>Expense Date</th>
                    <th>Status</th>
                    <th>Paid</th>
                    <th>Receipts</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={expense.id}>
                      <td>{index + 1}</td>
                      <td>{expense.description}</td>
                      <td>{expense.made_by}</td>
                      <td className="expenses-table__amount">{formatAmount(expense.amount)}</td>
                      <td className="expenses-table__date">{formatExpenseDate(expense.expense_date)}</td>
                      <td className="expenses-table__status">
                        <span className={statusClassName(expense.status)}>{expense.status}</span>
                      </td>
                      <td className="expenses-table__payment">
                        <span className={paymentStatusClassName(expense)}>
                          {paymentStatusLabel(expense)}
                        </span>
                      </td>
                      <td className="expenses-table__receipts">
                        <div className="expenses-receipts-cell">
                          {(expense.receipts || []).length === 0 && '-'}
                          {(expense.receipts || []).map((receipt) => (
                            <div key={receipt.id} className="expenses-receipt-row">
                              <button
                                type="button"
                                className="expenses-receipt-link"
                                title={receipt.file_name}
                                onClick={() => setViewingReceipt(receipt)}
                              >
                                {receipt.file_name}
                              </button>
                              <button
                                type="button"
                                className="expenses-receipt-download"
                                onClick={() => handleDownloadReceipt(receipt)}
                                disabled={downloadingReceiptId === receipt.id}
                              >
                                {downloadingReceiptId === receipt.id ? '...' : 'Download'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="expenses-table__remarks">
                        <div className="expenses-remarks-cell">
                          {expense.status === 'Approved' && expense.admin_remark && (
                            <span>Approved: {expense.admin_remark}</span>
                          )}
                          {expense.status === 'Declined' && expense.decline_reason && (
                            <span className="expenses-decline-reason">
                              Declined: {expense.decline_reason}
                            </span>
                          )}
                          {!expense.admin_remark && !expense.decline_reason && '-'}
                        </div>
                      </td>
                      <td className="expenses-table__actions">
                        <div className="expenses-actions">
                          {isAdmin && expense.status === 'Pending' && (
                            <>
                              <button type="button" onClick={() => openApprove(expense)}>
                                Approve
                              </button>
                              <button
                                type="button"
                                className="expenses-decline-btn"
                                onClick={() => openDecline(expense)}
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {expense.status === 'Declined' && (
                            <button type="button" onClick={() => openResubmit(expense)}>
                              Edit &amp; Resubmit
                            </button>
                          )}
                          {isAdmin && expense.status === 'Approved' && (
                            <button
                              type="button"
                              className="expenses-paid-btn"
                              onClick={() => handleTogglePaid(expense)}
                              disabled={paidUpdatingId === expense.id}
                            >
                              {paidUpdatingId === expense.id
                                ? '...'
                                : expense.is_paid
                                  ? 'Mark unpaid'
                                  : 'Mark paid'}
                            </button>
                          )}
                          {isAdmin && (
                            <>
                              <button type="button" onClick={() => openAdminEdit(expense)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="expenses-delete-btn"
                                onClick={() => handleDeleteExpense(expense)}
                              >
                                Delete
                              </button>
                            </>
                          )}
                          {!isAdmin &&
                            expense.status !== 'Declined' &&
                            expense.status !== 'Pending' &&
                            '-'}
                          {!isAdmin && expense.status === 'Pending' && '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {submitModalOpen && (
        <div className="expenses-modal-overlay" onClick={closeSubmitModal}>
          <div
            className="expenses-modal expenses-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="submit-expense-title"
          >
            <h2 id="submit-expense-title">Submit expense</h2>
            <p className="expenses-form-note">
              Anyone can submit an expense. Admin approval is required. Default status is Pending.
            </p>
            <form className="expenses-form" onSubmit={handleCreateSubmit}>
              <div className="expenses-field">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="expenses-field-row">
                <div className="expenses-field">
                  <label htmlFor="made_by">Paid By</label>
                  <input
                    id="made_by"
                    type="text"
                    value={form.made_by}
                    onChange={(e) => setForm((prev) => ({ ...prev, made_by: e.target.value }))}
                    required
                  />
                </div>
                <div className="expenses-field">
                  <label htmlFor="amount">Amount (₹)</label>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="expenses-field-row">
                <div className="expenses-field">
                  <label htmlFor="expense_date">Expense Date</label>
                  <input
                    id="expense_date"
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, expense_date: e.target.value }))}
                    required
                  />
                </div>
                <div className="expenses-field">
                  <label htmlFor="submitter_contact">UPI ID or UPI phone number</label>
                  <input
                    id="submitter_contact"
                    type="text"
                    value={form.submitter_contact}
                    onChange={(e) => {
                      setContactError('');
                      setForm((prev) => ({ ...prev, submitter_contact: e.target.value }));
                    }}
                    required
                    maxLength={256}
                    autoComplete="off"
                    placeholder="e.g. name@paytm or 10-digit mobile"
                  />
                  {contactError && <p className="expenses-error">{contactError}</p>}
                </div>
              </div>
              {renderReceiptPicker(
                receiptFiles,
                setReceiptFiles,
                3,
                'receipts',
                'Click Choose File up to 3 times to add one receipt each, or select multiple in one go.',
              )}
              {formError && <p className="expenses-error" role="alert">{formError}</p>}
              <div className="expenses-modal-actions">
                <button type="button" onClick={closeSubmitModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="expenses-submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {actionExpense && (
        <div className="expenses-modal-overlay" onClick={closeActionModal}>
          <div className="expenses-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>{actionType === 'approve' ? 'Approve Expense' : 'Decline Expense'}</h2>
            <p className="expenses-modal-summary">
              {actionExpense.description} — {formatAmount(actionExpense.amount)}
            </p>
            <form onSubmit={handleActionSubmit}>
              {actionType === 'approve' ? (
                <div className="expenses-modal-field">
                  <label htmlFor="adminRemark">Admin remark (optional)</label>
                  <textarea
                    id="adminRemark"
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="expenses-modal-field">
                  <label htmlFor="declineReason">Decline reason (required)</label>
                  <textarea
                    id="declineReason"
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
              )}
              {actionError && <p className="expenses-error" role="alert">{actionError}</p>}
              <div className="expenses-modal-actions">
                <button type="button" onClick={closeActionModal}>Cancel</button>
                <button type="submit" disabled={actionSubmitting}>
                  {actionSubmitting ? 'Saving...' : actionType === 'approve' ? 'Approve' : 'Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editExpenseItem && (
        <div className="expenses-modal-overlay" onClick={closeAdminEdit}>
          <div
            className="expenses-modal expenses-modal--wide"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-edit-expense-title"
          >
            <h2 id="admin-edit-expense-title">Edit expense</h2>
            <p className="expenses-form-note">
              Status stays {editExpenseItem.status}. You can correct details and add receipts (up to 3 total).
            </p>
            <form onSubmit={handleAdminEditSubmit}>
              <div className="expenses-field">
                <label htmlFor="admin-edit-description">Description</label>
                <input
                  id="admin-edit-description"
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="expenses-field-row">
                <div className="expenses-field">
                  <label htmlFor="admin-edit-made-by">Paid By</label>
                  <input
                    id="admin-edit-made-by"
                    type="text"
                    value={editForm.made_by}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, made_by: e.target.value }))}
                    required
                  />
                </div>
                <div className="expenses-field">
                  <label htmlFor="admin-edit-amount">Amount (₹)</label>
                  <input
                    id="admin-edit-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="expenses-field-row">
                <div className="expenses-field">
                  <label htmlFor="admin-edit-date">Expense Date</label>
                  <input
                    id="admin-edit-date"
                    type="date"
                    value={editForm.expense_date}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, expense_date: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="expenses-field">
                  <label htmlFor="admin-edit-contact">UPI ID or UPI phone number</label>
                  <input
                    id="admin-edit-contact"
                    type="text"
                    value={editForm.submitter_contact}
                    onChange={(e) => {
                      setEditContactError('');
                      setEditForm((prev) => ({ ...prev, submitter_contact: e.target.value }));
                    }}
                    required
                    maxLength={256}
                    autoComplete="off"
                  />
                  {editContactError && <p className="expenses-error">{editContactError}</p>}
                </div>
              </div>
              {renderReceiptPicker(
                editFiles,
                setEditFiles,
                Math.max(0, 3 - (editExpenseItem.receipts || []).length),
                'admin-edit-receipts',
                'Add more receipts if needed. Existing receipts on this expense are kept.',
              )}
              {editError && <p className="expenses-error" role="alert">{editError}</p>}
              <div className="expenses-modal-actions">
                <button type="button" onClick={closeAdminEdit} disabled={editSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="expenses-submit" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resubmitExpenseItem && (
        <div className="expenses-modal-overlay" onClick={closeResubmit}>
          <div className="expenses-modal expenses-modal--wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Resubmit Expense</h2>
            {resubmitExpenseItem.decline_reason && (
              <p className="expenses-decline-reason">
                Admin feedback: {resubmitExpenseItem.decline_reason}
              </p>
            )}
            <form onSubmit={handleResubmit}>
              <div className="expenses-modal-field">
                <label htmlFor="resubmit-contact">UPI ID or UPI phone number</label>
                <input
                  id="resubmit-contact"
                  type="text"
                  value={resubmitContact}
                  onChange={(e) => setResubmitContact(e.target.value)}
                  required
                  maxLength={256}
                  autoComplete="off"
                />
              </div>
              <div className="expenses-modal-field">
                <label htmlFor="resubmit-description">Description</label>
                <input
                  id="resubmit-description"
                  type="text"
                  value={resubmitForm.description}
                  onChange={(e) => setResubmitForm((prev) => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <div className="expenses-field-row">
                <div className="expenses-modal-field">
                  <label htmlFor="resubmit-made-by">Paid By</label>
                  <input
                    id="resubmit-made-by"
                    type="text"
                    value={resubmitForm.made_by}
                    onChange={(e) => setResubmitForm((prev) => ({ ...prev, made_by: e.target.value }))}
                    required
                  />
                </div>
                <div className="expenses-modal-field">
                  <label htmlFor="resubmit-amount">Amount (₹)</label>
                  <input
                    id="resubmit-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={resubmitForm.amount}
                    onChange={(e) => setResubmitForm((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="expenses-modal-field">
                <label htmlFor="resubmit-date">Expense Date</label>
                <input
                  id="resubmit-date"
                  type="date"
                  value={resubmitForm.expense_date}
                  onChange={(e) => setResubmitForm((prev) => ({ ...prev, expense_date: e.target.value }))}
                  required
                />
              </div>
              {renderReceiptPicker(
                resubmitFiles,
                setResubmitFiles,
                Math.max(0, 3 - (resubmitExpenseItem.receipts || []).length),
                'resubmit-receipts',
                'Add more receipts if needed. Existing receipts on this expense are kept.',
              )}
              {resubmitError && <p className="expenses-error" role="alert">{resubmitError}</p>}
              <div className="expenses-modal-actions">
                <button type="button" onClick={closeResubmit}>Cancel</button>
                <button type="submit" disabled={resubmitSubmitting}>
                  {resubmitSubmitting ? 'Submitting...' : 'Resubmit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ExpensesOutstandingModal
        open={outstandingOpen}
        onClose={() => setOutstandingOpen(false)}
        adminKey={adminKey}
      />

      <ReceiptPreviewModal
        receipt={viewingReceipt}
        onClose={() => setViewingReceipt(null)}
      />
    </div>
  );
};

export default ExpensesPage;
