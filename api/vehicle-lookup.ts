// Server-side vehicle lookup adapter.
// Recommended first provider: API Sathi Vehicle RC Verification.
// Docs: https://apisathi.in/docs/products/vehicle-rc-v1/
// Keep API_SATHI_KEY server-side only.

function normalizeRegistration(value: string) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function pick(obj: any, keys: string[]) {
  for (const key of keys) {
    const value = key.split(".").reduce((acc, part) => acc?.[part], obj);
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return "";
}

function mapVehicleType(vehicleClass: string, model: string) {
  const s = `${vehicleClass} ${model}`.toLowerCase();
  if (s.includes("motorcycle") || s.includes("motor cycle")) return "Bike";
  if (s.includes("scooter")) return "Scooter";
  if (s.includes("three") || s.includes("3w")) return "Three Wheeler / Auto";
  if (s.includes("taxi") || s.includes("cab")) return "Taxi / Cab";
  if (s.includes("bus")) return "Bus";
  if (s.includes("tractor")) return "Tractor";
  if (s.includes("truck") || s.includes("goods")) return "Truck";
  return "Private Car";
}

function splitMakerModel(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return { make: "", model: "" };
  const parts = cleaned.split(/\s+/);
  return { make: parts[0] || "", model: parts.slice(1).join(" ") };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const registrationNumber = normalizeRegistration(req.body?.registrationNumber);
  if (!/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/.test(registrationNumber)) return res.status(400).json({ error: "Please enter a valid Indian vehicle registration number." });

  const key = process.env.API_SATHI_KEY;
  if (!key) return res.status(503).json({ error: "Vehicle lookup is not configured yet." });

  try {
    const response = await fetch("https://apisathi.in/gw/v1/vehicle-rc-v1/", {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json", "Idempotency-Key": `vehicle-${registrationNumber}` },
      body: JSON.stringify({ rc_number: registrationNumber }),
    });
    const raw = await response.json().catch(() => ({}));
    if (!response.ok || raw?.verified === false) return res.status(404).json({ error: "Vehicle details could not be verified.", provider: "api-sathi" });

    const makerModel = pick(raw, ["maker_model", "makerModel", "vehicle.maker_model"]);
    const split = splitMakerModel(makerModel);
    const vehicleClass = pick(raw, ["vehicle_class", "vehicleClass"]);
    const insuranceExpiryDate = pick(raw, ["insurance_upto", "insuranceUpto", "insurance.valid_upto"]);
    const insuranceStartDate = pick(raw, ["insurance_from", "insuranceFrom", "insurance.valid_from"]);

    return res.status(200).json({
      ok: true,
      status: "SUCCESS",
      provider: "api-sathi",
      vehicle: {
        registrationNo: pick(raw, ["rc_number"]) || registrationNumber,
        make: split.make,
        model: split.model,
        variant: "",
        fuel: pick(raw, ["fuel_type", "fuelType"]),
        vehicleClass,
        vehicleType: mapVehicleType(vehicleClass, makerModel),
        year: pick(raw, ["manufacturing_year", "manufacturingYear", "registration_date"])?.slice(0, 4) || "",
        registrationDate: pick(raw, ["registration_date", "registrationDate"]),
        ownerName: pick(raw, ["owner_name", "ownerName"]),
        insurer: pick(raw, ["insurance_provider", "insuranceProvider", "insurer"]),
        insuranceStartDate,
        insuranceExpiryDate,
        fitnessUpto: pick(raw, ["fitness_upto", "fitnessUpto"]),
      },
    });
  } catch (error) {
    console.error("vehicle_lookup_error", error);
    return res.status(502).json({ error: "Vehicle verification service is temporarily unavailable." });
  }
}
