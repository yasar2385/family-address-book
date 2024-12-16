
'use client'; // Ensure this for Next.js React Leaflet compatibility
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';


// const Map = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
// const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });

export default function LocationMap() {

    const locations = [
        { lat: 40.7128, lng: -74.006, name: 'John - New York' },
        { lat: 34.0522, lng: -118.2437, name: 'Jane - Los Angeles' },
        { lat: 13.0604, lng: 80.2496, name: 'YazTech Innovations - Chennai' },
        { lat: 13.0878, lng: 80.2785, name: 'Newgen Chennai, Tamil Nadu' },
    ];

    return (
        // <div className="w-full h-64">
        //   <Map className="w-full h-full" center={[51.505, -0.09]} zoom={13}>
        //     <TileLayer
        //       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        //       attribution="&copy; OpenStreetMap contributors"
        //     />
        //   </Map>
        // </div>
        <div className="w-full h-64 sm:h-96 rounded-lg shadow">
            {/* <MapContainer className="w-full h-full" center={[37.7749, -122.4194]} zoom={5} scrollWheelZoom={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                {locations.map((location, index) => (
                    <Marker key={index} position={[location.lat, location.lng]}>
                        <Popup>{location.name}</Popup>
                    </Marker>
                ))}
            </MapContainer> */}
        </div>
    );
}
