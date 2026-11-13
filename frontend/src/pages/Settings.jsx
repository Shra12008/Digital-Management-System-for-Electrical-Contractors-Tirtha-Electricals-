import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import InvoiceViewer from "../components/InvoiceViewer";
import { ROLE_LABELS, roleLabel } from "../config/roles";
import { DEFAULT_COMPANY, getCompany } from "../config/company";
import { useAuth } from "../context/AuthContext";
import { authApi, companyApi, describeApiError, profileApi } from "../services/api";
import { GST_OPTIONS, addDays, toISODate } from "../utils/invoiceUtils";
import { fileToAvatar, profileStoreFor, settingsStore } from "../utils/preferences";
import { cacheCompany, cacheProfile, syncCompany, syncProfile } from "../utils/serverSync";
import pkg from "../../package.json";

const TABS = [
  { key: "profile", icon: "fa-user", label: "My profile", hint: "Name, photo and contact" },
  { key: "appearance", icon: "fa-palette", label: "Appearance", hint: "Theme and layout density" },
  { key: "billing", icon: "fa-file-invoice", label: "Billing & company", hint: "Invoice details", roles: ["ADMIN", "ACCOUNTANT"] },
  { key: "account", icon: "fa-shield-halved", label: "Account & data", hint: "Session and local data" },
];

function Card({ title, desc, children, footer }) {
  return (
    <section className="settings-card">
      <header>
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </header>
      <div className="settings-card-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </section>
  );
}

