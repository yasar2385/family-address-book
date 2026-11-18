"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { formatAreaState } from "@/lib/format";
import { displayPhone } from "@/lib/phone";

function markerIcon(member) {
  const pinned = member.pincode;
  return L.divIcon({
    className: "kudumbam-pin",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${
      pinned ? "#1C3A31" : "#F3F4EC"
    };border:1.5px solid ${pinned ? "#E6E8DF" : "#B23A1B"};box-shadow:0 0 0 1px #1C3A31"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8]
  });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 11);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 12 });
  }, [map, points]);
  return null;
}

export default function RegisterMap({ members }) {
  const points = members.map((member) => [Number(member.latitude), Number(member.longitude)]);
  const centre = points.length ? points[0] : [10.79, 78.7];

  return (
    <MapContainer
      center={centre}
      zoom={7}
      scrollWheelZoom
      className="h-full w-full"
      aria-label="Map of recorded family homes"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <FitBounds points={points} />
      {members.map((member) => (
        <Marker
          key={member.id}
          position={[Number(member.latitude), Number(member.longitude)]}
          icon={markerIcon(member)}
        >
          <Popup>
            <div>
              <p className="font-display text-sm font-semibold leading-tight">{member.name}</p>
              <p className="mt-0.5 text-[11px]">{member.relationLabel || "Relation not set"}</p>
              <p className="text-[11px] text-ink-soft">{formatAreaState(member)}</p>
              <p className="font-mono text-[11px]">{member.pincode || "No pincode"}</p>
              <p className="mt-1 font-mono text-[11px] text-ink-soft">
                {displayPhone(member.whatsappNumber || member.contactNumber)}
              </p>
              <div className="mt-1.5 flex gap-2 text-[11px]">
                <Link href={`/circle?member=${member.id}`} className="underline underline-offset-2">
                  Circle
                </Link>
                <Link href={`/address-book?member=${member.id}`} className="underline underline-offset-2">
                  Record
                </Link>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
