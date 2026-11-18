import { formatDate } from "@/lib/format";
import { MonoLabel } from "@/components/sheet";

const FIELD_LABELS = {
  addressLine1: "House / street",
  addressLine2: "Landmark",
  city: "Area",
  district: "District",
  state: "State",
  pincode: "Pincode",
  contactNumber: "Contact number",
  whatsappNumber: "WhatsApp number",
  googleMapUrl: "Maps link",
  latitude: "Latitude",
  longitude: "Longitude"
};

function describe(field, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (field === "latitude" || field === "longitude") return String(value);
  return String(value);
}

export function ChangeHistory({ entries = [] }) {
  return (
    <section aria-labelledby="history-heading">
      <MonoLabel as="h2" className="block">
        Address history
      </MonoLabel>
      <p id="history-heading" className="sr-only">
        Past address changes, newest first
      </p>
      {entries.length === 0 ? (
        <p className="mt-3 border border-dashed border-border px-4 py-6 text-xs text-ink-soft">
          No changes recorded yet. The first saved address starts the history.
        </p>
      ) : (
        <ol className="mt-3 divide-y divide-border border-y border-border">
          {entries.map((entry) => {
            const changes = entry.changes
              ? Object.entries(entry.changes)
              : entry.field
                ? [[entry.field, { before: entry.before, after: entry.after }]]
                : [];
            return (
              <li key={entry.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-medium">
                    {entry.byName || "A family member"}
                    <span className="font-normal text-ink-soft"> updated the address</span>
                  </p>
                  <p className="mono-caption">{formatDate(entry.at)}</p>
                </div>
                <dl className="mt-2 space-y-1">
                  {changes.map(([field, change]) => (
                    <div key={field} className="grid grid-cols-[7.5rem_1fr] gap-2 text-[11px]">
                      <dt className="text-ink-soft">{FIELD_LABELS[field] || field}</dt>
                      <dd className="text-ink">
                        <span className="text-ink-soft line-through decoration-stamp/40">
                          {describe(field, change?.before)}
                        </span>
                        <span aria-hidden="true" className="px-1.5 text-ink-soft">
                          →
                        </span>
                        {describe(field, change?.after)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
