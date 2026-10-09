import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight, BadgeCheck, Bike, CalendarDays, CarFront, Check, ChevronLeft, ChevronRight, CircleHelp,
  FileCheck2, HeartPulse, Home, LockKeyhole, Menu, Phone, ShieldCheck, Sparkles, Tractor,
  Truck, UserRound, X, AlertCircle, Clock3, Headphones, ClipboardCheck, ExternalLink
} from "lucide-react";
import { claimTypes, insuranceCategories, usageTypes, vehicleTypes } from "./data";
import { CONFIG } from "./config";
import { BuyPanel, VEHICLE_IDS } from "./BuyFlow";
import { defaultProviders, type Provider } from "./providers";
import { LangProvider, useLang } from "./i18n";
import { createId, expiryInfo, formatDate, getUtm, loadMetaAndClarity, lookupVehicle, normalizeRegistration, routeCategory, saveClaim, saveLead, track } from "./lib";
import type { Claim, Lead, PolicyExpiryBucket, Tab, VehicleData, VehicleLookupStatus } from "./types";

const categoryIcons: Record<string, any> = { car: CarFront, bike: Bike, commercial: Truck, tractor: Tractor, health: HeartPulse, term: ShieldCheck, travel: Sparkles, home: Home, business: ClipboardCheck, pa: BadgeCheck };

const emptyBuy = {
  customerName: "", mobile: "", email: "", insuranceCategory: "car", vehicleType: "Private Car", registrationNo: "",
  vehicleMake: "", vehicleModel: "", vehicleVariant: "", vehicleYear: "", vehicleFuel: "", vehicleUsage: "Private",
  commercialPrivate: "Private", ownerName: "", previousInsurance: "Yes", previousInsurer: "", policyStartDate: "",
  policyExpiryDate: "", claimLastYear: "No", ncb: "", rcUploaded: false, consentStatus: false, intent: "",
};

