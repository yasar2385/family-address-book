
'use client'; // Ensure this for Next.js React Leaflet compatibility
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const defaultCenter = [10.7905, 78.7047];
const defaultZoom = 6;

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41]
});

export default function LocationMap() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'familyMembers'));
        const mapped = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const latitude = Number(data.latitude);
            const longitude = Number(data.longitude);

            const area = [data.city, data.district, data.state].filter(Boolean).join(', ');
            return {
              id: doc.id,
              lat: latitude,
              lng: longitude,
              isValid: Number.isFinite(latitude) && Number.isFinite(longitude),
              name: data.name,
              area: area || 'Location Not Set',
              city: data.city || '',
              district: data.district || '',
              state: data.state || '',
              phone: data.contactNumber || ''
            };
          });

        setLocations(mapped);
      } catch (error) {
        console.error('Error loading map locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesName = loc.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesArea = loc.area.toLowerCase().includes(areaFilter.toLowerCase());
      return matchesName && matchesArea;
    });
  }, [locations, nameFilter, areaFilter]);

  const mapPins = useMemo(() => {
    return filteredLocations.filter(loc => loc.isValid);
  }, [filteredLocations]);

  const center = useMemo(() => {
    if (mapPins.length === 0) return defaultCenter;
    return [mapPins[0].lat, mapPins[0].lng];
  }, [mapPins]);

  const zoom = mapPins.length === 0 ? defaultZoom : 6;

  if (loading) {
    return (
      <div className="w-full h-96 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/40 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading locations...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[600px]">
      {/* Left Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4 overflow-hidden">
        <div className="space-y-4 p-1">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by Name</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter name..."
                className="w-full pl-3 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by Area/Location</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter city, district..."
                className="w-full pl-3 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">
            Members ({filteredLocations.length})
          </h4>
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className={`p-3 rounded-lg border transition-all ${loc.isValid ? 'bg-white hover:border-blue-300 cursor-pointer shadow-sm' : 'bg-gray-50 border-gray-100 opacity-75'
                }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{loc.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 inline" />
                    {loc.area}
                  </div>
                  {loc.phone && (
                    <div className="text-[10px] text-gray-400 mt-1">
                      {loc.phone}
                    </div>
                  )}
                </div>
                {!loc.isValid && (
                  <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100">
                    No Pin
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
              No matches found
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 rounded-xl shadow-inner border bg-gray-50 overflow-hidden relative">
        <MapContainer className="w-full h-full z-0" center={center} zoom={zoom} scrollWheelZoom={true}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {mapPins.map((location) => (
            <Marker key={location.id} position={[location.lat, location.lng]} icon={markerIcon}>
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-blue-600">{location.name}</div>
                  <div className="text-xs text-gray-600 font-medium">{location.area}</div>
                  {location.phone && (
                    <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-100">
                      {location.phone}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {mapPins.length === 0 && locations.length > 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-[1000] flex items-center justify-center p-6 text-center">
            <div className="max-w-xs space-y-2">
              <MapPin className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-gray-600 font-medium">No results on map</p>
              <p className="text-xs text-gray-400">The filtered members don&apos;t have location coordinates set.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
