export type Provider = { name: string; domain: string; logo?: string };

// Keep this list aligned with the insurer/provider names that your authorized
// distribution channel can actually quote or sell. Replace/extend via
// VITE_AUTHORIZED_PROVIDERS_JSON when the channel list changes.
export const defaultProviders: Provider[] = [
  { name: "Bajaj General", domain: "bajajgeneralinsurance.com" },
  { name: "HDFC ERGO", domain: "hdfcergo.com" },
  { name: "ICICI Lombard", domain: "icicilombard.com" },
  { name: "Tata AIG", domain: "tataaig.com" },
  { name: "SBI General", domain: "sbigeneral.in" },
  { name: "Royal Sundaram", domain: "royalsundaram.in" },
  { name: "Chola MS", domain: "cholainsurance.com" },
  { name: "IFFCO Tokio", domain: "iffcotokio.co.in" },
  { name: "Shriram General", domain: "shriramgi.com" },
  { name: "Zuno General", domain: "zunoinsurance.com" },
  { name: "Liberty General", domain: "libertyinsurance.in" },
  { name: "Navi General", domain: "navi.com" },
];