const emptyClaim = { customerName: "", mobile: "", email: "", registrationNo: "", policyNumber: "", insurer: "", claimType: "Accident", incidentDate: "", description: "", preferredContact: "Call", documentsAvailable: "Yes", consentStatus: false };
type BuyState = typeof emptyBuy;
type ClaimState = typeof emptyClaim;

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`glass rounded-[28px] ${className}`}>{children}</div>; }
function Trust({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) { return <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-3 py-2 text-xs text-white/65">{icon}{children}</span>; }
function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) { return <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-[#0b5cff]">{eyebrow}</p><h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">{title}</h2>{text && <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">{text}</p>}</div>; }

// Compact header language toggle — small segmented control, no layout shift.
function LangToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = useLang();
  const base = compact ? "px-1.5 py-1 text-[11px]" : "px-2 py-1.5 text-xs";
  return (
    <div role="group" aria-label={t.nav.langLabel} className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 ${compact ? "" : "mr-1"}`}>
      {(["en", "hi"] as const).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-md font-black transition ${base} ${lang === l ? "bg-white text-[#0b5cff] shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
        >
          {l === "en" ? "EN" : "हिंदी"}
        </button>
      ))}
    </div>
  );
}

function ProviderLogo({ provider, className = "" }: { provider: Provider; className?: string }) {
  const [failed, setFailed] = useState(false);
  const initials = provider.name.split(/\s+/).map(x => x[0]).slice(0, 2).join("").toUpperCase();
  const src = provider.logo || ""; // Local /provider-logos assets only — never fetch remote favicons above the fold.
  return <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-slate-200 shadow-sm ${className}`}>
    {!failed && src ? <img src={src} alt={`${provider.name} logo`} loading="lazy" decoding="async" width="28" height="28" fetchPriority="low" className="h-7 w-7 object-contain" onError={() => setFailed(true)} /> : <span aria-hidden="true" className="text-[11px] font-black text-[#0b5cff]">{initials}</span>}
  </div>;
}

const vehicleCategories = [
  { id: "car", title: "Car Insurance", desc: "Private cars, hatchbacks, sedans and SUVs", image: "/vehicles/car.jpg" },
  { id: "bike", title: "Bike Insurance", desc: "Motorcycles, scooters and two-wheelers", image: "/vehicles/bike.jpg" },
  { id: "tractor", title: "Tractor Insurance", desc: "Tractors and agricultural vehicles", image: "/vehicles/tractor.jpg" },
  { id: "commercial", title: "Commercial Vehicle", desc: "Taxi, pickup, trucks and buses", image: "/vehicles/commercial.jpg" },
];

function VehicleCarousel({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  const { t, categoryName, categoryDesc } = useLang();
  const trackRef = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, Math.round(el.clientWidth * 0.85)), behavior: "smooth" });
  };
  return (
    <>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#0b5cff]">{t.carousel.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-black tracking-[-.035em] sm:text-3xl">{t.carousel.title}</h2>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button type="button" onClick={() => nudge(-1)} aria-label={t.carousel.prev} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-[#0b5cff]"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => nudge(1)} aria-label={t.carousel.next} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-[#0b5cff]"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={trackRef} className="no-scrollbar -mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {vehicleCategories.map(v => (
          <button key={v.id} type="button" aria-pressed={activeId === v.id} onClick={() => onSelect(v.id)} className={`group w-[80%] shrink-0 snap-start overflow-hidden rounded-3xl border bg-white p-3 text-left transition hover:-translate-y-1 hover:shadow-xl sm:w-[46%] lg:w-auto ${activeId === v.id ? "border-[#0b5cff] ring-2 ring-[#0b5cff]/30" : "border-slate-200"}`}>
            <span className="block aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
              <img src={v.image} alt="" aria-hidden="true" loading="lazy" decoding="async" width="960" height="720" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            </span>
            <span className="mt-4 block px-2 pb-2">
              <span className="block font-black">{categoryName(v.id, v.title)}</span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{categoryDesc(v.id, v.desc)}</span>
              <span className="mt-3 inline-flex items-center text-xs font-extrabold text-[#0b5cff]">{activeId === v.id ? t.carousel.selected : t.carousel.choose} <ChevronRight size={15} /></span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function AppInner() {
  const { lang, t, categoryName, categoryDesc, intentLabel, claimTypeLabel, applyLangSeo } = useLang();
  const params = new URLSearchParams(window.location.search);
  const initialTab: Tab = params.get("tab") === "claim" ? "claim" : "buy";
  const initialCategory = params.get("type") || routeCategory() || "car";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [buy, setBuy] = useState<BuyState>({ ...emptyBuy, insuranceCategory: insuranceCategories.some(x => x[0] === initialCategory) ? initialCategory : "car" });
  const [claim, setClaim] = useState<ClaimState>(emptyClaim);
  const [lookup, setLookup] = useState<VehicleData | null>(null);
  const [lookupStatus, setLookupStatus] = useState<VehicleLookupStatus | "IDLE">("IDLE");
  const [lookupMessage, setLookupMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<{ type: Tab; id: string } | null>(null);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const [heroError, setHeroError] = useState("");
  const [step, setStepRaw] = useState<number>(() => {
    const valid = insuranceCategories.some(x => x[0] === initialCategory) ? initialCategory : "car";
    return ["car", "bike", "commercial", "tractor"].includes(valid) ? 1 : 3;
  });
  const [kbHidden, setKbHidden] = useState(false);
  const inputStarted = useRef(false);
  const contactTracked = useRef(false);
  const AUTOSAVE_KEY = "insureassist_buy_v1";

  useEffect(() => { loadMetaAndClarity(); track("landing_view"); }, []);
  useEffect(() => { applyLangSeo(buy.insuranceCategory, CONFIG.brand); }, [buy.insuranceCategory, lang]);

  // Session-scoped autosave: recovers the funnel after an accidental refresh.
  // Never localStorage; consent is deliberately NOT persisted across sessions.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && typeof s === "object") {
        if (s.buy && typeof s.buy === "object") {
          // A deep link (/insurance/tractor …) must always win over the
          // autosaved category, so ad landings never reopen the wrong vehicle.
          const routeCat = params.get("type") || routeCategory();
          const forcedCat = routeCat && insuranceCategories.some(x => x[0] === routeCat) ? routeCat : null;
          setBuy(p => ({ ...p, ...s.buy, insuranceCategory: forcedCat || s.buy.insuranceCategory || p.insuranceCategory, consentStatus: false }));
        }
        if (typeof s.step === "number") setStepRaw(s.step);
      }
    } catch { /* ignore corrupted state */ }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ buy: { ...buy, consentStatus: false }, step })); } catch { /* storage may be unavailable */ }
  }, [buy, step]);

  // Hide the sticky CTA while the soft keyboard is open so it never covers form fields.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKbHidden(vv.height < window.innerHeight * 0.75);
    onResize();
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Category deep links (/insurance/car …): keep the page in sync with browser back/forward.
  useEffect(() => {
    const onPop = () => {
      const c = routeCategory();
      if (c && insuranceCategories.some(x => x[0] === c)) setBuy(p => ({ ...p, insuranceCategory: c }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setBuyField = (key: keyof BuyState, value: string | boolean) => setBuy(p => ({ ...p, [key]: value }));
  const setClaimField = (key: keyof ClaimState, value: string | boolean) => setClaim(p => ({ ...p, [key]: value }));
  const expiry = expiryInfo(buy.policyExpiryDate, lang);
  const selectedCategory = insuranceCategories.find(x => x[0] === buy.insuranceCategory);
  const providers: Provider[] = CONFIG.authorizedProviders.length ? CONFIG.authorizedProviders : (CONFIG.authorizedProviderNames.length ? CONFIG.authorizedProviderNames.map((name: string) => ({ name, domain: "" })) : defaultProviders);

  function switchTab(next: Tab) { setTab(next); setError(""); if (next === "claim") track("claim_started"); track(next === "buy" ? "buy_tab_selected" : "claim_tab_selected"); window.history.replaceState({}, "", next === "claim" ? "?tab=claim" : window.location.pathname); }

  function goto(s: number) {
    setStepRaw(s);
    if (s === 5) track("options_viewed", { insurance_category: buy.insuranceCategory });
    requestAnimationFrame(() => document.getElementById("action")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function selectCategory(id: string) {
    if (!insuranceCategories.some(x => x[0] === id)) return;
    setBuyField("insuranceCategory", id);
    setError(""); setHeroError("");
    setStepRaw(VEHICLE_IDS.includes(id) ? 1 : 3);
    try { window.history.pushState({}, "", `/insurance/${id}`); } catch { /* ignore */ }
    switchTab("buy");
    track("insurance_category_selected", { insurance_category: id });
    document.getElementById("action")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function heroGo() {
    const reg = normalizeRegistration(buy.registrationNo);
    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/.test(reg)) { setHeroError(t.steps.errInvalidReg); return; }
    setHeroError(""); setStepRaw(1); switchTab("buy");
    void handleLookup();
  }

  async function handleLookup() {
    const registrationNo = normalizeRegistration(buy.registrationNo);
    setBuyField("registrationNo", registrationNo);
    setHeroError(""); setError(""); setLookupMessage("");
    if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/.test(registrationNo)) { setError(t.steps.errInvalidReg); return; }
    setLookupStatus("LOADING"); track("vehicle_lookup_started");
    const friendly = t.steps.errLookupFail;
    try {
      const result = await lookupVehicle(registrationNo);
      if (!result.vehicle) throw new Error(friendly);
      setLookup(result.vehicle); setLookupStatus(result.status === "PARTIAL" ? "PARTIAL" : "SUCCESS");
      setBuy(p => ({ ...p, registrationNo, vehicleMake: result.vehicle!.make, vehicleModel: result.vehicle!.model, vehicleVariant: result.vehicle!.variant, vehicleFuel: result.vehicle!.fuel, vehicleType: result.vehicle!.vehicleType || p.vehicleType, vehicleYear: result.vehicle!.year, ownerName: result.vehicle!.ownerName, previousInsurer: result.vehicle!.insurer, policyStartDate: result.vehicle!.insuranceStartDate, policyExpiryDate: result.vehicle!.insuranceExpiryDate }));
      track("vehicle_lookup_success", { vehicle_type: result.vehicle.vehicleType || "unknown" });
    } catch {
      // Driver-first fallback: never surface a technical API error to the customer.
      setLookup(null); setLookupStatus("NOT_FOUND"); setLookupMessage(friendly);
      track("vehicle_lookup_failed", { insurance_category: buy.insuranceCategory });
    }
    goto(2);
  }

  function baseLead(): Lead {
    const utm = getUtm();
    return {
      leadId: createId("INS"), createdAt: new Date().toISOString(), leadStatus: "NEW", source: utm.source, campaign: utm.campaign, adSet: utm.adSet, adCreative: utm.adCreative,
      customerName: buy.customerName.trim(), mobile: buy.mobile, email: buy.email.trim(), insuranceCategory: selectedCategory?.[1] || buy.insuranceCategory,
      insuranceIntent: intentLabel(buy.intent, buy.intent) || "",
      vehicleType: buy.vehicleType, registrationNo: buy.registrationNo, vehicleMake: buy.vehicleMake, vehicleModel: buy.vehicleModel, vehicleVariant: buy.vehicleVariant,
      vehicleYear: buy.vehicleYear, vehicleFuel: buy.vehicleFuel, vehicleUsage: buy.vehicleUsage, commercialPrivate: buy.commercialPrivate, ownerName: buy.ownerName,
      previousInsurance: buy.previousInsurance, previousInsurer: buy.previousInsurer, policyStartDate: buy.policyStartDate, policyExpiryDate: buy.policyExpiryDate,
      policyExpiryBucket: expiry.bucket as PolicyExpiryBucket, daysUntilExpiry: expiry.days, currentInsurer: buy.previousInsurer, claimLastYear: buy.claimLastYear, ncb: buy.ncb,
      quoteRequired: "Insurance purchase / renewal", documentsStatus: "PENDING", rcUploaded: buy.rcUploaded, aadhaarUploaded: false, otherDocumentUploaded: false,
      consentStatus: buy.consentStatus, consentTimestamp: buy.consentStatus ? new Date().toISOString() : "", vehicleLookupStatus: lookupStatus === "IDLE" ? "MANUAL_ENTRY" : lookupStatus,
      vehicleLookupProvider: "api-sathi", vehicleLookupTimestamp: lookupStatus !== "IDLE" ? new Date().toISOString() : "",
    };
  }

  async function submitBuy() {
    setError("");
    if (!buy.customerName.trim()) return setError(t.contact.errName);
    if (!/^[6-9]\d{9}$/.test(buy.mobile)) return setError(t.contact.errMobile);
    if (["car", "bike", "commercial", "tractor"].includes(buy.insuranceCategory) && !buy.registrationNo) return setError(t.steps.errInvalidReg);
    if (!buy.consentStatus) return setError(t.review.errConsent);
    setSaving(true); const lead = baseLead();
    const result = await saveLead(lead); setSaving(false);
    if (!result.ok && result.fallback) {
      track("lead_submit_fallback", { insurance_category: buy.insuranceCategory });
      return setError(t.review.errSubmit);
    }
    try { sessionStorage.removeItem(AUTOSAVE_KEY); } catch { /* ignore */ }
    track("lead_created", { insurance_category: buy.insuranceCategory });
    track("lead_submitted", { insurance_category: buy.insuranceCategory, insurance_intent: buy.intent || "unknown" });
    track("insurance_purchase_intent", { insurance_category: buy.insuranceCategory });
    setSuccess({ type: "buy", id: lead.leadId });
  }

  async function submitClaim() {
    setError("");
    if (!claim.customerName.trim()) return setError(t.contact.errName);
    if (!/^[6-9]\d{9}$/.test(claim.mobile)) return setError(t.contact.errMobile);
    if (!claim.registrationNo.trim()) return setError(t.steps.errInvalidReg);
    if (!claim.incidentDate) return setError(t.claimForm.errRequired);
    if (!claim.description.trim()) return setError(t.claimForm.errRequired);
    if (!claim.consentStatus) return setError(t.claimForm.errConsent);
    const utm = getUtm(); const item: Claim = { claimId: createId("CLM"), createdAt: new Date().toISOString(), ...claim, registrationNo: normalizeRegistration(claim.registrationNo), claimStatus: "NEW", consentTimestamp: new Date().toISOString(), source: utm.source, campaign: utm.campaign, adSet: utm.adSet, adCreative: utm.adCreative };
    setSaving(true); const result = await saveClaim(item); setSaving(false);
    if (!result.ok && result.fallback) { return setError(t.claimForm.errSubmit); }
    track("claim_assistance_submitted", { claim_type: claim.claimType });
    track("claim_submitted", { claim_type: claim.claimType });
    setSuccess({ type: "claim", id: item.claimId });
  }

  if (success) return <SuccessScreen type={success.type} id={success.id} stepTotal={VEHICLE_IDS.includes(buy.insuranceCategory) ? 7 : 5} onHome={() => { setSuccess(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} />;

  return <div className="min-h-screen bg-[#f5f8fc] text-slate-900">
    <div className="bg-[#071a33] text-white/85"><div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-[11px] sm:text-xs"><ShieldCheck size={14} className="text-cyan-200" /> {t.topStrip}</div></div>
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b5cff] text-white shadow-lg shadow-blue-500/20"><ShieldCheck size={21}/></div><div><div className="font-black tracking-tight">{CONFIG.brand}</div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">{lang === "hi" ? "बीमा सहायता" : "Insurance assistance"}</div></div></a>
        <div className="hidden items-center gap-5 md:flex"><a href="#insurance" className="text-sm font-semibold text-slate-600 hover:text-slate-950">{t.nav.insurance}</a><a href="#how" className="text-sm font-semibold text-slate-600 hover:text-slate-950">{t.nav.howItWorks}</a><a href="#claims" className="text-sm font-semibold text-slate-600 hover:text-slate-950">{t.nav.claims}</a><a href="#faq" className="text-sm font-semibold text-slate-600 hover:text-slate-950">{lang === "hi" ? "FAQ" : t.nav.faq}</a><LangToggle compact /><button onClick={() => { switchTab("buy"); document.getElementById("action")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-xl bg-[#0b5cff] px-4 py-2.5 text-sm font-extrabold text-white">{t.nav.cta}</button></div>
        <div className="flex items-center gap-1 md:hidden"><LangToggle /><button onClick={() => setMenu(!menu)} className="rounded-xl p-2" aria-label={menu ? t.nav.close : t.nav.menu} aria-expanded={menu}>{menu ? <X/> : <Menu/>}</button></div>
      </nav>
      {menu && <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden"><a href="#insurance" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold">{t.nav.insurance}</a><a href="#how" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-sm font-semibold">{t.nav.howItWorks}</a><button onClick={() => { setMenu(false); switchTab("claim"); document.getElementById("action")?.scrollIntoView({ behavior: "smooth" }); }} className="block w-full rounded-xl px-3 py-3 text-left text-sm font-semibold">{t.nav.claimCta}</button></div>}
    </header>

    <main id="top">
      <section className="relative overflow-hidden bg-[#071a33] text-white"><div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,179,255,.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(77,91,255,.2),transparent_32%)]"/><div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="flex flex-col justify-center"><div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[.07] px-3 py-2 text-xs font-semibold text-white/70"><span className="h-2 w-2 rounded-full bg-emerald-300"/>{categoryName(buy.insuranceCategory, selectedCategory?.[1] || buy.insuranceCategory)}</div><h1 className="max-w-3xl text-4xl font-black leading-[1.06] tracking-[-.04em] sm:text-5xl">{t.hero.title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">{t.hero.subtitle}</p><div className="mt-6 rounded-3xl border border-white/10 bg-white/[.07] p-3 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-4"><label className="mb-2 block text-xs font-black uppercase tracking-[.14em] text-white/55" htmlFor="hero-reg">{t.hero.vehicleReg}</label><div className="flex flex-col gap-2 sm:flex-row"><input id="hero-reg" aria-label={t.hero.vehicleReg} className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white px-4 py-4 text-base font-bold uppercase text-slate-900 outline-none" value={buy.registrationNo} onChange={e => { if (!inputStarted.current) { inputStarted.current = true; track("vehicle_input_started"); } setBuyField("registrationNo", e.target.value.toUpperCase()); }} placeholder="MH12AB1234" inputMode="text" autoComplete="off"/><button type="button" disabled={!buy.registrationNo || lookupStatus === "LOADING"} onClick={heroGo} className="rounded-2xl bg-[#0b5cff] px-5 py-4 text-sm font-black text-white disabled:opacity-50">{lookupStatus === "LOADING" ? t.steps.checking : t.hero.cta}<ArrowRight className="ml-1 inline" size={16}/></button></div><p className="mt-2 text-[11px] text-white/45">{lang === "hi" ? "उदाहरण: MH 12 AB 1234" : "Example: MH 12 AB 1234"}</p>{heroError && <p role="alert" className="mt-2 text-xs font-bold text-amber-300">{heroError}</p>}</div><div className="mt-5 flex flex-wrap gap-2"><Trust icon={<LockKeyhole size={14}/>}>{t.hero.bullets[0]}</Trust><Trust icon={<Headphones size={14}/>}>{t.hero.bullets[1]}</Trust><Trust icon={<BadgeCheck size={14}/>}>{t.hero.bullets[2]}</Trust></div><div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" onClick={() => { switchTab("claim"); document.getElementById("action")?.scrollIntoView({ behavior: "smooth" }); }} className="rounded-2xl border border-white/15 bg-white/[.07] px-5 py-3.5 text-sm font-bold text-white">{t.hero.claimLink}</button></div><p className="mt-4 text-[11px] leading-5 text-white/40">{t.hero.note}</p></div>
    </div></section>

    <section aria-label="Available insurance providers" className="relative z-10 mx-auto -mt-6 max-w-6xl px-4 sm:px-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[11px] font-black uppercase tracking-[.18em] text-[#0b5cff]">{t.providers.eyebrow}</p><h2 className="mt-1 text-lg font-black">{t.providers.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{t.providers.note}</p></div>
        </div>
        <div className="marquee mt-4" role="group" aria-label="Insurance providers available through our channel">
          <div className="marquee-track flex w-max animate-marquee hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
            <div className="flex shrink-0 gap-3 pr-3">{providers.map((provider, i) => <div key={`mq1-${provider.name}-${i}`} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><ProviderLogo provider={provider} className="h-8 w-8"/><span className="whitespace-nowrap text-[11px] font-black text-slate-700">{provider.name}</span></div>)}</div>
            <div className="flex shrink-0 gap-3 pr-3" aria-hidden="true">{providers.map((provider, i) => <div key={`mq2-${provider.name}-${i}`} className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"><ProviderLogo provider={provider} className="h-8 w-8"/><span className="whitespace-nowrap text-[11px] font-black text-slate-700">{provider.name}</span></div>)}</div>
          </div>
        </div>
      </div>
    </section>

    <section id="action" className="mx-auto -mt-8 max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[30px] border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10"><div role="tablist" aria-label="Insurance request type" className="grid grid-cols-2 rounded-[24px] bg-slate-100 p-1"><button role="tab" id="tab-buy" aria-selected={tab === "buy"} aria-controls="panel-buy" onClick={() => switchTab("buy")} className={`rounded-[20px] px-3 py-3.5 text-sm font-black transition sm:text-base ${tab === "buy" ? "bg-white text-[#0b5cff] shadow-sm" : "text-slate-500"}`}>{t.tabs.buy}</button><button role="tab" id="tab-claim" aria-selected={tab === "claim"} aria-controls="panel-claim" onClick={() => switchTab("claim")} className={`rounded-[20px] px-3 py-3.5 text-sm font-black transition sm:text-base ${tab === "claim" ? "bg-white text-[#0b5cff] shadow-sm" : "text-slate-500"}`}>{t.tabs.claim}</button></div>
      {tab === "buy" ? <div id="panel-buy" role="tabpanel" aria-labelledby="tab-buy" className="p-4 sm:p-7"><BuyPanel buy={buy} setBuy={setBuyField} lookup={lookup} lookupStatus={lookupStatus} lookupMessage={lookupMessage} onLookup={handleLookup} expiry={expiry} saving={saving} error={error} setErr={setError} onSubmit={submitBuy} step={step} goto={goto} providers={providers} onVerified={() => track("vehicle_details_verified", { insurance_category: buy.insuranceCategory })} onContactFocus={() => { if (!contactTracked.current) { contactTracked.current = true; track("contact_started", { insurance_category: buy.insuranceCategory }); } }} onIntent={(code: string) => track("insurance_intent_selected", { insurance_category: buy.insuranceCategory, insurance_intent: code })} /></div> : <div id="panel-claim" role="tabpanel" aria-labelledby="tab-claim" className="p-4 sm:p-7"><ClaimPanel claim={claim} setClaim={setClaimField} saving={saving} error={error} onSubmit={submitClaim}/></div>}</div>
    </section>

    <section id="insurance" className="below-fold mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-[.2em] text-[#0b5cff]">{t.categories.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-black tracking-[-.035em] sm:text-4xl">{t.categories.title}</h2>
        <p className="mt-4 text-sm leading-7 text-slate-500">{t.categories.text}</p>
      </div>
      <VehicleCarousel activeId={buy.insuranceCategory} onSelect={selectCategory} />
      <p className="mt-12 text-xs font-black uppercase tracking-[.18em] text-slate-400">{t.categories.other}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {insuranceCategories.filter(([id]) => !VEHICLE_IDS.includes(id)).map(([id, title, desc]) => { const Icon = categoryIcons[id] || ShieldCheck; return (
          <button key={id} type="button" onClick={() => selectCategory(id)} aria-pressed={buy.insuranceCategory === id} className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${buy.insuranceCategory === id ? "border-[#0b5cff] bg-blue-50" : "border-slate-200 bg-white"}`}>
            <Icon size={18} className="text-[#0b5cff]" />
            <span className="text-sm font-black">{categoryName(id, title)}</span>
            <span className="text-[11px] leading-4 text-slate-500">{categoryDesc(id, desc)}</span>
          </button>); })}
      </div>
    </section>

    <section id="how" className="below-fold border-y border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><SectionTitle eyebrow={t.how.eyebrow} title={t.how.title}/><div className="mt-12 grid gap-5 md:grid-cols-4">{[["01", t.how.s1t, t.how.s1d],["02", t.how.s2t, t.how.s2d],["03", t.how.s3t, t.how.s3d],["04", t.how.s4t, t.how.s4d]].map(([n,t,d]) => <div key={n} className="relative rounded-3xl border border-slate-200 p-6"><span className="text-xs font-black text-[#0b5cff]">{n}</span><h3 className="mt-5 text-lg font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{d}</p></div>)}</div></div></section>

    <section id="claims" className="below-fold mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"><div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10"><div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.2em] text-[#0b5cff]">{t.claimSection.badge}</p><h2 className="mt-3 text-2xl font-black tracking-[-.03em] sm:text-3xl">{t.claimSection.title}</h2><p className="mt-4 text-sm leading-7 text-slate-500">{t.claimSection.text}</p><p className="mt-3 text-[11px] leading-5 text-slate-400">{t.claimSection.note}</p></div><div className="mt-6 shrink-0 lg:mt-0"><button type="button" onClick={() => { switchTab("claim"); document.getElementById("action")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full rounded-2xl bg-[#0b5cff] px-7 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 lg:w-auto">{t.claimSection.cta}</button></div></div></section>

    <section id="faq" className="below-fold border-t border-slate-200 bg-white"><div className="mx-auto max-w-4xl px-4 py-20 sm:px-6"><SectionTitle eyebrow={t.faq.eyebrow} title={t.faq.title}/><div className="mt-10 space-y-3">{t.faqItems.map(({ q, a }) => <details key={q} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5"><summary className="flex cursor-pointer list-none items-center justify-between font-bold">{q}<ChevronRight className="transition group-open:rotate-90" size={18}/></summary><p className="mt-3 pr-6 text-sm leading-6 text-slate-500">{a}</p></details>)}</div></div></section>
    </main>
    <footer className="bg-[#061326] text-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 md:pb-10 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-black"><ShieldCheck/> {CONFIG.brand}</div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/45">{t.footer.tagline}</p>
            {CONFIG.legalBusinessName && <p className="mt-3 text-sm font-bold text-white/75">{CONFIG.legalBusinessName}</p>}
            <div className="mt-3 space-y-1.5 text-sm text-white/55">
              {CONFIG.contactPhone && <a href={`tel:${CONFIG.contactPhone.replace(/[^+\d]/g, "")}`} className="flex items-center gap-2 hover:text-white"><Phone size={14}/>{CONFIG.contactPhone}</a>}
              {CONFIG.contactEmail && <a href={`mailto:${CONFIG.contactEmail}`} className="block break-all hover:text-white">{CONFIG.contactEmail}</a>}
            </div>
            {CONFIG.businessAddress && <p className="mt-3 max-w-sm text-xs leading-5 text-white/40">{CONFIG.businessAddress}</p>}
          </div>
          <div>
            <p className="font-bold">{t.footer.links}</p>
            <div className="mt-3 space-y-2 text-sm text-white/50">
              <a href="#insurance" className="block hover:text-white">{t.nav.insurance}</a>
              <a href="#claims" className="block hover:text-white">{t.nav.claimCta}</a>
              <a href="#faq" className="block hover:text-white">{t.faq.title}</a>
              {CONFIG.privacyUrl && <a href={CONFIG.privacyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">{t.footer.privacy} <ExternalLink size={13}/></a>}
              {CONFIG.termsUrl && <a href={CONFIG.termsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">{t.footer.terms} <ExternalLink size={13}/></a>}
            </div>
          </div>
          <div>
            <p className="font-bold">{t.footer.legal}</p>
            <p lang="en" className="mt-3 text-xs leading-6 text-white/45">Insurance products are subject to the terms, conditions, exclusions and eligibility criteria of the respective insurer. Final premium, coverage and policy issuance are determined by the insurer.</p>
            {CONFIG.authorizationText && <p className="mt-3 text-xs leading-5 text-white/55">{CONFIG.authorizationText}</p>}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span>{CONFIG.legalBusinessName ? `© ${new Date().getFullYear()} ${CONFIG.legalBusinessName}` : `${CONFIG.brand} — insurance purchase and claim assistance support.`}</span>
          <span>{t.topStrip}</span>
        </div>
      </div>
    </footer>
    <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur md:hidden${kbHidden ? " hidden" : ""}`}><button type="button" onClick={() => { switchTab(tab); document.getElementById("action")?.scrollIntoView({ behavior: "smooth" }); }} className="w-full rounded-xl bg-[#0b5cff] py-3.5 text-sm font-black text-white">{tab === "buy" ? t.sticky.buy : t.sticky.claim}</button></div>
  </div>;
}







function ClaimPanel({ claim, setClaim, saving, error, onSubmit }: any) {
  const { t, claimTypeLabel } = useLang();
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[.18em] text-[#0b5cff]">{t.claimForm.eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-tight">{t.claimForm.title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t.claimForm.text}</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label={`${t.claimForm.name} *`}><input className="input" value={claim.customerName} onChange={e => setClaim("customerName", e.target.value)} placeholder={t.claimForm.namePh} autoComplete="name"/></Field>
        <Field label={`${t.claimForm.mobile} *`}><input className="input" value={claim.mobile} onChange={e => setClaim("mobile", e.target.value.replace(/\D/g, "").slice(0,10))} placeholder={t.claimForm.mobilePh} inputMode="numeric" autoComplete="tel"/></Field>
        <Field label={`${t.claimForm.reg} *`}><input className="input uppercase" value={claim.registrationNo} onChange={e => setClaim("registrationNo", e.target.value.toUpperCase())} placeholder="MH12AB1234"/></Field>
        <Field label={t.claimForm.policy}><input className="input" value={claim.policyNumber} onChange={e => setClaim("policyNumber", e.target.value)} placeholder={t.claimForm.policyPh}/></Field>
        <Field label={t.claimForm.insurer}><input className="input" value={claim.insurer} onChange={e => setClaim("insurer", e.target.value)} placeholder={t.claimForm.insurerPh}/></Field>
        <Field label={`${t.claimForm.type} *`}><select className="input" value={claim.claimType} onChange={e => setClaim("claimType", e.target.value)}>{claimTypes.map(v => <option key={v} value={v}>{claimTypeLabel(v)}</option>)}</select></Field>
        <Field label={`${t.claimForm.date} *`}><input className="input" type="date" value={claim.incidentDate} onChange={e => setClaim("incidentDate", e.target.value)}/></Field>
        <Field label={t.claimForm.contactWay}><select className="input" value={claim.preferredContact} onChange={e => setClaim("preferredContact", e.target.value)}><option value="Call">{t.claimForm.call}</option><option value="WhatsApp">{t.claimForm.whatsapp}</option></select></Field>
        <Field label={t.claimForm.docs}><select className="input" value={claim.documentsAvailable} onChange={e => setClaim("documentsAvailable", e.target.value)}><option value="Yes">{t.review.yes}</option><option value="No">{t.review.no}</option></select></Field>
        <div className="sm:col-span-2"><Field label={t.claimForm.desc}><textarea className="input" rows={3} value={claim.description} onChange={e => setClaim("description", e.target.value)} placeholder={t.claimForm.descPh}/></Field></div>
      </div>
      <label className="mt-5 flex items-start gap-3 text-xs text-slate-600"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={claim.consentStatus} onChange={e => setClaim("consentStatus", e.target.checked)}/><span>{t.claimForm.consent}</span></label>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      <p className="mt-3 text-[11px] leading-5 text-slate-400">{t.claimSection.note}</p>
      <button type="button" disabled={saving} onClick={onSubmit} className="mt-5 w-full rounded-2xl bg-[#0b5cff] py-4 text-sm font-black text-white disabled:opacity-60">{saving ? t.claimForm.submitting : t.claimForm.submit}</button>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block flex-1"><span className="label">{label}</span>{children}</label>; }

function SuccessScreen({ type, id, stepTotal, onHome }: { type: Tab; id: string; stepTotal: number; onHome: () => void }) { const { t } = useLang(); return <div className="grid min-h-screen place-items-center bg-[#f5f8fc] px-4 py-12"><div className="max-w-lg w-full rounded-[34px] border border-slate-200 bg-white p-8 text-center shadow-2xl shadow-slate-900/10 sm:p-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check size={30}/></div><p className="mt-6 text-xs font-black uppercase tracking-[.2em] text-[#0b5cff]">{type === "buy" ? `${t.steps.stepOf} ${stepTotal} / ${stepTotal} · ${t.success.funnelEyebrow}` : t.success.claimEyebrow}</p><h1 className="mt-3 text-3xl font-black tracking-tight">{t.success.title}</h1>{type === "buy" ? <><p className="mt-4 text-sm leading-7 text-slate-500">{t.success.buyText}</p><ol className="mt-5 space-y-2 text-left">{t.success.buySteps.map((x, i) => <li key={x} className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm"><span className="font-black text-[#0b5cff]">{i + 1}.</span><span className="font-bold text-slate-700">{x}</span></li>)}</ol></> : <p className="mt-4 text-sm leading-7 text-slate-500">{t.success.claimText}</p>}<div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm"><span className="text-slate-400">{t.success.ref}</span><br/><strong>{id}</strong></div><button type="button" onClick={onHome} className="mt-6 w-full rounded-2xl bg-[#0b5cff] py-3.5 text-sm font-black text-white">{t.success.home}</button></div></div> }

export default function App() { return <LangProvider><AppInner /></LangProvider>; }
