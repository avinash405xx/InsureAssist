# Final Authority QA — Insurance Lead / Quote Funnel

This is the pre-launch gate. Passing static checks does **not** mean the site is legally or operationally ready for paid traffic.

## 1. Customer journey / CRO
- [ ] Ad-to-page message matches the insurance category advertised.
- [ ] First screen makes Buy/Renew and Claim Assistance obvious.
- [ ] Vehicle-number entry is above the fold for vehicle campaigns.
- [ ] Lookup loading state is visible and button is disabled during request.
- [ ] Lookup success shows returned data for customer verification.
- [ ] Lookup failure has manual fallback and does not dead-end.
- [ ] Insurance expiry is factual only; no fake urgency.
- [ ] CTA explains the next action and does not imply guaranteed approval.
- [ ] Mobile sticky CTA is tested on real iPhone/Android widths.
- [ ] Category deep links preserve intent (`type=...`).
- [ ] Claim deep link works (`tab=claim`).
- [ ] Success state gives a reference ID.
- [ ] No forced purchase after lead submission.

## 2. Provider / brand authority
- [ ] Every insurer shown on the site is actually available through the user's authorized channel.
- [ ] Logo use is permitted under the applicable brand/channel agreement.
- [ ] No insurer is called a "partner" unless the relationship is accurate and supportable.
- [ ] Provider logos are supplied as approved assets, not random image-search copies.
- [ ] Provider availability disclaimer is visible.
- [ ] Quote cards use actual returned quotation data only.
- [ ] Provider payment handoff is an official/authorized payment route.
- [ ] No claim that the site itself issues the policy unless legally/operationally true.

## 3. Vehicle API
- [ ] Production API key is server-side only.
- [ ] Test key is not used in production.
- [ ] Real Maharashtra registration numbers have been tested.
- [ ] Invalid registration handling is tested.
- [ ] API timeout handling is tested.
- [ ] API rate-limit/error handling is tested.
- [ ] `insurance_upto` mapping is verified against live responses.
- [ ] Customer is asked to verify API-returned details.
- [ ] No sensitive API response is unnecessarily logged.

## 4. Lead / claim operations
- [ ] Vercel lead endpoint is live.
- [ ] Google Apps Script URL is configured.
- [ ] Correct Sheet ID is configured.
- [ ] Leads tab receives a complete row.
- [ ] Claims tab receives a complete row.
- [ ] Duplicate submission behavior is understood.
- [ ] Assignment/follow-up process exists.
- [ ] Quote status and policy status are updated operationally.
- [ ] Payment/policy number is entered only after real provider confirmation.

## 5. Privacy / security
- [ ] Privacy Policy is real and accessible.
- [ ] Terms are real and accessible.
- [ ] Business/contact identity is accurate.
- [ ] Applicable authorization/registration disclosures are accurate.
- [ ] API secrets are never prefixed with `VITE_`.
- [ ] No secrets are committed to Git.
- [ ] Google Drive folder containing sensitive material is private.
- [ ] Sensitive documents are not stored in a public Sheet.
- [ ] Aadhaar/RC/card data is not sent to Meta Pixel or Clarity.
- [ ] Access to Sheets/Drive is restricted to necessary operators.

## 6. Analytics / Meta
- [ ] Pixel ID is real and production-only.
- [ ] Clarity ID is real and production-only.
- [ ] Events represent actual user actions.
- [ ] No fake Purchase event is fired when payment happens externally.
- [ ] No phone, vehicle number, policy number or claim description is sent as event payload.
- [ ] UTM parameters are captured and persisted through lead/claim submission.
- [ ] Test traffic is separated from campaign reporting.

## 7. Claims
- [ ] Claim form is clearly separate from purchase flow.
- [ ] No promise of claim approval/settlement.
- [ ] Claim type and incident date are captured.
- [ ] Insurer remains the decision-maker.
- [ ] Claim reference/status is recorded when actually available.

## 8. Performance / accessibility
- [ ] Production build passes on a clean install.
- [ ] No console errors on core flow.
- [ ] Images are optimized.
- [ ] Buttons have accessible labels.
- [ ] Inputs have labels and validation messages.
- [ ] Keyboard navigation works.
- [ ] Contrast is readable.
- [ ] Mobile page does not shift badly while loading.
- [ ] Core flow works on slow mobile network.

## 9. Anti-fraud / anti-hype
- [ ] No fake discount.
- [ ] No fake countdown.
- [ ] No fake testimonials.
- [ ] No fake ratings/reviews.
- [ ] No fake scarcity.
- [ ] No "guaranteed cheapest" unless provable and approved.
- [ ] No "instant approval" unless actually guaranteed.
- [ ] No invented insurer relationships.
- [ ] No invented sales numbers.

## 10. Final human acceptance test
Run the full flow with a real test vehicle:
1. Meta test URL -> landing page.
2. Enter registration number.
3. Verify API response.
4. Confirm expiry display.
5. Correct one field manually.
6. Submit with consent.
7. Confirm Sheet row.
8. Confirm UTM attribution.
9. Confirm internal follow-up.
10. Obtain a real provider quote through the authorized channel.
11. Complete provider payment in the official flow.
12. Confirm policy issuance.
13. Test claim flow separately.
14. Confirm no secret/sensitive data appears in browser logs or analytics.

**Launch rule:** If any mandatory item is unchecked, do not scale Meta spend. Fix, retest, and record evidence.
