import axios from "axios";
import { balanceAt, buildLedger, totalsFor } from "../utils/financeUtils";

/*
  =====================================================================
  API SERVICE LAYER
  =====================================================================
  The Spring Boot backend (Backend_By_Shra1) runs with:
      server.servlet.context-path=/api
  and by default Spring Boot listens on port 8081.
  So every real endpoint is prefixed with: http://localhost:8081/api

  Backend controllers that are FULLY IMPLEMENTED right now:
      - /projects          (ProjectController)
      - /labours           (LabourController)
      - /daily-work        (DailyWorkController)
      - /invoices          (InvoiceController)          -> PostgreSQL
      - /finance           (ExpenseController)          -> PostgreSQL
      - /company-settings  (CompanySettingsController)  -> PostgreSQL
      - /profile           (ProfileController)          -> PostgreSQL

  Backend controllers that exist as EMPTY STUBS (no routes yet):
      - DashboardController
      - InventoryController
      - UserController

  For the stub controllers, this file exposes a small localStorage-backed
  mock service with the exact same function names/shapes as the real ones.
  This means the pages never need to change - once your backend team adds
  real endpoints to those controllers, you only need to swap the mock
  implementation below for a real axios call (examples are left commented
  next to every mock function).
  =====================================================================
*/

// "/api" is a relative path on purpose: vite.config.js proxies it to
// http://localhost:8081 on the server side during `npm run dev`, so the
// browser never makes a cross-origin request and the backend controllers
// don't need any @CrossOrigin changes.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT (if we have one) to every outgoing request. Existing ERP
// endpoints don't require it yet (see backend SecurityConfig), but /auth/me
// does, and any endpoint added in a later stage will too.
const AUTH_STORAGE_KEY = "tirth_auth";

apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (stored?.token) {
      config.headers.Authorization = `Bearer ${stored.token}`;
    }
  } catch {
    // no stored session - send the request unauthenticated
  }
  return config;
});

// ---------------------------------------------------------------------
// Helper for the mock/local-storage backed modules
// ---------------------------------------------------------------------
const readLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

const nextLocalId = (items) =>
  items.length ? Math.max(...items.map((i) => i.id || 0)) + 1 : 1;

// ---------------------------------------------------------------------
// Turns an axios error into an accurate, user-facing message instead of
// always saying "the backend isn't running" - a 401/403 means the
// backend IS running and responded, it just said no. Pages should use
// this instead of a single hardcoded string in their catch block.
// ---------------------------------------------------------------------
export function describeApiError(err, fallbackContext = "load this data") {
  const status = err?.response?.status;
  if (status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (status === 403) {
    return "You don't have permission to access this.";
  }
  if (status) {
    // Backend responded with some other error status - surface its
    // message if it sent one (see GlobalExceptionHandler's ErrorResponse
    // shape), rather than a generic line.
    return err?.response?.data?.message || `Request failed (${status}).`;
  }
  // No response at all reached us - this is the actual "backend down"
  // case (network failure, wrong port, CORS, backend not started).
  return `Could not connect to the backend. Make sure the Spring Boot server is running, then try to ${fallbackContext} again.`;
}

// =====================================================================
// PROJECTS  -> REAL BACKEND (/api/projects)
// =====================================================================
// budget, startDate and managerId are now real backend columns (were
// previously kept in localStorage only - see git history if you need the
// old "extras" shim). "manager" is no longer free-text: managerId must be
// the id of a real PROJECT_MANAGER user, picked from getManagers() below -
// that's what lets the backend notify them when they're assigned.
export const projectsApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/projects");
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/projects/${id}`);
    return data;
  },
  // Every user with the PROJECT_MANAGER role, for the "assign lead" dropdown.
  getManagers: async () => {
    const { data } = await apiClient.get("/projects/managers");
    return data;
  },
  // Every user with the LABOUR_MANAGER role, for the "assign labour manager" dropdown.
  getLabourManagers: async () => {
    const { data } = await apiClient.get("/projects/labour-managers");
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/projects", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/projects/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await apiClient.delete(`/projects/${id}`);
  },
};

// =====================================================================
// LABOUR & HR -> REAL BACKEND (/api/labours)
// =====================================================================
// Backend LabourRequestDto/ResponseDto supports:
//   fullName, phone, address, skill, dailyWage, status
// Original UI also has "Type" (Own/Contractor) and "Current Site" which
// aren't backend columns yet - stored locally the same way as projects.

const LABOUR_EXTRAS_KEY = "labour_extras";
const getLabourExtras = () => readLocal(LABOUR_EXTRAS_KEY, {});
const saveLabourExtra = (id, extra) => {
  const all = getLabourExtras();
  all[id] = { ...(all[id] || {}), ...extra };
  writeLocal(LABOUR_EXTRAS_KEY, all);
};
const removeLabourExtra = (id) => {
  const all = getLabourExtras();
  delete all[id];
  writeLocal(LABOUR_EXTRAS_KEY, all);
};
const mergeLabourExtras = (labour) => {
  const extras = getLabourExtras()[labour.id] || {};
  return { ...extras, ...labour };
};

export const labourApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/labours");
    return data.map(mergeLabourExtras);
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/labours/${id}`);
    return mergeLabourExtras(data);
  },
  create: async (payload) => {
    // payload: { fullName, phone, address, skill, dailyWage, status, type, site }
    const { type, site, ...backendPayload } = payload;
    const { data } = await apiClient.post("/labours", backendPayload);
    saveLabourExtra(data.id, { type, site });
    return mergeLabourExtras(data);
  },
  update: async (id, payload) => {
    const { type, site, ...backendPayload } = payload;
    const { data } = await apiClient.put(`/labours/${id}`, backendPayload);
    saveLabourExtra(id, { type, site });
    return mergeLabourExtras(data);
  },
  remove: async (id) => {
    await apiClient.delete(`/labours/${id}`);
    removeLabourExtra(id);
  },
};

