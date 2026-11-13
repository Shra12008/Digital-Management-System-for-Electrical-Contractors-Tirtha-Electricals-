/**
 * Company details printed on every invoice.
 *
 * NOTE FOR THE TEAM: the address, phone, email, GSTIN and bank details
 * below are SAMPLE values so the dummy invoices look complete. Replace
 * them with Tirth Electrical & Services' real details - this is the only
 * file you need to edit, every invoice (thumbnail, viewer, PNG, PDF,
 * print) picks the change up automatically.
 */
export const DEFAULT_COMPANY = {
  name: "Tirth Electrical & Services",
  tagline: "Wiring, panels, lighting and maintenance",
  addressLine: "Unit 12, Industrial Estate Road, Mumbai, Maharashtra 400001",
  phone: "+91 98765 43210",
  email: "billing@tirthelectrical.example",
  gstin: "27ABCDE1234F1Z5",
  bank: {
    accountName: "Tirth Electrical & Services",
    bankName: "State Bank of India",
    accountNumber: "0000 1234 5678",
    ifsc: "SBIN0000000",
    upi: "tirthelectrical@sbi",
  },
  terms: [
    "Payment is due on or before the due date shown above.",
    "Goods once installed are covered by the manufacturer's warranty only.",
    "Subject to Mumbai jurisdiction.",
  ],
};

// Kept so older imports keep working; prefer getCompany() which also applies
// anything an admin saved under Settings > Billing & company.
export const COMPANY = DEFAULT_COMPANY;

const OVERRIDE_KEY = "tirth_company_overrides";

/** Company details used on invoices: defaults + whatever was saved in Settings. */
export function getCompany() {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_COMPANY;
    const o = JSON.parse(localStorage.getItem(OVERRIDE_KEY) || "null");
    if (!o) return DEFAULT_COMPANY;
    return {
      ...DEFAULT_COMPANY,
      ...o,
      bank: { ...DEFAULT_COMPANY.bank, ...(o.bank || {}) },
      terms: Array.isArray(o.terms) && o.terms.length ? o.terms : DEFAULT_COMPANY.terms,
    };
  } catch {
    return DEFAULT_COMPANY;
  }
}

export const saveCompany = (company) => localStorage.setItem(OVERRIDE_KEY, JSON.stringify(company));
export const resetCompany = () => localStorage.removeItem(OVERRIDE_KEY);
