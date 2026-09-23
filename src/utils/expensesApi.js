import { API_BASE_URL } from '../config/api';
import { ADMIN_KEY_STORAGE, validatePhoneNumber } from './registrationsApi';

const RECEIPT_BACKEND_UNREACHABLE =
  'Cannot download receipt. Start the backend with `python main.py` in ' +
  'backend/v1.0.4/cpl-backend/api, then restart the frontend dev server.';

const EXPENSES_URL = `${API_BASE_URL}/v1/ganpati/2026/expenses`;

function buildHeaders(adminKey = '') {
  const headers = {};
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }
  return headers;
}

async function parseResponse(response) {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = result.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || item).join(', ')
      : typeof detail === 'string'
        ? detail
        : 'Request failed. Please try again.';
    throw new Error(message);
  }
  return result;
}

async function request(url, options = {}) {
  try {
    const response = await fetch(url, options);
    return parseResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Cannot reach the API. Start the backend with `python main.py` in ' +
          'backend/v1.0.4/cpl-backend/api, then restart the frontend dev server.',
      );
    }
    throw new Error(error?.message || 'Request failed. Please try again.');
  }
}

export function buildExpenseFormData(fields, receiptFiles = []) {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  receiptFiles.forEach((file) => {
    formData.append('receipts', file);
  });
  return formData;
}

export async function downloadExpensesExport({
  adminKey,
  status = 'All',
  paid = 'All',
  sortBy = 'expense_date',
  sortOrder = 'desc',
}) {
  const params = new URLSearchParams({
    status,
    paid,
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  const url = `${EXPENSES_URL}/export?${params.toString()}`;

  let response;
  try {
    response = await fetch(url, { headers: buildHeaders(adminKey) });
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        'Cannot reach the API. Start the backend with `python main.py` in ' +
          'backend/v1.0.4/cpl-backend/api, then restart the frontend dev server.',
      );
    }
    throw new Error(error?.message || 'Export failed. Please try again.');
  }

  if (!response.ok) {
    await parseResponse(response);
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, 'ganpati-2026-expenses.zip');
}

export async function fetchExpenses({
  adminKey = '',
  status = 'All',
  paid = 'All',
  sortBy = 'expense_date',
  sortOrder = 'desc',
} = {}) {
  const params = new URLSearchParams({
    status,
    paid,
    sort_by: sortBy,
    sort_order: sortOrder,
  });
  return request(`${EXPENSES_URL}?${params.toString()}`, {
    headers: buildHeaders(adminKey),
  });
}

export async function createExpense(formData) {
  return request(EXPENSES_URL, {
    method: 'POST',
    body: formData,
  });
}

export async function resubmitExpense(expenseId, formData) {
  return request(`${EXPENSES_URL}/${expenseId}/resubmit`, {
    method: 'PATCH',
    body: formData,
  });
}

export async function adminUpdateExpense(expenseId, formData, adminKey) {
  return request(`${EXPENSES_URL}/${expenseId}/admin`, {
    method: 'PATCH',
    headers: buildHeaders(adminKey),
    body: formData,
  });
}

export async function approveExpense(expenseId, adminRemark, adminKey) {
  return request(`${EXPENSES_URL}/${expenseId}/approve`, {
    method: 'PATCH',
    headers: {
      ...buildHeaders(adminKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ admin_remark: adminRemark || null }),
  });
}

export async function declineExpense(expenseId, declineReason, adminKey) {
  return request(`${EXPENSES_URL}/${expenseId}/decline`, {
    method: 'PATCH',
    headers: {
      ...buildHeaders(adminKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ decline_reason: declineReason }),
  });
}

export async function setExpensePaid(expenseId, isPaid, adminKey) {
  return request(`${EXPENSES_URL}/${expenseId}/paid`, {
    method: 'PATCH',
    headers: {
      ...buildHeaders(adminKey),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_paid: isPaid }),
  });
}

export async function deleteExpense(expenseId, adminKey) {
  return request(`${EXPENSES_URL}/${expenseId}`, {
    method: 'DELETE',
    headers: buildHeaders(adminKey),
  });
}

export async function deleteExpenseReceipts(expenseId, receiptIds, adminKey) {
  try {
    return await request(`${EXPENSES_URL}/${expenseId}/receipts/delete`, {
      method: 'POST',
      headers: {
        ...buildHeaders(adminKey),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt_ids: receiptIds }),
    });
  } catch (error) {
    if (error?.message === 'Not Found') {
      throw new Error(
        'Receipt delete is not available on the API yet. Stop and restart `python main.py` in ' +
          'backend/v1.0.4/cpl-backend/api (or redeploy Render), then try again.',
      );
    }
    throw error;
  }
}

const UPI_PHONE_PATTERN = /^\d{10}$/;
const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;

export function validateSubmitterUpi(value) {
  const cleaned = (value || '').trim();
  if (UPI_PHONE_PATTERN.test(cleaned) || UPI_ID_PATTERN.test(cleaned)) {
    return '';
  }
  return 'Enter a valid UPI ID (e.g. name@paytm) or 10-digit UPI phone number.';
}

export { ADMIN_KEY_STORAGE, validatePhoneNumber };

export function formatExpenseDate(value) {
  if (!value) return '-';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatAmount(value) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return '-';
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  });
}

export function statusClassName(status) {
  if (status === 'Approved') return 'expenses-status expenses-status--approved';
  if (status === 'Declined') return 'expenses-status expenses-status--declined';
  return 'expenses-status expenses-status--pending';
}

export function paymentStatusLabel(expense) {
  if (expense?.status !== 'Approved') return '—';
  return expense.is_paid ? 'Paid' : 'Unpaid';
}

export function paymentStatusClassName(expense) {
  if (expense?.status !== 'Approved') {
    return 'expenses-payment expenses-payment--na';
  }
  return expense.is_paid
    ? 'expenses-payment expenses-payment--paid'
    : 'expenses-payment expenses-payment--unpaid';
}

/** Use same-origin /uploads in dev (Vite proxy) for local receipt files. */
export function resolveReceiptFileUrl(fileUrl) {
  if (!fileUrl) return '';

  const trimmed = fileUrl.trim();
  if (trimmed.startsWith('/uploads/')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.pathname.startsWith('/uploads/')) {
      if (import.meta.env.DEV) {
        return parsed.pathname;
      }
    }
    return trimmed;
  } catch {
    return trimmed;
  }
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadReceipt(receipt) {
  if (!receipt?.file_url) {
    throw new Error('Receipt file is not available.');
  }

  const fileName = receipt.file_name || 'receipt';
  const fetchUrl = resolveReceiptFileUrl(receipt.file_url);

  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      throw new Error('Failed to download receipt.');
    }
    const blob = await response.blob();
    triggerBlobDownload(blob, fileName);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(RECEIPT_BACKEND_UNREACHABLE);
    }
    throw new Error(error?.message || 'Failed to download receipt.');
  }
}
