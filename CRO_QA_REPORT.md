# Final CRO + Customer Trust QA Report

## Scope
Reviewed the final insurance funnel from a customer, CRO, trust, product, analytics, security and operations perspective.

## Customer journey
1. Meta/Instagram ad lands on category-relevant insurance experience.
2. Customer chooses BUY / RENEW or CLAIM ASSISTANCE.
3. For vehicle insurance, customer enters registration number.
4. Server-side RC verification attempts to pre-fill vehicle data and insurance expiry where returned.
5. Customer verifies or edits returned data.
6. Customer provides name/mobile and consent.
7. Lead is sent to Vercel -> Google Apps Script -> private Google Sheet.
8. Team follows up and obtains the applicable insurer/provider quotation.
9. Customer completes payment through the official insurer/provider flow.
10. Existing customers can use the separate Claim Assistance tab.

## CRO checks
- [x] Primary purpose is insurance purchase/renewal, not generic lead collection.
- [x] Claim Assistance is a separate first-class journey.
- [x] Vehicle number is the lowest-friction starting point for vehicle products.
- [x] Vehicle details can be pre-filled when the connected API returns them.
- [x] Policy expiry is shown when the connected API returns `insurance_upto`.
- [x] Returned data is explicitly presented for customer verification.
- [x] Manual fallback exists when lookup fails.
- [x] No fake urgency, countdown, testimonials, ratings or discount claims.
- [x] CTA language is purchase-oriented: Check & Buy Insurance / Continue to Insurance.
- [x] Mobile sticky CTA exists.
- [x] Category intent can be passed through `?type=car`, `?type=bike`, `?type=commercial`, etc.
- [x] Claim intent can be deep-linked with `?tab=claim`.
- [x] FAQ addresses key objections before submission.
- [x] Policy/claim decisions are clearly attributed to the insurer.

## Trust checks
- [x] Brand identity is configurable through environment variables.
- [x] Insurer/provider display is configurable and does not fabricate partnerships by default.
- [x] API key is server-only.
- [x] Customer payment is not collected by this frontend.
- [x] Sensitive documents are not sent to Meta Pixel/Clarity.
- [x] Google Drive folder is documented as private.
- [x] Consent is captured before lead/claim submission.

## Technical checks
- [x] API Sathi adapter uses the documented trailing-slash endpoint.
- [x] `X-API-Key` is used server-side.
- [x] `rc_number` is normalized and validated.
- [x] `insurance_upto` is mapped to policy expiry.
- [x] Provider abstraction is isolated in `api/vehicle-lookup.ts`.
- [x] Vercel proxy keeps API credentials away from the browser.
- [x] Google Apps Script remains the MVP source-of-truth writer.
- [x] Lead and claim tabs have separate sheets.

## Launch blockers (must be completed before paid traffic)
1. Set a real `VITE_BRAND_NAME` and legal/business identity.
2. Set `API_SATHI_KEY` to a production/live key and validate real Maharashtra vehicles. Test keys return mock data and are not evidence of live verification.
3. Set `GOOGLE_APPS_SCRIPT_URL` in Vercel and configure `SHEET_ID` in Apps Script.
4. Add only insurer/provider names and logos you are actually authorized to display.
5. Add your real Privacy Policy, Terms, contact details and valid authorization/registration disclosures.
6. Confirm the actual official insurer/provider purchase/payment handoff used by the business.
7. Run end-to-end tests with real backend services before enabling Meta campaigns.

## Build validation limitation
The repository was inspected and TypeScript was invoked. The local environment did not have npm dependencies installed, and network installation timed out, so a clean `npm run build` could not be completed in this environment. No claim of successful production build is made.

## API evidence
API Sathi's current public Vehicle RC Verification documentation specifies `POST https://apisathi.in/gw/v1/vehicle-rc-v1/`, `X-API-Key`, and normalized response fields including `maker_model`, `fuel_type`, `vehicle_class`, `registration_date`, and `insurance_upto`.
