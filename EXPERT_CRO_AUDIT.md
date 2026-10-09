# Final Expert CRO Audit

This build was reviewed through eight practical lenses before the final pass:

1. **CRO / performance marketing:** Meta traffic should reach the vehicle-number action immediately; the hero now includes a vehicle-number entry point instead of forcing a scroll.
2. **UX / mobile:** The first action is one field; contact capture is reduced to name + mobile, while lower-value fields are behind optional details.
3. **Trust / conversion:** Provider marks are visible early, alongside clear statements that availability depends on eligibility and that the insurer issues the policy.
4. **Insurance compliance:** No fake savings, rankings, claim guarantees, testimonials, scarcity or invented partner claims. Insurer/provider remains responsible for final premium, coverage, eligibility and issuance.
5. **Sales operations:** Lead capture remains compatible with the existing Vercel → Apps Script → Sheets flow and UTM attribution.
6. **Technical/security:** Vehicle API remains server-side; no API key is exposed in VITE variables. Sensitive documents are not uploaded to public storage.
7. **Competitive benchmark:** Current Policybazaar, InsuranceDekho and Coverfox pages were reviewed. Common high-conversion patterns include vehicle-number entry, visible provider/plan comparison, a short initial form, clear process steps and strong trust/claims messaging.
8. **Fallback/resilience:** Vehicle lookup failure still allows manual entry; no API result is fabricated.

## Final decision

The strongest remaining conversion risk is not visual polish; it is **proof of actual quote availability**. The page must not imply that a customer can see a live premium unless the authorized quotation flow/API is connected. Until then, provider cards are trust/availability signals, while the actual quote is handled at quotation stage.

## Launch gates

- Use only insurer/provider marks you are authorized to display.
- Replace the default provider list with your exact authorized distribution list if it differs.
- Add real legal business identity, applicable IRDAI registration/licence disclosure, privacy policy and terms before paid traffic.
- Set the production API Sathi live key server-side and test real Indian registrations.
- Connect the Google Apps Script URL and Sheet ID.
- Connect the official provider quotation/payment handoff.
- Run mobile QA on real devices and a clean production build before advertising.
