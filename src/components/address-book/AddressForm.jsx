"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addressFrom } from "@/lib/db/family";
import { parseAddress } from "@/lib/validation/address";
import { lookupPincode, validatePincode } from "@/lib/pincode";
import { extractCoordinates, mapsLink } from "@/lib/parseGeo";
import { normalizePhone, displayPhone } from "@/lib/phone";
import { DISTRICTS, STATES } from "@/lib/data/locations";
import { MonoLabel } from "@/components/sheet";

const SELECT =
  "h-9 w-full border border-input bg-transparent px-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ochre";

function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mono-caption mb-1.5 block">
        {label}
      </Label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] text-stamp">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export function AddressForm({ member, onSave, busy, submitLabel = "Save address", showNotify = true }) {
  const [values, setValues] = useState(() => addressFrom(member));
  const [errors, setErrors] = useState({});
  const [notify, setNotify] = useState(true);
  const [areas, setAreas] = useState([]);
  const [pincodeNote, setPincodeNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(addressFrom(member));
    setErrors({});
    setAreas([]);
    setPincodeNote("");
  }, [member?.id]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function fillFromPincode() {
    if (!validatePincode(values.pincode)) return;
    setPincodeNote("Looking up…");
    const info = await lookupPincode(values.pincode);
    if (!info) {
      setPincodeNote("No match for this pincode — fill the district yourself.");
      return;
    }
    setAreas(Array.isArray(info.areas) ? info.areas : info.area ? [info.area] : []);
    setValues((current) => ({
      ...current,
      city: current.city || info.area || "",
      district: info.district || current.district,
      state: info.state || current.state
    }));
    setPincodeNote([info.area, info.district, info.state].filter(Boolean).join(" · "));
  }

  function readMapLink() {
    const coords = extractCoordinates(values.googleMapUrl);
    if (coords) {
      setValues((current) => ({ ...current, ...coords }));
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setValues((current) => ({
          ...current,
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6))
        }));
      },
      () => setPincodeNote("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function submit(event) {
    event.preventDefault();
    const parsed = parseAddress(values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSave(parsed.data, { notify });
    } finally {
      setSaving(false);
    }
  }

  const hasCoords = values.latitude !== null && values.longitude !== null;

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Pincode" htmlFor={`${member?.id}-pincode`} error={errors.pincode} hint={pincodeNote || "6 digits — fills district and state"}>
          <Input
            id={`${member?.id}-pincode`}
            inputMode="numeric"
            maxLength={6}
            value={values.pincode}
            onChange={(event) => update("pincode", event.target.value.replace(/\D/g, ""))}
            onBlur={fillFromPincode}
            className="font-mono tracking-[0.2em]"
            aria-invalid={Boolean(errors.pincode)}
          />
        </Field>

        <Field label="Area / city" htmlFor={`${member?.id}-city`} error={errors.city}>
          <Input
            id={`${member?.id}-city`}
            list={`${member?.id}-areas`}
            value={values.city}
            onChange={(event) => update("city", event.target.value)}
            aria-invalid={Boolean(errors.city)}
          />
          <datalist id={`${member?.id}-areas`}>
            {areas.map((area) => (
              <option key={area} value={area} />
            ))}
          </datalist>
        </Field>

        <Field label="District" htmlFor={`${member?.id}-district`} error={errors.district}>
          <select
            id={`${member?.id}-district`}
            className={SELECT}
            value={values.district}
            onChange={(event) => update("district", event.target.value)}
            aria-invalid={Boolean(errors.district)}
          >
            <option value="">Choose a district</option>
            {[...new Set([...(DISTRICTS[values.state] || []), values.district].filter(Boolean))].map(
              (district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              )
            )}
          </select>
        </Field>

        <Field label="State" htmlFor={`${member?.id}-state`} error={errors.state}>
          <select
            id={`${member?.id}-state`}
            className={SELECT}
            value={values.state}
            onChange={(event) => update("state", event.target.value)}
            aria-invalid={Boolean(errors.state)}
          >
            <option value="">Choose a state</option>
            {STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </Field>

        <Field label="House / street" htmlFor={`${member?.id}-line1`} className="sm:col-span-2">
          <Input
            id={`${member?.id}-line1`}
            value={values.addressLine1}
            onChange={(event) => update("addressLine1", event.target.value)}
            placeholder="Door no., street"
          />
        </Field>

        <Field label="Landmark / second line" htmlFor={`${member?.id}-line2`} className="sm:col-span-2">
          <Input
            id={`${member?.id}-line2`}
            value={values.addressLine2}
            onChange={(event) => update("addressLine2", event.target.value)}
            placeholder="Near the temple, behind the school…"
          />
        </Field>

        <Field label="Contact number" htmlFor={`${member?.id}-contact`} hint={displayPhone(values.contactNumber)}>
          <Input
            id={`${member?.id}-contact`}
            inputMode="tel"
            className="scroll-mt-24"
            value={values.contactNumber}
            onChange={(event) => update("contactNumber", event.target.value)}
            onBlur={() => {
              const normalized = normalizePhone(values.contactNumber);
              if (normalized) update("contactNumber", normalized);
            }}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field label="WhatsApp number" htmlFor={`${member?.id}-whatsapp`} hint="Leave blank to use the contact number">
          <Input
            id={`${member?.id}-whatsapp`}
            inputMode="tel"
            value={values.whatsappNumber}
            onChange={(event) => update("whatsappNumber", event.target.value)}
            onBlur={() => {
              const normalized = normalizePhone(values.whatsappNumber);
              if (normalized) update("whatsappNumber", normalized);
            }}
            placeholder="+91 98765 43210"
          />
        </Field>

        <Field
          label="Google Maps link"
          htmlFor={`${member?.id}-maps`}
          className="sm:col-span-2"
          hint={
            hasCoords
              ? `Coordinates ${values.latitude}, ${values.longitude} — pinned on the map.`
              : "Paste a Maps share link to place this home on the map."
          }
        >
          <div className="flex gap-2">
            <Input
              id={`${member?.id}-maps`}
              value={values.googleMapUrl}
              onChange={(event) => update("googleMapUrl", event.target.value)}
              onBlur={readMapLink}
              placeholder="https://maps.app.goo.gl/…"
            />
            <Button type="button" variant="outline" onClick={useCurrentLocation} className="shrink-0">
              Use my location
            </Button>
          </div>
        </Field>
      </div>

      {hasCoords ? (
        <p className="mono-caption">
          <a
            href={mapsLink(values.latitude, values.longitude)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            Open pin in Google Maps
          </a>
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
        {showNotify ? (
          <label className="flex items-start gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={notify}
              onChange={(event) => setNotify(event.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-[hsl(var(--ink))]"
            />
            Tell the family this address changed
          </label>
        ) : null}
        <Button type="submit" disabled={busy || saving} className="ml-auto">
          {busy || saving ? "Saving…" : submitLabel}
        </Button>
      </div>

      <FormatAddressLine address={values} />
    </form>
  );
}

function FormatAddressLine({ address }) {
  return (
    <div className="border border-dashed border-border px-3 py-2">
      <MonoLabel>As it will appear</MonoLabel>
      <p className="mt-1 text-xs text-ink-soft">
        {[
          address.addressLine1,
          address.addressLine2,
          address.city,
          address.district,
          address.state,
          address.pincode
        ]
          .filter(Boolean)
          .join(", ") || "No address yet"}
      </p>
    </div>
  );
}
