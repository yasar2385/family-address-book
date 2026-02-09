"use client"
import LocationMap from './LocationMap';

export default function MapPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Family Location Map</h1>
        <p className="text-sm md:text-base text-gray-500">
          Browse the latest member locations and open each pin for names and labels.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
        <LocationMap />
      </div>
    </div>
  );
}
