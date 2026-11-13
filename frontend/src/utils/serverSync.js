// Pulls the signed-in user's profile and the company/billing settings from the
// backend into the small browser caches the UI reads synchronously (the
// sidebar avatar, and the invoice renderer which draws on a canvas).
import { saveCompany } from "../config/company";
import { companyApi, profileApi, updateStoredUser } from "../services/api";
import { profileStoreFor, settingsStore } from "./preferences";

// Same roles that SecurityConfig allows on GET /company-settings.
export const COMPANY_ROLES = ["ADMIN", "ACCOUNTANT", "CLIENT"];

const keep = (v) => (v === null || v === undefined || v === "" ? undefined : v);

/** Server DTO -> the company object the invoice renderer uses. Empty values are dropped so the built-in defaults still apply. */
export function companyFromApi(dto) {
  const b = dto.bank || {};
  return {
    name: keep(dto.name),
    tagline: keep(dto.tagline),
    addressLine: keep(dto.addressLine),
    phone: keep(dto.phone),
    email: keep(dto.email),
    gstin: keep(dto.gstin),
    bank: {
      accountName: keep(b.accountName),
      bankName: keep(b.bankName),
      accountNumber: keep(b.accountNumber),
      ifsc: keep(b.ifsc),
      upi: keep(b.upi),
    },
    terms: dto.terms && dto.terms.length ? dto.terms : undefined,
  };
}

export function cacheCompany(dto) {
  saveCompany(companyFromApi(dto));
  settingsStore.set({ defaultGst: dto.defaultGst, dueDays: dto.dueDays });
}

export function cacheProfile(user, p) {
  profileStoreFor(user).set({
    displayName: p.fullName || "",
    phone: p.phone || "",
    designation: p.designation || "",
    location: p.location || "",
    avatar: p.avatar || "",
  });
  updateStoredUser({ fullName: p.fullName, name: p.fullName });
}

export async function syncProfile(user) {
  const p = await profileApi.get();
  cacheProfile(user, p);
  return p;
}

export async function syncCompany(user) {
  if (!COMPANY_ROLES.includes(user?.role)) return null;
  const dto = await companyApi.get();
  cacheCompany(dto);
  return dto;
}
