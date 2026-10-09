import { CircleHelp, RefreshCw, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

// Insurance-intent options. Icons are language-neutral; the displayed label
// comes from the active i18n dictionary via intentLabel()/t.intent. The codes
// below are the stable values stored on the lead.
export type IntentCode = "renew" | "new" | "better" | "unsure";
export const insuranceIntents: { code: IntentCode; icon: typeof ShieldCheck }[] = [
  { code: "renew", icon: RefreshCw },
  { code: "new", icon: ShieldCheck },
  { code: "better", icon: TrendingUp },
  { code: "unsure", icon: CircleHelp },
];

export const insuranceCategories = [
  ["car", "Car Insurance", "Private cars, hatchbacks, sedans and SUVs"],
  ["bike", "Bike Insurance", "Motorcycles and two-wheelers"],
  ["tractor", "Tractor Insurance", "Tractors and agricultural vehicles"],
  ["commercial", "Commercial Vehicle", "Taxi, goods carriers, trucks and buses"],
  ["health", "Health Insurance", "Cover options for individuals and families"],
  ["term", "Term / Life Insurance", "Life protection for your family"],
  ["travel", "Travel Insurance", "Support for trips within India and abroad"],
  ["home", "Home Insurance", "Protection for home and belongings"],
  ["business", "Business Insurance", "Protection options for businesses"],
  ["pa", "Personal Accident", "Accident protection options"],
] as const;

export const vehicleTypes = [
  "Private Car", "SUV / MUV", "Bike", "Scooter", "Three Wheeler / Auto", "Taxi / Cab",
  "Pickup / Goods Carrier", "Mini Truck", "Truck", "Heavy Truck", "Container Truck", "Trailer",
  "Bus", "School Bus", "Staff Bus", "Passenger Bus", "Mini Bus", "Ambulance", "Fire Truck",
  "Tractor", "Tractor + Trolley", "Other"
];

export const usageTypes = ["Private", "Commercial", "Passenger Transport", "Goods Transport", "Agricultural", "School Transport", "Staff Transport", "Other"];

export const claimTypes = ["Accident", "Vehicle Damage", "Theft", "Third-Party Incident", "Natural Event", "Other"];

// Language-aware intent labels live in the i18n dictionaries
// (i18n/en.ts and i18n/hi.ts) and are selected by the active language.

// Language-aware intent labels live in the i18n dictionaries
// (i18n/en.ts and i18n/hi.ts) and are selected by the active language.
// Language-aware labels (intents, claim types, step titles, category names),
// icons and flow step titles are defined in the i18n dictionaries and are
// selected by the active language at runtime. No Hindi display labels remain
// in data.ts.

// Claim-type labels are language-aware and come from the i18n dictionaries
// (i18n/en.ts and i18n/hi.ts), selected by the active language.
