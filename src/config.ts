export const CONFIG = {
  brand: import.meta.env.VITE_BRAND_NAME || "InsureAssist",
  supportLabel: import.meta.env.VITE_BRAND_TAGLINE || "Insurance + ongoing support",
  leadEndpoint: import.meta.env.VITE_LEAD_ENDPOINT || "/api/leads",
  claimEndpoint: import.meta.env.VITE_CLAIM_ENDPOINT || "/api/claims",
  vehicleLookupEndpoint: import.meta.env.VITE_VEHICLE_LOOKUP_ENDPOINT || "/api/vehicle-lookup",
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || "",
  clarityProjectId: import.meta.env.VITE_CLARITY_PROJECT_ID || "",
  authorizedProviderNames: (import.meta.env.VITE_AUTHORIZED_PROVIDER_NAMES || "").split(",").map((x: string) => x.trim()).filter(Boolean),
  authorizedProviders: (() => {
    try {
      const raw = import.meta.env.VITE_AUTHORIZED_PROVIDERS_JSON || "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x: any) => x && typeof x.name === "string") : [];
    } catch {
      return [];
    }
  })(),
  // Footer / legal configuration. Rendered ONLY when set — never invent these values.
  legalBusinessName: import.meta.env.VITE_LEGAL_BUSINESS_NAME || "",
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || "",
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || "",
  businessAddress: import.meta.env.VITE_BUSINESS_ADDRESS || "",
  authorizationText: import.meta.env.VITE_AUTHORIZATION_TEXT || "",
  privacyUrl: import.meta.env.VITE_PRIVACY_URL || "",
  termsUrl: import.meta.env.VITE_TERMS_URL || "",
};