function Field({ label, children, hint, full }) {
  return (
    <div className={`form-group ${full ? "full-width" : ""}`}>
      <label>{label}</label>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="toggle-row">
      <span>
        <strong>{label}</strong>
        {desc && <small>{desc}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i className="toggle-track" aria-hidden="true"><b /></i>
    </label>
  );
}

function useFlash() {
  const [msg, setMsg] = useState("");
  const timer = useRef();
  const flash = (m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  return [msg, flash];
}

/* ------------------------------ Profile ------------------------------ */
function ProfileTab({ user }) {
  const store = profileStoreFor(user);
  const saved = store.use();
  const [form, setForm] = useState({ displayName: saved.displayName || user?.name || "", phone: saved.phone || user?.phone || "", designation: saved.designation, location: saved.location });
  const [avatar, setAvatar] = useState(saved.avatar);
  const [error, setError] = useState("");
  const [msg, flash] = useFlash();
  const fileRef = useRef();

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatar(file));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const [saving, setSaving] = useState(false);

  // Make sure the form shows what the server has (photo set on another device, etc.).
  useEffect(() => {
    let live = true;
    syncProfile(user)
      .then((p) => {
        if (!live) return;
        setForm({ displayName: p.fullName || "", phone: p.phone || "", designation: p.designation || "", location: p.location || "" });
        setAvatar(p.avatar || "");
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) return setError("Display name cannot be empty.");
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone.trim())) return setError("Please enter a valid phone number.");
    setError("");
    setSaving(true);
    try {
      const p = await profileApi.update({
        fullName: form.displayName.trim(),
        phone: form.phone.trim(),
        designation: form.designation.trim(),
        location: form.location.trim(),
        avatar,
      });
      cacheProfile(user, p);
      flash("Profile saved");
    } catch (err) {
      setError(describeApiError(err, "save your profile"));
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    avatar !== saved.avatar ||
    form.displayName !== (saved.displayName || user?.name || "") ||
    form.phone !== (saved.phone || user?.phone || "") ||
    form.designation !== saved.designation ||
    form.location !== saved.location;

  return (
    <>
      <Card
        title="Profile"
        desc="This is how you appear across the app. Changes are saved to your account."
        footer={
          <>
            {error && <span className="settings-error" role="alert">{error}</span>}
            {msg && <span className="settings-ok"><i className="fas fa-circle-check"></i> {msg}</span>}
            <button type="submit" form="profile-form" className="primary-btn" disabled={!dirty || saving}>{saving ? "Saving..." : "Save changes"}</button>
          </>
        }
      >
        <form id="profile-form" onSubmit={save} noValidate>
          <div className="avatar-editor">
            <Avatar name={form.displayName} src={avatar} size={88} />
            <div>
              <div className="avatar-actions">
                <button type="button" className="secondary-btn small" onClick={() => fileRef.current.click()}>
                  <i className="fas fa-camera"></i> {avatar ? "Change photo" : "Upload photo"}
                </button>
                {avatar && <button type="button" className="secondary-btn small" onClick={() => setAvatar("")}>Remove</button>}
              </div>
              <small className="field-hint">JPG or PNG. It is cropped to a square automatically.</small>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
            </div>
          </div>
          <div className="form-grid">
            <Field label="Display name"><input name="displayName" value={form.displayName} onChange={set} maxLength={60} /></Field>
            <Field label="Phone"><input name="phone" value={form.phone} onChange={set} placeholder="+91 98765 43210" /></Field>
            <Field label="Designation"><input name="designation" value={form.designation} onChange={set} placeholder="e.g., Senior site engineer" maxLength={60} /></Field>
            <Field label="Location"><input name="location" value={form.location} onChange={set} placeholder="e.g., Jalgaon, Maharashtra" maxLength={60} /></Field>
          </div>
        </form>
      </Card>

      <Card title="Account details" desc="These come from your sign-in account and can only be changed by an administrator.">
        <dl className="detail-list">
          <div><dt>Email</dt><dd>{user?.email || "-"}</dd></div>
          <div><dt>Role</dt><dd><span className="role-badge">{roleLabel(user?.role)}</span> <small>{ROLE_LABELS[user?.role]?.desc}</small></dd></div>
          <div><dt>User ID</dt><dd>{user?.userId ?? "-"}</dd></div>
          <div><dt>Account status</dt><dd><span className="status-pill paid">Active</span></dd></div>
        </dl>
      </Card>
    </>
  );
}

/* ----------------------------- Appearance ----------------------------- */
const THEMES = [
  { key: "dark", label: "Dark", desc: "Easy on the eyes in low light" },
  { key: "light", label: "Light", desc: "Bright and clean for the office" },
  { key: "system", label: "System", desc: "Match your device setting" },
];

function AppearanceTab() {
  const s = settingsStore.use();
  return (
    <>
      <Card title="Theme" desc="Choose how the dashboard looks. It applies instantly.">
        <div className="theme-grid" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.key} type="button" role="radio" aria-checked={s.theme === t.key} className={`theme-card ${s.theme === t.key ? "active" : ""}`} onClick={() => settingsStore.set({ theme: t.key })}>
              <span className={`theme-preview ${t.key}`}>
                <i /><i /><i />
              </span>
              <strong>{t.label}</strong>
              <small>{t.desc}</small>
            </button>
          ))}
        </div>
      </Card>
      <Card title="Layout" desc="Fine-tune spacing and motion.">
        <div className="seg-row">
          <div>
            <strong>Density</strong>
            <small>Compact fits more rows on screen in tables and ledgers.</small>
          </div>
          <div className="mini-seg large">
            {["comfortable", "compact"].map((d) => (
              <button key={d} className={s.density === d ? "active" : ""} onClick={() => settingsStore.set({ density: d })}>
                {d === "comfortable" ? "Comfortable" : "Compact"}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Reduce motion" desc="Turn off animations and transitions." checked={s.reduceMotion} onChange={(v) => settingsStore.set({ reduceMotion: v })} />
      </Card>
    </>
  );
}

/* ----------------------------- Billing ----------------------------- */
const toForm = (c) => ({
  name: c.name, tagline: c.tagline, addressLine: c.addressLine, phone: c.phone, email: c.email, gstin: c.gstin,
  accountName: c.bank.accountName, bankName: c.bank.bankName, accountNumber: c.bank.accountNumber, ifsc: c.bank.ifsc, upi: c.bank.upi,
  terms: c.terms.join("\n"),
});

function BillingTab({ user }) {
  const s = settingsStore.get();
  const [form, setForm] = useState(() => toForm(getCompany()));
  const [defaults, setDefaults] = useState({ defaultGst: s.defaultGst, dueDays: s.dueDays });
  const [opening, setOpening] = useState("0");
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, flash] = useFlash();
  const [error, setError] = useState("");

  // Load the saved values from the server (the local copy only shows until this returns).
  useEffect(() => {
    let live = true;
    syncCompany(user)
      .then((dto) => {
        if (!live || !dto) return;
        setForm(toForm(getCompany()));
        setDefaults({ defaultGst: dto.defaultGst, dueDays: dto.dueDays });
        setOpening(String(dto.openingBalance ?? 0));
      })
      .catch((err) => live && setError(describeApiError(err, "load the billing settings")));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const persist = async (f, d, ob) => {
    setSaving(true);
    try {
      const dto = await companyApi.save({
        name: f.name.trim(), tagline: f.tagline, addressLine: f.addressLine, phone: f.phone, email: f.email, gstin: f.gstin,
        bank: { accountName: f.accountName, bankName: f.bankName, accountNumber: f.accountNumber, ifsc: f.ifsc, upi: f.upi },
        terms: f.terms.split("\n").map((t) => t.trim()).filter(Boolean),
        defaultGst: Number(d.defaultGst),
        dueDays: Number(d.dueDays),
        openingBalance: Number(ob) || 0,
      });
      cacheCompany(dto);
      return true;
    } catch (err) {
      setError(describeApiError(err, "save the billing settings"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Company name is required.");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) return setError("Please enter a valid company email.");
    const days = Number(defaults.dueDays);
    if (!(days >= 0 && days <= 365)) return setError("Payment due days must be between 0 and 365.");
    if (!(Number(opening) >= 0)) return setError("Opening cash balance cannot be negative.");
    setError("");
    if (await persist(form, defaults, opening)) flash("Billing settings saved");
  };

  const reset = async () => {
    if (!window.confirm("Reset company details and invoice defaults to the originals?")) return;
    const f = toForm(DEFAULT_COMPANY);
    const d = { defaultGst: 18, dueDays: 14 };
    setError("");
    if (await persist(f, d, opening)) {
      setForm(f);
      setDefaults(d);
      flash("Reset to defaults");
    }
  };

  const sample = () => {
    const today = toISODate(new Date());
    setPreview({
      id: 0, code: "INV-0001", title: "Sample electrical installation work", client: "Sample Client Pvt. Ltd.",
      clientAddress: "12, Business Park, Jalgaon, Maharashtra", clientPhone: "+91 90000 00000", clientEmail: "accounts@sample.example",
      issueDate: today, dueDate: addDays(today, Number(defaults.dueDays) || 14), status: "Unpaid", gstRate: Number(defaults.defaultGst), discount: 0,
      items: [
        { description: "Wiring and conduit work, ground floor", qty: 1, rate: 24000 },
        { description: "LED panel lights, supply and fitting", qty: 12, rate: 950 },
      ],
      notes: "This is a sample invoice generated from your current billing settings.",
    });
  };

  return (
    <form onSubmit={save} noValidate>
      <Card title="Company details" desc="Printed in the header and footer of every invoice. Saved to the server for everyone.">
        <div className="form-grid">
          <Field label="Company name"><input name="name" value={form.name} onChange={set} /></Field>
          <Field label="Tagline"><input name="tagline" value={form.tagline} onChange={set} /></Field>
          <Field label="Address" full><input name="addressLine" value={form.addressLine} onChange={set} /></Field>
          <Field label="Phone"><input name="phone" value={form.phone} onChange={set} /></Field>
          <Field label="Billing email"><input name="email" value={form.email} onChange={set} /></Field>
          <Field label="GSTIN"><input name="gstin" value={form.gstin} onChange={set} /></Field>
        </div>
      </Card>
      <Card title="Bank & payment details" desc="Shown on invoices so clients know where to pay.">
        <div className="form-grid">
          <Field label="Account name"><input name="accountName" value={form.accountName} onChange={set} /></Field>
          <Field label="Bank"><input name="bankName" value={form.bankName} onChange={set} /></Field>
          <Field label="Account number"><input name="accountNumber" value={form.accountNumber} onChange={set} /></Field>
          <Field label="IFSC"><input name="ifsc" value={form.ifsc} onChange={set} /></Field>
          <Field label="UPI ID"><input name="upi" value={form.upi} onChange={set} /></Field>
        </div>
      </Card>
      <Card title="Invoice defaults" desc="Pre-filled whenever you create a new invoice.">
        <div className="form-grid">
          <Field label="Default GST rate">
            <select value={defaults.defaultGst} onChange={(e) => setDefaults((d) => ({ ...d, defaultGst: e.target.value }))}>
              {GST_OPTIONS.map((g) => <option key={g} value={g}>{g === 0 ? "No GST" : `${g}%`}</option>)}
            </select>
          </Field>
          <Field label="Payment due after (days)">
            <input type="number" min="0" max="365" value={defaults.dueDays} onChange={(e) => setDefaults((d) => ({ ...d, dueDays: e.target.value }))} />
          </Field>
          <Field label="Terms & conditions" full hint="One term per line.">
            <textarea name="terms" rows={4} value={form.terms} onChange={set} />
          </Field>
        </div>
      </Card>
      <Card title="Finance" desc="Used by the Accounts & Finance charts and cash balance.">
        <div className="form-grid">
          <Field label="Opening cash balance (₹)" hint="Cash and bank balance before your first ledger entry.">
            <input type="number" min="0" step="any" value={opening} onChange={(e) => setOpening(e.target.value)} />
          </Field>
        </div>
      </Card>
      <div className="settings-actions">
        {error && <span className="settings-error" role="alert">{error}</span>}
        {msg && <span className="settings-ok"><i className="fas fa-circle-check"></i> {msg}</span>}
        <button type="button" className="link-btn" onClick={reset} disabled={saving}>Reset to defaults</button>
        <button type="button" className="secondary-btn" onClick={sample}><i className="fas fa-eye"></i> Preview sample invoice</button>
        <button type="submit" className="primary-btn" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
      </div>
      {preview && <InvoiceViewer invoice={preview} onClose={() => setPreview(null)} />}
    </form>
  );
}

/* ----------------------------- Account ----------------------------- */
function PasswordCard() {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, flash] = useFlash();
  const set = (e) => setF((x) => ({ ...x, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.current) return setError("Enter your current password.");
    if (f.next.length < 8) return setError("New password must be at least 8 characters.");
    if (f.next !== f.confirm) return setError("The new passwords do not match.");
    setError("");
    setSaving(true);
    try {
      await profileApi.changePassword(f.current, f.next);
      setF({ current: "", next: "", confirm: "" });
      flash("Password changed");
    } catch (err) {
      setError(describeApiError(err, "change your password"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Change password"
      desc="Use at least 8 characters. You stay signed in on this device."
      footer={
        <>
          {error && <span className="settings-error" role="alert">{error}</span>}
          {msg && <span className="settings-ok"><i className="fas fa-circle-check"></i> {msg}</span>}
          <button type="submit" form="password-form" className="primary-btn" disabled={saving}>{saving ? "Updating..." : "Update password"}</button>
        </>
      }
    >
      <form id="password-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="Current password" full><input type="password" name="current" autoComplete="current-password" value={f.current} onChange={set} /></Field>
          <Field label="New password"><input type="password" name="next" autoComplete="new-password" value={f.next} onChange={set} /></Field>
          <Field label="Confirm new password"><input type="password" name="confirm" autoComplete="new-password" value={f.confirm} onChange={set} /></Field>
        </div>
      </form>
    </Card>
  );
}

function AccountTab({ user }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const clearData = () => {
    if (!window.confirm("Clear locally cached data? Your sign-in and settings are kept, and nothing on the server is deleted.")) return;
    Object.keys(localStorage)
      .filter((k) => !k.startsWith("tirth_") && k !== "sidebarCollapsed")
      .forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  return (
    <>
      <Card title="Session" desc="You are signed in on this device.">
        <dl className="detail-list">
          <div><dt>Signed in as</dt><dd>{user?.email || user?.name || "-"}</dd></div>
          <div><dt>Role</dt><dd><span className="role-badge">{roleLabel(user?.role)}</span></dd></div>
          <div><dt>Session</dt><dd><span className="status-pill paid">Active</span></dd></div>
        </dl>
        <button className="secondary-btn danger-outline" onClick={signOut}><i className="fas fa-right-from-bracket"></i> Log out of this device</button>
      </Card>
      <PasswordCard />
      <Card title="Local cache" desc="Invoices, finance, profile and billing settings live on the server. This only clears data cached in this browser (and demo data for modules that are not on the server yet).">
        <button className="secondary-btn danger-outline" onClick={clearData}><i className="fas fa-trash-can"></i> Clear local cache</button>
      </Card>
      <Card title="About">
        <dl className="detail-list">
          <div><dt>Application</dt><dd>Tirth Electrical & Services ERP</dd></div>
          <div><dt>Version</dt><dd>{pkg.version}</dd></div>
        </dl>
      </Card>
    </>
  );
}

/* ------------------------------- Page ------------------------------- */
export default function Settings() {
  const user = authApi.getCurrentUser();
  const [params, setParams] = useSearchParams();
  const tabs = TABS.filter((t) => !t.roles || t.roles.includes(user?.role));
  const active = tabs.find((t) => t.key === params.get("tab")) || tabs[0];

  return (
    <div className="settings-page">
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {tabs.map((t) => (
            <button key={t.key} className={active.key === t.key ? "active" : ""} onClick={() => setParams({ tab: t.key })}>
              <i className={`fas ${t.icon}`}></i>
              <span><strong>{t.label}</strong><small>{t.hint}</small></span>
            </button>
          ))}
        </nav>
        <div className="settings-content" key={active.key}>
          {active.key === "profile" && <ProfileTab user={user} />}
          {active.key === "appearance" && <AppearanceTab />}
          {active.key === "billing" && <BillingTab user={user} />}
          {active.key === "account" && <AccountTab user={user} />}
        </div>
      </div>
    </div>
  );
}
