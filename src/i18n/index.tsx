// Centralised translation system for InsureAssist.
// Default language is English. Hindi is opt-in and persisted locally.
// Lightweight: plain objects, no translation library, no network calls,
// instant client-side switching with zero form-state loss.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type EnDict } from "./en";
import { hi } from "./hi";

export type Lang = "en" | "hi";

const STORE_KEY = "insureassist_lang";

const dicts: Record<Lang, EnDict> = { en, hi };

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

/** Category SEO titles stay English-first (primary/default page language). */
function seoFor(lang: Lang, category: string, brand: string): { title: string; desc: string } {
  const titles: Record<string, string> = {
    car: `Car Insurance | Check Insurance Options | ${brand}`,
    bike: `Bike Insurance | Check Insurance Options | ${brand}`,
    commercial: `Commercial Vehicle Insurance | Check Insurance Options | ${brand}`,
    tractor: `Tractor Insurance | Check Insurance Options | ${brand}`,
  };
  const descsEn: Record<string, string> = {
    car: "Enter your vehicle number to check car insurance options. Where available, vehicle and policy details are pre-filled automatically.",
    bike: "Enter your vehicle number to check bike insurance options. Where available, vehicle and policy details are pre-filled automatically.",
    commercial:
      "Enter your vehicle number to check commercial vehicle insurance options. Assistance for taxi, pickup, truck and bus.",
    tractor:
      "Enter your vehicle number to check tractor insurance options. Where available, vehicle and policy details are pre-filled automatically.",
  };
  const descsHi: Record<string, string> = {
    car: "गाड़ी का नंबर डालकर कार इंश्योरेंस के विकल्प जांचें। उपलब्ध होने पर वाहन और पॉलिसी की जानकारी अपने आप भर जाती है।",
    bike: "गाड़ी का नंबर डालकर बाइक इंश्योरेंस के विकल्प जांचें। उपलब्ध होने पर वाहन और पॉलिसी की जानकारी अपने आप भर जाती है।",
    commercial:
      "गाड़ी का नंबर डालकर कमर्शियल वाहन इंश्योरेंस के विकल्प जांचें। टैक्सी, पिकअप, ट्रक और बस के लिए सहायता उपलब्ध है।",
    tractor:
      "गाड़ी का नंबर डालकर ट्रैक्टर इंश्योरेंस के विकल्प जांचें। उपलब्ध होने पर वाहन और पॉलिसी की जानकारी अपने आप भर जाती है।",
  };
  const fallbackEn =
    "Enter your vehicle number — where available, vehicle and policy details are pre-filled automatically. Insurance options and claim help available.";
  const fallbackHi =
    "गाड़ी नंबर डालें — उपलब्ध होने पर वाहन और पॉलिसी की जानकारी अपने आप भर जाएगी। इंश्योरेंस विकल्प और क्लेम में मदद उपलब्ध है।";
  return {
    title: titles[category] || `${brand} — Insurance & Claim Assistance`,
    desc: (lang === "hi" ? descsHi[category] : descsEn[category]) || (lang === "hi" ? fallbackHi : fallbackEn),
  };
}

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: EnDict;
  categoryName: (id: string, fallback: string) => string;
  categoryDesc: (id: string, fallback?: string) => string;
  intentLabel: (code: string, fallback: string) => string;
  claimTypeLabel: (value: string) => string;
  applyLangSeo: (category: string, brand: string) => void;
};

const Ctx = createContext<LangCtx | null>(null);


// Language maps live in the en.ts and hi.ts dictionaries (see their
// categoryHi, intentHi and claimTypeHi keys) and are selected by the active
// language at runtime. No hardcoded display Hindi remains here.

export function titleCase(s: string) {
  return (s || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  // Hydrate from storage after mount (default stays English for first visit).
  useEffect(() => {
    setLangState(readStored());
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORE_KEY, l);
    } catch {
      /* storage unavailable — session-only */
    }
  }, []);

  const t = dicts[lang];

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang,
      t,
      categoryName: (id: string, fallback: string) =>
        lang === "hi"
          ? (hi.categoryHi as Record<string, string>)[id] || fallback
          : (en.categoryHi as Record<string, string>)[id] || titleCase(fallback || id),
      categoryDesc: (id: string, fallback?: string) =>
        (dicts[lang].catDesc as Record<string, string>)[id] || fallback || "",
      intentLabel: (code: string, fallback: string) =>
        lang === "hi"
          ? (hi.intentHi as Record<string, string>)[code] || fallback
          : (en.intentHi as Record<string, string>)[code] || fallback,
      claimTypeLabel: (value: string) =>
        lang === "hi"
          ? (hi.claimTypeHi as Record<string, string>)[value] || value
          : (en.claimTypeHi as Record<string, string>)[value] || value,
      applyLangSeo: (category: string, brand: string) => {
        const { title, desc } = seoFor(lang, category, brand);
        document.documentElement.lang = lang === "hi" ? "hi" : "en";
        document.title = title;
        const setMeta = (attr: "name" | "property", key: string, content: string) => {
          const sel = `meta[${attr}="${key}"]`;
          let el = document.head.querySelector<HTMLMetaElement>(sel);
          if (!el) {
            el = document.createElement("meta");
            el.setAttribute(attr, key);
            document.head.appendChild(el);
          }
          el.content = content;
        };
        setMeta("name", "description", desc);
        setMeta("property", "og:title", title);
        setMeta("property", "og:description", desc);
      },
    }),
    [lang, setLang, t]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}
