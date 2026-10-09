# Insurance + Claim Assistance Funnel

A mobile-first React/Vite insurance landing page designed around two customer journeys:

1. **Buy / Renew Insurance** — vehicle-number lookup, available vehicle/policy data, policy-expiry visibility, insurance request and handoff to the authorized provider.
2. **Claim Assistance** — a separate claim-support form for existing policyholders.

## Architecture

Meta/Instagram Ads → category landing page → vehicle number → server-side RC lookup → customer verification → insurance request → authorized insurer/provider payment flow.

Claim campaign → `?tab=claim` → claim assistance form → Google Sheet.

The MVP backend uses Vercel serverless endpoints → Google Apps Script → Google Sheets. No Google service-account credentials are required.

## Vehicle lookup

The included adapter uses API Sathi's Vehicle RC Verification endpoint. Its public documentation states that the endpoint accepts an RC number and can return fields including maker/model, fuel type, vehicle class, registration date and `insurance_upto`. Keep the API key server-side in `API_SATHI_KEY`.

If you use another legitimate provider, replace only `api/vehicle-lookup.ts` while preserving the normalized response contract.

## Environment variables

Public:

- `VITE_BRAND_NAME`
- `VITE_LEAD_ENDPOINT=/api/leads`
- `VITE_CLAIM_ENDPOINT=/api/claims`
- `VITE_VEHICLE_LOOKUP_ENDPOINT=/api/vehicle-lookup`
- `VITE_META_PIXEL_ID` (optional)
- `VITE_CLARITY_PROJECT_ID` (optional)

Server-only:

- `GOOGLE_APPS_SCRIPT_URL`
- `API_SATHI_KEY`

Never use `VITE_` for secrets.

## Google Sheets setup

See `google-apps-script/Code.gs` and its README.

The provided Drive folder ID is configured in Apps Script as:
`1H4gFi2Pt1KYzfHLuB34pWOknGyKYh3yO`

Keep the folder private. The current MVP does not upload sensitive documents; it records availability only.

## Important insurance/compliance rules

- Do not claim guaranteed cheapest pricing, approval, payout or settlement.
- Do not fabricate discounts, testimonials, ratings, scarcity or customer counts.
- Final premium, eligibility, coverage, exclusions and policy issuance are determined by the respective insurer/provider.
- Customer payment should be completed through the official insurer/provider payment flow.
- Do not send phone numbers, vehicle numbers, policy numbers, claim descriptions or documents to Meta Pixel.
- Replace placeholder legal/business information before launch.

## Testing before ads

Run:

```bash
npm install
npm run build
```

Then manually test on mobile and desktop:

- Buy/Renew tab
- Claim Assistance tab
- valid vehicle number
- invalid vehicle number
- API unavailable fallback
- vehicle details auto-fill
- policy expiry auto-fill
- expired / upcoming expiry states
- manual edits
- consent validation
- lead/claim submission
- Google Sheet rows
- no secret in browser bundle
- no fake claims or urgency

## What is intentionally not included

- Direct customer payment collection
- Fake live premiums
- Fake testimonials
- Automatic policy issuance
- Guaranteed claim settlement
- Public document storage

Those require verified provider integrations and appropriate authorization.


## Vehicle lookup (live API)
The vehicle lookup adapter uses API Sathi's Vehicle RC Verification endpoint. Its current documentation specifies `POST https://apisathi.in/gw/v1/vehicle-rc-v1/`, `X-API-Key`, and fields including `maker_model`, `fuel_type`, `vehicle_class`, `registration_date`, and `insurance_upto`. A production `live_` key is required for real verification; sandbox/test responses are mock data and must not be treated as real verification.

Set the server-only Vercel variable `API_SATHI_KEY` to your live key. Never expose it as a `VITE_` variable.

## Authorized insurer/provider logos
The UI intentionally does not fabricate insurer partnerships. Set `VITE_AUTHORIZED_PROVIDER_NAMES` to a comma-separated list of insurer/provider names you are genuinely authorized to represent. If you have official logo assets and permission to use them, add those assets separately and keep the same rule: never imply a partnership or authorization that does not exist.

## CRO launch gate
Before Meta Ads go live, test: mobile 360/390/430 widths, desktop 1440px, vehicle lookup success/failure/partial data, policy expiry available/unavailable/expired, manual fallback, claim tab, consent, duplicate submissions, Google Sheet delivery, API-key secrecy, privacy/terms links, and the real official insurer payment handoff. Do not launch while the backend is in fallback/localStorage mode.
