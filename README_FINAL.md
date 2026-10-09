# Final CRO / Authority Edition

This package is the hardened pre-launch edition of the insurance funnel.

It includes:
- vehicle-number-first purchase/renewal flow
- server-side API Sathi vehicle RC lookup adapter
- insurance expiry mapping
- manual fallback when lookup fails
- separate claim assistance flow
- Vercel -> Google Apps Script -> Google Sheet lead/claim pipeline
- UTM attribution
- Meta/Clarity event hooks without sending sensitive identifiers
- configurable authorized insurer/provider names and logo assets
- production launch and authority QA checklist
- static authority QA script

## Important
This repository cannot prove your legal/brand authorization. Add only provider names and logos you are authorized to display.

It also cannot prove production build success until dependencies are installed and `npm run build` is run in a clean environment.

## Provider logos
Use `VITE_AUTHORIZED_PROVIDERS_JSON`, for example:

`[{"name":"Bajaj General","logo":"/provider-logos/bajaj-general.svg"}]`

Put approved logo files under `public/provider-logos/`.

## Required before Meta traffic
1. Production API Sathi live key.
2. Vercel `GOOGLE_APPS_SCRIPT_URL`.
3. Apps Script `SHEET_ID`.
4. Real brand/legal identity.
5. Approved provider names/logos.
6. Privacy/Terms/contact/authorization disclosures.
7. Official quote/payment handoff.
8. Clean-install production build.
9. Real-device end-to-end test.

Run static QA with:

`bash scripts/qa-authority.sh`

## Sales-angle benchmark
This build is optimized around the live patterns observed on Policybazaar, InsuranceDekho and Coverfox: vehicle-number-first entry, short quote journeys, provider/plan visibility, and explicit process explanation. It does not copy their branding or unsupported claims.
