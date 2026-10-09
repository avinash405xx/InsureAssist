#!/usr/bin/env bash
set -e
printf 'Checking required files...\n'
for f in package.json src/App.tsx src/lib.ts src/config.ts src/types.ts api/leads.ts api/claims.ts api/vehicle-lookup.ts google-apps-script/Code.gs .env.example README.md CRO_QA_REPORT.md; do
  test -f "$f" && echo "OK $f"
done
printf 'Checking for obvious frontend secret variable names...\n'
if grep -R "VITE_.*KEY\|VITE_.*SECRET\|PRIVATE_KEY" -n src .env.example; then
  echo 'FAIL: possible secret exposed'
  exit 1
else
  echo 'OK no obvious VITE secret variable names found'
fi
printf 'Checking vehicle lookup endpoint...\n'
grep -q 'apisathi.in/gw/v1/vehicle-rc-v1/' api/vehicle-lookup.ts && echo 'OK API Sathi endpoint'
printf 'Checking policy expiry mapping...\n'
grep -q 'insurance_upto' api/vehicle-lookup.ts && echo 'OK insurance_upto mapping'
