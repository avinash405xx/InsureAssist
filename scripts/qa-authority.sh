#!/usr/bin/env bash
set -euo pipefail
fail=0
req=(src/App.tsx src/config.ts src/lib.ts src/types.ts api/vehicle-lookup.ts api/leads.ts api/claims.ts google-apps-script/Code.gs .env.example FINAL_AUTHORITY_CHECKLIST.md public/provider-logos/README.md)
for f in "${req[@]}"; do
  if [[ -f "$f" ]]; then echo "PASS file: $f"; else echo "FAIL file: $f"; fail=1; fi
done

grep -q 'apisathi.in/gw/v1/vehicle-rc-v1/' api/vehicle-lookup.ts && echo 'PASS API Sathi endpoint' || { echo 'FAIL API Sathi endpoint'; fail=1; }
grep -q 'insurance_upto' api/vehicle-lookup.ts && echo 'PASS insurance expiry mapping' || { echo 'FAIL insurance expiry mapping'; fail=1; }
grep -q 'X-API-Key' api/vehicle-lookup.ts && echo 'PASS server API key header' || { echo 'FAIL server API key header'; fail=1; }
if grep -RInE 'VITE_.*(KEY|SECRET|TOKEN|PASSWORD)' src api google-apps-script --exclude='*.zip'; then echo 'FAIL possible frontend secret'; fail=1; else echo 'PASS no obvious VITE secret variable'; fi
grep -q 'authorizedProviders' src/config.ts && echo 'PASS provider logo config' || { echo 'FAIL provider logo config'; fail=1; }
grep -q 'loading="lazy"' src/App.tsx && echo 'PASS provider logo lazy loading' || { echo 'FAIL provider logo lazy loading'; fail=1; }
grep -q 'No obligation to buy' src/App.tsx && grep -q 'final quote and policy are issued' src/App.tsx && echo 'PASS transparent sales copy' || { echo 'FAIL transparent sales copy'; fail=1; }

echo "Authority static QA result: $([[ $fail -eq 0 ]] && echo PASS || echo FAIL)"
exit "$fail"
