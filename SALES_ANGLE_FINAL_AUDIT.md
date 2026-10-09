# Final Sales-Angle Audit

## Benchmark set
- Policybazaar: vehicle-number-first, insurer count/trust proof, comparison positioning.
- InsuranceDekho: vehicle number -> name/mobile -> quotes; plan cards with insurer/features/price.
- Coverfox: registration -> policy details -> compare -> coverage/add-ons -> payment; process education.

## Decisions carried into this build
1. First screen asks for vehicle number; no long form before the first action.
2. Headline directly states the outcome: check insurance options.
3. Provider visibility is placed immediately after the hero, not buried below categories.
4. Provider cards use logo + name together where a logo asset/domain is configured.
5. Name + mobile are the only required contact fields in the buy flow; extra fields are progressive disclosure.
6. Vehicle verification is a convenience, not a hard gate; manual fallback remains available.
7. No unsupported customer counts, star ratings, savings, discounts, scarcity, or profitability claims.
8. Actual premium/quote values must come from the authorized quote source; the UI does not fabricate prices.
9. CTA language is action-oriented without promising approval or a specific premium.
10. Mobile sticky CTA retained; analytics load is deferred to avoid competing with initial render.

## 5-second customer test
A new Meta visitor should be able to answer:
- What is this? Insurance purchase/renewal and claim assistance.
- What do I do? Enter vehicle number.
- What happens? Available vehicle/policy details are checked and options can be reviewed.
- Why trust it? Provider visibility, clear handoff, no-obligation language and transparent insurer decision ownership.

## Hard launch gates
- Configure real brand/business identity and legal disclosures.
- Use only provider marks you are authorized to display.
- Configure live API_SATHI_KEY and verify real vehicle lookups.
- Configure Google Apps Script + Sheet and test lead/claim writes.
- Connect a real authorized quote/payment handoff before claiming customers can buy.
- Run production Lighthouse/mobile performance test after deployment.