// =====================================================================
// DAILY WORK -> REAL BACKEND (/api/daily-work)
// =====================================================================
// Backend DailyWorkRequestDto: workDate, taskName, description, status,
// projectId, labourId. Response also returns projectName & labourName.

export const dailyWorkApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/daily-work");
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/daily-work/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/daily-work", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/daily-work/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/daily-work/${id}`);
    return data;
  },
};

// =====================================================================
// INVENTORY -> REAL BACKEND (/api/inventory)
// =====================================================================
// Backend InventoryRequestDto/ResponseDto fields:
//   itemName, category, stock, unit, unitRate, location  (+ totalValue on response)
export const inventoryApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/inventory");
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/inventory/${id}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/inventory", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/inventory/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await apiClient.delete(`/inventory/${id}`);
  },
};

// =====================================================================
// INVENTORY TRANSACTIONS -> REAL BACKEND (/api/inventory-transaction)
// =====================================================================
// Backend InventoryTransactionRequestDto/ResponseDto fields:
//   transactionType ("IN" / "OUT"), quantity, transactionDate,
//   referenceNumber, remarks, issuedBy, inventoryId (+ itemName on response)
export const inventoryTransactionApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/inventory-transaction");
    return data;
  },
  getByInventoryId: async (inventoryId) => {
    const { data } = await apiClient.get(`/inventory-transaction/inventory/${inventoryId}`);
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post("/inventory-transaction", payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/inventory-transaction/${id}`, payload);
    return data;
  },
  remove: async (id) => {
    await apiClient.delete(`/inventory-transaction/${id}`);
  },
};

// =====================================================================
// INVOICES -> REAL BACKEND (/api/invoices, PostgreSQL)
// =====================================================================
// The server assigns the invoice number (INV-0001...) and calculates the
// grand total from items + discount + GST, so neither is sent from here.
const invoiceBody = (p) => ({
  client: p.client,
  title: p.title,
  clientAddress: p.clientAddress,
  clientPhone: p.clientPhone,
  clientEmail: p.clientEmail,
  clientGstin: p.clientGstin,
  issueDate: p.issueDate,
  dueDate: p.dueDate,
  status: p.status,
  paidDate: p.status === "Paid" ? p.paidDate : undefined,
  gstRate: Number(p.gstRate) || 0,
  discount: Number(p.discount) || 0,
  notes: p.notes,
  items: (p.items || []).map((it) => ({ description: it.description, qty: Number(it.qty), rate: Number(it.rate) })),
});

export const invoiceApi = {
  getAll: async () => (await apiClient.get("/invoices")).data,
  getById: async (id) => (await apiClient.get(`/invoices/${id}`)).data,
  nextCode: async () => (await apiClient.get("/invoices/next-code")).data.code,
  create: async (payload) => (await apiClient.post("/invoices", invoiceBody(payload))).data,
  // { status } alone -> the light PATCH endpoint; anything else -> full PUT.
  update: async (id, payload) => {
    const keys = Object.keys(payload);
    if (keys.length === 1 && keys[0] === "status") {
      return (await apiClient.patch(`/invoices/${id}/status`, { status: payload.status })).data;
    }
    return (await apiClient.put(`/invoices/${id}`, invoiceBody(payload))).data;
  },
  remove: async (id) => {
    await apiClient.delete(`/invoices/${id}`);
  },
};

// =====================================================================
// COMPANY SETTINGS + PROFILE -> REAL BACKEND
// =====================================================================
export const companyApi = {
  get: async () => (await apiClient.get("/company-settings")).data,
  save: async (body) => (await apiClient.put("/company-settings", body)).data,
};

export const profileApi = {
  get: async () => (await apiClient.get("/profile")).data,
  update: async (body) => (await apiClient.put("/profile", body)).data,
  changePassword: async (currentPassword, newPassword) => {
    await apiClient.post("/profile/password", { currentPassword, newPassword });
  },
};

// =====================================================================
// ACCOUNTS / FINANCE -> REAL BACKEND (/api/finance, PostgreSQL)
// =====================================================================
// The ledger and monthly budgets live in PostgreSQL. Every figure on the
// Accounts page (KPIs, charts, insights) is still calculated in the browser
// from this ledger - see utils/financeUtils.js. The opening cash balance is
// stored with the company settings.
const txnBody = (p) => ({
  date: p.date,
  description: p.description,
  type: "Expense", // the server only accepts money out; money in comes from invoices
  category: p.category,
  party: p.party,
  method: p.method,
  reference: p.reference,
  amount: Number(p.amount),
  status: p.status,
  notes: p.notes,
});

export const accountsApi = {
  // Money OUT only. Money in is derived from invoices (utils/financeUtils.js buildLedger).
  getTransactions: async () => (await apiClient.get("/finance/transactions")).data,
  addTransaction: async (payload) => (await apiClient.post("/finance/transactions", txnBody(payload))).data,
  updateTransaction: async (id, payload) => {
    const keys = Object.keys(payload);
    if (keys.length === 1 && keys[0] === "status") {
      return (await apiClient.patch(`/finance/transactions/${id}/status`, { status: payload.status })).data;
    }
    return (await apiClient.put(`/finance/transactions/${id}`, txnBody(payload))).data;
  },
  deleteTransaction: async (id) => {
    await apiClient.delete(`/finance/transactions/${id}`);
  },
  getBudgets: async () => (await apiClient.get("/finance/budgets")).data,
  saveBudgets: async (budgets) => (await apiClient.put("/finance/budgets", budgets)).data,
  getOpeningBalance: async () => {
    try {
      return Number((await companyApi.get()).openingBalance) || 0;
    } catch {
      return 0;
    }
  },
  // Headline numbers for the Dashboard.
  getSummary: async () => {
    const [expenses, invoices, opening] = await Promise.all([
      accountsApi.getTransactions(),
      invoiceApi.getAll(),
      accountsApi.getOpeningBalance(),
    ]);
    const transactions = buildLedger(expenses, invoices); // money in = invoices
    const t = totalsFor(transactions);
    return {
      totalRevenue: t.income,
      totalExpenses: t.expense,
      netProfit: t.net,
      cashFlow: balanceAt(transactions, opening),
      transactions,
    };
  },
};

// =====================================================================
// USERS / REPORTS -> MOCK (backend UserController is an empty stub)
// =====================================================================
const USERS_KEY = "system_users";
const DEFAULT_USERS = [
  { id: 1, name: "Admin User", email: "admin@gpm-dms.com", role: "Admin", status: "Active", lastLogin: "2026-03-26" },
  { id: 2, name: "Rekha Sharma", email: "rekha@gpm-dms.com", role: "Accountant", status: "Active", lastLogin: "2026-03-26" },
  { id: 3, name: "Rajesh Kumar", email: "rajesh@gpm-dms.com", role: "Site Engineer", status: "Active", lastLogin: null },
  { id: 4, name: "Prakash Nair", email: "prakash@gpm-dms.com", role: "Supervisor", status: "Active", lastLogin: null },
  { id: 5, name: "MIAL Client", email: "mial@client.com", role: "Client", status: "Active", lastLogin: null },
];

export const usersApi = {
  getAll: async () => readLocal(USERS_KEY, DEFAULT_USERS),
  create: async (payload) => {
    const items = readLocal(USERS_KEY, DEFAULT_USERS);
    const newItem = { ...payload, id: nextLocalId(items) };
    items.push(newItem);
    writeLocal(USERS_KEY, items);
    return newItem;
  },
};

// =====================================================================
// AUTH / LOGIN -> REAL BACKEND (/api/auth) - moved in from the
// landing/auth project (see AuthContext.jsx, which wraps these).
// =====================================================================
// The backend returns { token, userId, fullName, email, role }. We persist
// that as-is under AUTH_STORAGE_KEY (shared with the interceptor above),
// plus a `name` alias so Sidebar.jsx/Layout.jsx (which read `user.name`)
// keep working unchanged.
const mapUserResponse = (data) => ({ ...data, name: data.fullName });

/** Keeps the cached login (tirth_auth) in step with edits made on the Settings page. */
export function updateStoredUser(patch) {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...JSON.parse(raw), ...patch }));
  } catch {
    /* ignore - the next login refreshes it */
  }
}

export const authApi = {
  signup: async ({ fullName, email, phone, password }) => {
    const { data } = await apiClient.post("/auth/signup", { fullName, email, phone, password });
    const user = mapUserResponse(data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  login: async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    const user = mapUserResponse(data);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  /** Validates the stored token against the backend and refreshes the cached profile. */
  me: async () => {
    const { data } = await apiClient.get("/auth/me");
    const stored = readLocal(AUTH_STORAGE_KEY, {});
    const user = { ...stored, ...mapUserResponse(data) };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    return user;
  },
  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },
  getCurrentUser: () => readLocal(AUTH_STORAGE_KEY, null),
};

export default apiClient;

// =====================================================================
// ADMIN USER MANAGEMENT -> REAL BACKEND (/api/users)
// =====================================================================
// Not to be confused with `usersApi` above, which is the older
// localStorage mock still used by Reports.jsx's own "Users" section.
// This one hits the real UserController (ADMIN-only, enforced server-side
// in SecurityConfig - a non-admin token gets a real 403 from these calls,
// this file doesn't do any permission-checking of its own).
export const userManagementApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/users");
    return data;
  },
  updateRole: async (id, role) => {
    const { data } = await apiClient.patch(`/users/${id}/role`, { role });
    return data;
  },
};

// =====================================================================
// ROLE UPGRADE REQUESTS -> REAL BACKEND (/api/role-requests)
// =====================================================================
// Authorization (who can submit / review what) is enforced server-side
// (SecurityConfig + RoleUpgradeRequestServiceImpl) - this file doesn't
// do any permission-checking of its own, same as userManagementApi above.
export const roleRequestsApi = {
  // `payload` is the full create-request shape: { requestedRole, reason,
  // applicantFullName, contactEmail, contactPhone, idProofImageBase64,
  // idProofImageContentType }
  submit: async (payload) => {
    const { data } = await apiClient.post("/role-requests", payload);
    return data;
  },
  getMine: async () => {
    const { data } = await apiClient.get("/role-requests/mine");
    return data;
  },
  getPending: async () => {
    const { data } = await apiClient.get("/role-requests/pending");
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/role-requests/${id}`);
    return data;
  },
  approve: async (id, comment) => {
    const { data } = await apiClient.patch(`/role-requests/${id}/approve`, { comment });
    return data;
  },
  reject: async (id, comment) => {
    const { data } = await apiClient.patch(`/role-requests/${id}/reject`, { comment });
    return data;
  },
};

// =====================================================================
// NOTIFICATIONS -> REAL BACKEND (/api/notifications)
// =====================================================================
// Real-time delivery is handled separately by NotificationContext.jsx
// (WebSocket/STOMP) - this module is just the plain REST side (initial
// load, mark as read).
export const notificationsApi = {
  getAll: async () => {
    const { data } = await apiClient.get("/notifications");
    return data;
  },
  getUnread: async () => {
    const { data } = await apiClient.get("/notifications/unread");
    return data;
  },
  getUnreadCount: async () => {
    const { data } = await apiClient.get("/notifications/unread-count");
    return data.count;
  },
  markAsRead: async (id) => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return data;
  },
  markAllAsRead: async () => {
    await apiClient.patch("/notifications/read-all");
  },
};
