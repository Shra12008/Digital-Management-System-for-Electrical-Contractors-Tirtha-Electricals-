/**
 * Which roles can see/enter which ERP pages (Sidebar filters nav items
 * against this; Layout redirects direct URL entry against this).
 *
 * This mirrors the role rules actually enforced server-side in
 * SecurityConfig.java for the 5 real backend modules (Projects, Labour,
 * DailyWork, Inventory, InventoryTransaction) - if you change one side,
 * change the other. Invoice/Accounts/Reports have no real backend
 * controller yet (still empty stubs), so their gating here is UI-only for
 * now; there's nothing server-side to enforce until those exist.
 *
 * NOTE: this is role-level only, same caveat as the backend - a
 * LABOUR_MANAGER sees the Projects page for every project, not just ones
 * assigned to them (that needs a ProjectAssignment concept that doesn't
 * exist yet).
 */
export const ROUTE_ROLES = {
  "/dashboard": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR",
    "ACCOUNTANT",
    "CLIENT"
  ],

  "/projects": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR",
    "CLIENT"
  ],

  "/invoice": [
    "ADMIN",
    "ACCOUNTANT",
    "CLIENT"
  ],

  "/accounts": [
    "ADMIN",
    "ACCOUNTANT"
  ],

  "/inventory": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER"
  ],

  "/labour": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER"
  ],

  "/daily-work": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR"
  ],

  "/reports": [
    "ADMIN",
    "PROJECT_MANAGER",
    "ACCOUNTANT"
  ],

  "/admin/users": [
    "ADMIN"
  ],

  "/unauthorized": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR",
    "ACCOUNTANT",
    "CLIENT"
  ],

  "/role-requests": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR",
    "ACCOUNTANT",
    "CLIENT"
  ],

  "/notifications": [
    "ADMIN",
    "PROJECT_MANAGER",
    "LABOUR_MANAGER",
    "LABOUR",
    "ACCOUNTANT",
    "CLIENT"
  ],
};

export function canAccessRoute(role, pathname) {
  const allowed = ROUTE_ROLES[pathname];

  if (!allowed) return true;

  return allowed.includes(role);
}
/** Friendly names + one-line descriptions for the profile menu and Settings. */
export const ROLE_LABELS = {
  ADMIN: { label: "Administrator", desc: "Full access to every module, users and settings." },
  PROJECT_MANAGER: { label: "Project Manager", desc: "Plans projects, inventory, labour and daily work." },
  LABOUR_MANAGER: { label: "Labour Manager", desc: "Manages site workers, assignments and attendance." },
  LABOUR: { label: "Site Labour", desc: "Views assigned projects and logs daily work." },
  ACCOUNTANT: { label: "Accountant", desc: "Handles invoices, accounts and finance reports." },
  CLIENT: { label: "Client", desc: "Tracks your projects and invoices." },
};
export const roleLabel = (role) => ROLE_LABELS[role]?.label || role || "Member";
