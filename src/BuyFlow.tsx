import { useState } from "react";
import { AlertCircle, ArrowRight, Check, ChevronRight } from "lucide-react";
import { insuranceCategories, insuranceIntents, usageTypes } from "./data";
import { formatDate } from "./lib";
import { useLang } from "./i18n";
import type { VehicleData } from "./types";

export const VEHICLE_IDS = ["car", "bike", "commercial", "tractor"];

type Expiry = { bucket: string; days: number | null; label: string };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block flex-1"><span className="label">{label}</span>{children}</label>;
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black">{value || "—"}</p>
    </div>
  );
}

function ErrorBox({ error }: { error: string }) {
  if (!error) return null;
  return (
    <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
    </div>
  );
}

function ManualVehicleFields({ buy, setBuy }: any) {
  const { t } = useLang();
  return (
    <>
      <Field label={t.steps.make}><input className="input" value={buy.vehicleMake} onChange={e => setBuy("vehicleMake", e.target.value)} placeholder={t.steps.makePh} /></Field>
      <Field label={t.steps.model}><input className="input" value={buy.vehicleModel} onChange={e => setBuy("vehicleModel", e.target.value)} placeholder={t.steps.modelPh} /></Field>
      <Field label={t.steps.year}><input className="input" value={buy.vehicleYear} onChange={e => setBuy("vehicleYear", e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" placeholder={t.steps.yearPh} /></Field>
      <Field label={t.steps.fuel}><input className="input" value={buy.vehicleFuel} onChange={e => setBuy("vehicleFuel", e.target.value)} placeholder={t.steps.fuelPh} /></Field>
    </>
  );
}

// Step 2 verification card — neutral, factual, no fear-based language.
export function VehicleResult({ vehicle, expiry, registrationNo }: { vehicle: VehicleData; expiry: Expiry; registrationNo: string }) {
  const { t } = useLang();
  const expired = expiry.days !== null && expiry.days < 0;
  const meta = [vehicle.fuel, vehicle.year].filter(Boolean).join(" • ");
  const vType = vehicle.vehicleType || vehicle.vehicleClass;
  return (
    <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Check size={19} /></div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">{t.result.found}</p>
          <p className="mt-1 text-sm font-black tracking-wide">{registrationNo}</p>
          <h3 className="text-lg font-black">{vehicle.make || t.result.vehicle} {vehicle.model}</h3>
          {(meta || vType) && <p className="text-xs text-slate-600">{[meta, vType].filter(Boolean).join(" • ")}</p>}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t.result.currentInsurer}</p>
          <p className="mt-1 font-black">{vehicle.insurer || t.result.notAvailable}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t.result.expiryLabel}</p>
          <p className="mt-1 font-black">{vehicle.insuranceExpiryDate ? formatDate(vehicle.insuranceExpiryDate) : t.result.notAvailable}</p>
          {expiry.days !== null && <p className={`mt-1 text-xs font-bold ${expired ? "text-amber-700" : "text-slate-500"}`}>{expiry.label}</p>}
        </div>
      </div>
      {expired && <p className="mt-3 text-xs font-bold text-amber-800">{t.result.expiredNote}</p>}
      <p className="mt-3 text-[11px] leading-5 text-slate-500">{t.result.checkNote}</p>
    </div>
  );
}
export function BuyPanel({ buy, setBuy, lookup, lookupStatus, lookupMessage, onLookup, expiry, saving, error, setErr, onSubmit, step, goto, providers, onVerified, onContactFocus, onIntent }: any) {
  const { t, categoryName, intentLabel } = useLang();
  const [manual, setManual] = useState(false);
  const [more, setMore] = useState(false);
  const category: string = buy.insuranceCategory;
  const isVehicle = VEHICLE_IDS.includes(category);
  // Non-vehicle flows start at contact, but step 1 (category select) stays reachable
  // so the customer can always switch category without reloading.
  const flow: number[] = isVehicle ? [1, 2, 3, 4, 5, 6] : [1, 3, 4, 5, 6];
  const total = flow.length + 1; // + final "next step" screen
  const st = flow.includes(step) ? step : flow[0];
  const pos = flow.indexOf(st) + 1;
  const back = () => { const i = flow.indexOf(st); if (i > 0) goto(flow[i - 1]); };
  const stepTitle = (t.flowSteps as Record<number, string>)[st] || "";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[.18em] text-[#0b5cff]">{categoryName(category, category)}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{stepTitle}</h2>
        </div>
        <div className="flex items-center gap-3">
          {pos > 1 && <button type="button" onClick={back} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-slate-300">← {t.steps.back}</button>}
          <span className="text-xs font-bold text-slate-500" aria-live="polite">{t.steps.stepOf} {pos} / {total}</span>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={pos} aria-label={t.steps.progress}>
        <div className="h-full rounded-full bg-[#0b5cff] transition-all duration-300" style={{ width: `${(pos / total) * 100}%` }} />
      </div>

      {st === 1 && (
        <div className="mt-6">
          <label className="label" htmlFor="insurance-type">{t.steps.oneCategory}</label>
          <select id="insurance-type" className="input" value={category} onChange={e => { const v = e.target.value; setBuy("insuranceCategory", v); setErr(""); if (!VEHICLE_IDS.includes(v)) goto(3); }}>
            {insuranceCategories.map(([id, title]) => <option key={id} value={id}>{categoryName(id, title)}</option>)}
          </select>
          {isVehicle ? (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
              <label className="label text-slate-800" htmlFor="reg-no">{t.steps.regLabel}</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="reg-no" className="input flex-1 bg-white uppercase" value={buy.registrationNo} onChange={e => setBuy("registrationNo", e.target.value.toUpperCase())} placeholder={t.steps.phReg} inputMode="text" autoComplete="off" />
                <button type="button" disabled={!buy.registrationNo || lookupStatus === "LOADING"} onClick={() => void onLookup()} className="rounded-xl bg-[#0b5cff] px-6 py-3.5 text-sm font-black text-white disabled:opacity-50">
                  {lookupStatus === "LOADING" ? t.steps.checking : t.hero.cta}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">{t.hero.example}</p>
              <ErrorBox error={error} />
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
              <p className="text-xs leading-5 text-slate-500">{t.steps.oneText}</p>
              <button type="button" onClick={() => goto(3)} className="mt-3 rounded-2xl bg-[#0b5cff] px-6 py-3.5 text-sm font-black text-white">{t.steps.continue}</button>
            </div>
          )}
        </div>
      )}
      {st === 2 && (
        <div className="mt-6">
          {lookup ? (
            <>
              <VehicleResult vehicle={lookup} expiry={expiry} registrationNo={buy.registrationNo} />
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="font-black">{t.result.verifyTitle}</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <button type="button" onClick={() => { onVerified?.(); goto(3); }} className="rounded-2xl bg-[#0b5cff] px-6 py-3.5 text-sm font-black text-white">{t.result.yes}</button>
                  <button type="button" onClick={() => setManual(m => !m)} aria-expanded={manual} className="rounded-2xl border border-slate-300 px-6 py-3.5 text-sm font-black text-slate-700">{t.result.edit}</button>
                </div>
                {manual && (
                  <>
                    <p className="mt-4 text-xs font-bold text-slate-500">{t.steps.editHint}</p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2"><ManualVehicleFields buy={buy} setBuy={setBuy} /></div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                <div>
                  <p className="text-sm font-bold leading-6 text-slate-800">{lookupMessage || t.steps.errLookupFail}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{t.steps.optionalHint}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2"><ManualVehicleFields buy={buy} setBuy={setBuy} /></div>
              <button type="button" onClick={() => goto(3)} className="mt-4 rounded-2xl bg-[#0b5cff] px-6 py-3.5 text-sm font-black text-white">{t.steps.continue}</button>
            </div>
          )}
        </div>
      )}

      {st === 3 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-black">{t.contact.title}</p>
              <p className="text-xs text-slate-400">{t.contact.onlyNameMobile}</p>
            </div>
            <div className="flex items-center gap-2">
              {!isVehicle && <button type="button" onClick={() => goto(1)} className="text-xs font-bold text-[#0b5cff]">{t.steps.changeCategory}</button>}
              {lookup && <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700">{t.result.checkDetails}</span>}
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{t.contact.subText}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={`${t.contact.name} *`}><input className="input" value={buy.customerName} onChange={e => setBuy("customerName", e.target.value)} onFocus={onContactFocus} placeholder={t.contact.namePh} autoComplete="name" /></Field>
            <Field label={`${t.contact.mobile} *`}><input className="input" value={buy.mobile} onChange={e => setBuy("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))} onFocus={onContactFocus} placeholder={t.contact.mobilePh} inputMode="numeric" autoComplete="tel" /></Field>
          </div>
          <ErrorBox error={error} />
          <button type="button" onClick={() => {
            if (!buy.customerName.trim()) return setErr(t.contact.errName);
            if (!/^[6-9]\d{9}$/.test(buy.mobile)) return setErr(t.contact.errMobile);
            setErr(""); goto(4);
          }} className="mt-5 w-full rounded-2xl bg-[#0b5cff] px-5 py-4 text-sm font-black text-white sm:w-auto sm:px-8">{t.steps.continue}</button>
        </div>
      )}
      {st === 4 && (
        <div className="mt-6">
          <p className="text-sm text-slate-500">{t.intent.text}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insuranceIntents.map(({ code, icon: Icon }) => {
              const active = buy.intent === code;
              return (
                <button key={code} type="button" aria-pressed={active} onClick={() => { setBuy("intent", code); setErr(""); onIntent?.(code); }}
                  className={`flex min-h-[72px] items-center gap-3 rounded-3xl border p-4 text-left text-sm font-black transition hover:-translate-y-0.5 ${active ? "border-[#0b5cff] bg-blue-50 ring-2 ring-[#0b5cff]/25" : "border-slate-200 bg-white"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${active ? "bg-[#0b5cff] text-white" : "bg-slate-100 text-[#0b5cff]"}`}><Icon size={18} /></span>
                  <span>{intentLabel(code, t.intent[code])}</span>
                </button>
              );
            })}
          </div>
          <ErrorBox error={error} />
          <button type="button" onClick={() => {
            if (!buy.intent) return setErr(t.intent.errPick);
            setErr(""); goto(5);
          }} className="mt-5 w-full rounded-2xl bg-[#0b5cff] px-5 py-4 text-sm font-black text-white sm:w-auto sm:px-8">{t.steps.continue}</button>
        </div>
      )}

      {st === 5 && (
        <div className="mt-6">
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5">
            <p className="text-sm font-bold leading-6 text-slate-800">{t.options.contactForOptions}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{t.options.finalDecision}</p>
          </div>
          <p className="label mt-5">{t.options.providersTitle}</p>
          <div className="flex flex-wrap gap-2">
            {providers.map((p: any, i: number) => <span key={`${p.name}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-black text-slate-700">{p.name}</span>)}
          </div>
          <p className="mt-3 text-[11px] leading-5 text-slate-400">{t.options.providersNote}</p>
          <button type="button" onClick={() => goto(6)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0b5cff] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20">
            {t.options.cta}<ArrowRight size={17} />
          </button>
        </div>
      )}
      {st === 6 && (
        <div className="mt-6">
          <p className="label">{t.review.yourInfo}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {isVehicle && <Review label={t.review.reg} value={buy.registrationNo} />}
            {isVehicle && (buy.vehicleMake || buy.vehicleModel) && <Review label={t.review.vehicle} value={`${buy.vehicleMake} ${buy.vehicleModel}`.trim()} />}
            {buy.policyExpiryDate && <Review label={t.review.expiry} value={formatDate(buy.policyExpiryDate)} />}
            <Review label={t.review.name} value={buy.customerName} />
            <Review label={t.review.mobile} value={buy.mobile} />
            <Review label={t.review.category} value={categoryName(category, category)} />
            <Review label={t.review.need} value={buy.intent ? intentLabel(buy.intent, t.intent[buy.intent as keyof typeof t.intent] || buy.intent) : ""} />
          </div>

          <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4" open={more} onToggle={e => setMore((e.currentTarget as HTMLDetailsElement).open)}>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black">{t.review.extra} <ChevronRight size={17} /></summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t.review.email}><input className="input" value={buy.email} onChange={e => setBuy("email", e.target.value)} placeholder="you@example.com" type="email" autoComplete="email" /></Field>
              <Field label={t.review.prevInsurer}><input className="input" value={buy.previousInsurer} onChange={e => setBuy("previousInsurer", e.target.value)} placeholder={t.review.prevInsurerPh} /></Field>
              <Field label={t.review.usage}><select className="input" value={buy.vehicleUsage} onChange={e => setBuy("vehicleUsage", e.target.value)}>{usageTypes.map(v => <option key={v} value={v}>{v}</option>)}</select></Field>
              <Field label={t.review.claimLast}><select className="input" value={buy.claimLastYear} onChange={e => setBuy("claimLastYear", e.target.value)}><option value="No">{t.review.no}</option><option value="Yes">{t.review.yes}</option><option value="Not sure">{t.review.notSure}</option></select></Field>
              {isVehicle && <Field label={t.review.expiryDate}><input className="input" value={buy.policyExpiryDate} onChange={e => setBuy("policyExpiryDate", e.target.value)} type="date" /></Field>}
              {isVehicle && <><ManualVehicleFields buy={buy} setBuy={setBuy} /></>}
            </div>
          </details>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
            <input type="checkbox" checked={buy.consentStatus} onChange={e => setBuy("consentStatus", e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
            <span className="text-xs leading-5 text-slate-600">{t.review.consent}</span>
          </label>

          <ErrorBox error={error} />
          <button type="button" onClick={onSubmit} disabled={saving} className="mt-5 flex w-full items-center justify-center rounded-2xl bg-[#0b5cff] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 disabled:opacity-60">
            {saving ? t.review.submitting : t.review.submit}<ArrowRight className="ml-2" size={17} />
          </button>
          <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">{t.review.noObligation}</p>
        </div>
      )}
    </div>
  );
}




