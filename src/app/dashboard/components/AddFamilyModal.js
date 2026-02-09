"use client";

import { useState, useEffect } from "react";
import { collection, addDoc } from "firebase/firestore"; // Firestore imports
import { db } from "@/lib/firebase"; // Import Firestore configuration
import locations from "@/data/locations.json"; // Import JSON for locations
import { useToast } from "@/components/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { ToastAction } from "@/components/ui/toast"
import { Loader2 } from "lucide-react";

export default function AddFamilyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    spouseName: "",
    contactNumber: "",
    state: "",
    district: "",
    city: "",
    children: [],
    latitude: "",
    longitude: "",
    googleMapUrl: "",
    dateOfBirth: "",
    dateOfMarriage: "",
    isAlive: true,
    dateOfDeath: "",
  });

  const extractCoordinates = (url) => {
    if (!url) return null;

    // Pattern 1: /@lat,lng
    const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match1 = url.match(pattern1);
    if (match1) return { lat: match1[1], lng: match1[2] };

    // Pattern 2: !3dlat!4dlng
    const pattern2 = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const match2 = url.match(pattern2);
    if (match2) return { lat: match2[1], lng: match2[2] };

    // Pattern 3: query/destination/daddr=lat,lng
    const pattern3 = /[?&](q|query|destination|daddr)=([-]?\d+\.\d+),([-]?\d+\.\d+)/;
    const match3 = url.match(pattern3);
    if (match3) return { lat: match3[2], lng: match3[3] };

    return null;
  };

  const handleMapUrlChange = (url) => {
    const coords = extractCoordinates(url);
    if (coords) {
      setFormData(prev => ({
        ...prev,
        googleMapUrl: url,
        latitude: coords.lat,
        longitude: coords.lng
      }));
    } else {
      setFormData(prev => ({ ...prev, googleMapUrl: url }));
    }
  };

  // Location state
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  // const [selectedCity, setSelectedCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);

  // Children state
  const [newChild, setNewChild] = useState("");

  // Extract states, districts, and cities from JSON
  const states = locations.states;
  const districts = selectedState && states.find((state) => state.name === selectedState)?.districts;
  const cities = selectedDistrict && districts.find((district) => district.name === selectedDistrict)?.cities;

  useEffect(() => {
    if (cities && cityInput) {
      const filtered = cities.filter(city =>
        city.toLowerCase().includes(cityInput.toLowerCase())
      );
      setFilteredCities(filtered);
      // Only show dropdown if there are matches AND we haven't selected a value
      setShowCityDropdown(filtered.length > 0);
    } else {
      setFilteredCities([]);
      setShowCityDropdown(false);
    }
  }, [cityInput, cities]);

  const handleStateChange = (e) => {
    const value = e.target.value;
    setSelectedState(value);
    setFormData({ ...formData, state: value, district: "", city: "" });
    setSelectedDistrict("");
    setCityInput("");
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setSelectedDistrict(value);
    setFormData({ ...formData, district: value, city: "" });
    setCityInput("");
  };

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCityInput(value);
    setFormData({ ...formData, city: value });
  };

  const handleCitySelect = (city) => {
    setCityInput(city);
    setFormData({ ...formData, city });
    setShowCityDropdown(false); // Explicitly close dropdown
    setFilteredCities([]); // Clear filtered results
  };

  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('#city-autocomplete-container')) {
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleAddChild = () => {
    if (newChild) {
      const updatedChildren = [...formData.children, newChild];
      setFormData({ ...formData, children: updatedChildren });
      setNewChild("");
    }
  };

  const handleRemoveChild = (child) => {
    const updatedChildren = formData.children.filter((c) => c !== child);
    setFormData({ ...formData, children: updatedChildren });
  };

  const handleEditChild = (oldChild, newChildName) => {
    const updatedChildren = formData.children.map((child) =>
      child === oldChild ? newChildName : child
    );
    setFormData({ ...formData, children: updatedChildren });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const mapUrl = formData.latitude && formData.longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${formData.latitude},${formData.longitude}`
        : "";
      const docRef = await addDoc(collection(db, "familyMembers"), {
        ...formData,
        googleMapUrl: mapUrl,
        createdAt: new Date().toISOString(),
        isAlive: formData.isAlive !== false // Ensure boolean
      });
      console.log("Document written with ID: ", docRef.id);
      toast({
        title: "Success",
        description: "Family member added successfully",
      });
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding family member:", error);
      toast({
        title: "Error",
        description: "Failed to add family member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const resetForm = () => {
    setFormData({
      name: "",
      spouseName: "",
      contactNumber: "",
      state: "",
      district: "",
      city: "",
      children: [],
      dateOfBirth: "",
      dateOfMarriage: "",
      isAlive: true,
      dateOfDeath: "",
      latitude: "",
      longitude: "",
      googleMapUrl: ""
    });
    setSelectedState("");
    setSelectedDistrict("");
    setCityInput("");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Add Family Member
      </button>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-[500px]">
            {isSubmitting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg z-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
            <h3 className="text-lg font-bold mb-4">Add New Family Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Input */}
              <input
                type="text"
                placeholder="Name"
                className="w-full p-2 border rounded-lg"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              {/* Spouse/Husband Name Input */}
              <input
                type="text"
                placeholder="Spouse/Husband Name"
                className="w-full p-2 border rounded-lg"
                value={formData.spouseName}
                onChange={(e) =>
                  setFormData({ ...formData, spouseName: e.target.value })
                }
              />

              {/* Contact Number Input */}
              <input
                type="text"
                placeholder="Contact Number"
                className="w-full p-2 border rounded-lg"
                value={formData.contactNumber}
                onChange={(e) =>
                  setFormData({ ...formData, contactNumber: e.target.value })
                }
              />
              {/* State Selection */}
              <div>
                <label htmlFor="state" className="block text-sm font-semibold">State</label>
                <select
                  id="state"
                  value={selectedState}
                  onChange={handleStateChange}
                  className="mt-1 block w-full p-2 border rounded"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state.name} value={state.name}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* District Selection */}
              <div>
                <label
                  htmlFor="district"
                  className="block text-sm font-semibold"
                >
                  District
                </label>
                <select
                  id="district"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="mt-1 block w-full p-2 border rounded"
                  disabled={!selectedState}
                >
                  <option value="">Select District</option>
                  {districts &&
                    districts.map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                </select>
              </div>
              {/* City Selection */}
              <div className="relative">
                <label htmlFor="city" className="block text-sm font-semibold">Area</label>
                <input
                  type="text"
                  id="city"
                  value={cityInput}
                  onChange={handleCityInputChange}
                  placeholder="Enter area"
                  className="w-full p-2 border rounded-lg"
                />
                {showCityDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        className="p-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleCitySelect(city)}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Latitude and Longitude Inputs */}
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="latitude" className="block text-sm font-semibold">Latitude</label>
                  <input
                    type="text"
                    id="latitude"
                    placeholder="Ex: 12.9716"
                    className="w-full p-2 border rounded-lg"
                    value={formData.latitude || ""}
                    onChange={(e) => {
                      const lat = e.target.value;
                      setFormData({
                        ...formData,
                        latitude: lat,
                        googleMapUrl: lat && formData.longitude
                          ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${formData.longitude}`
                          : formData.googleMapUrl
                      });
                    }}
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="longitude" className="block text-sm font-semibold">Longitude</label>
                  <input
                    type="text"
                    id="longitude"
                    placeholder="Ex: 80.2746"
                    className="w-full p-2 border rounded-lg"
                    value={formData.longitude || ""}
                    onChange={(e) => {
                      const lng = e.target.value;
                      setFormData({
                        ...formData,
                        longitude: lng,
                        googleMapUrl: formData.latitude && lng
                          ? `https://www.google.com/maps/dir/?api=1&destination=${formData.latitude},${lng}`
                          : formData.googleMapUrl
                      });
                    }}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="googleMapUrl" className="block text-sm font-semibold">Google Map URL</label>
                <input
                  type="text"
                  id="googleMapUrl"
                  placeholder="Paste Google Maps URL here"
                  className="w-full p-2 border rounded-lg"
                  value={formData.googleMapUrl}
                  onChange={(e) => handleMapUrlChange(e.target.value)}
                />
              </div>

              {/* New Fields: DOB, DOM, IsAlive, DOD */}
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    className="w-full p-2 border rounded-lg"
                    value={formData.dateOfBirth || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="dateOfMarriage" className="block text-sm font-semibold">Date of Marriage</label>
                  <input
                    type="date"
                    id="dateOfMarriage"
                    className="w-full p-2 border rounded-lg"
                    value={formData.dateOfMarriage || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfMarriage: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isAlive"
                  checked={formData.isAlive !== false} // Default to true if undefined
                  onChange={(e) =>
                    setFormData({ ...formData, isAlive: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="isAlive" className="text-sm font-semibold">Is Alive?</label>
              </div>

              {formData.isAlive === false && (
                <div>
                  <label htmlFor="dateOfDeath" className="block text-sm font-semibold">Date of Death</label>
                  <input
                    type="date"
                    id="dateOfDeath"
                    className="w-full p-2 border rounded-lg"
                    value={formData.dateOfDeath || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfDeath: e.target.value })
                    }
                  />
                </div>
              )}

              {/* Add Children */}
              <div className="hidden">
                <label htmlFor="children" className="block text-sm font-semibold">
                  Add Children
                </label>
                <input
                  type="text"
                  value={newChild}
                  onChange={(e) => setNewChild(e.target.value)}
                  placeholder="Enter child name"
                  className="w-full p-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddChild}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Child
                </button>
              </div>

              {/* Display Children */}
              <ul className="space-y-2">
                {formData.children.map((child, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{child}</span>
                    <div>
                      <button
                        onClick={() => handleRemoveChild(child)}
                        className="text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => {
                          const newName = prompt("Edit child name:", child);
                          if (newName) handleEditChild(child, newName);
                        }}
                        className="ml-4 text-yellow-500 hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Member
                </button>
                <button
                  onClick={() => !isSubmitting && setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
