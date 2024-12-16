"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore"; // Firestore imports
import { db } from "@/lib/firebase"; // Import Firestore configuration
import locations from "@/data/locations.json"; // Import JSON for locations

export default function AddFamilyModal() {
  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    spouseName: "",
    contactNumber: "",
    state: "",
    district: "",
    city: "",
    children: [],
  });

  // Location state
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  // Children state
  const [newChild, setNewChild] = useState("");

  // Extract states, districts, and cities from JSON
  const states = locations.states;
  const districts =
    selectedState &&
    states.find((state) => state.name === selectedState)?.districts;
  const cities =
    selectedDistrict &&
    districts.find((district) => district.name === selectedDistrict)?.cities;

  // Handlers for dropdowns
  const handleStateChange = (e) => {
    const value = e.target.value;
    setSelectedState(value);
    setFormData({ ...formData, state: value, district: "", city: "" });
    setSelectedDistrict("");
    setSelectedCity("");
  };

  const handleDistrictChange = (e) => {
    const value = e.target.value;
    setSelectedDistrict(value);
    setFormData({ ...formData, district: value, city: "" });
    setSelectedCity("");
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    setSelectedCity(value);
    setFormData({ ...formData, city: value });
  };

  // Add child functionality
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

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Adding family member:", formData);
    try {
      // Save data to Firestore
      const docRef = await addDoc(collection(db, "familyMembers"), formData);
      console.log("Document written with ID: ", docRef.id);
      alert("Family member added successfully!");
      setIsOpen(false);
      setFormData({
        name: "",
        spouseName: "",
        contactNumber: "",
        state: "",
        district: "",
        city: "",
        children: [],
      });
      setSelectedState("");
      setSelectedDistrict("");
      setSelectedCity("");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add family member. Please try again.");
    }
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
                <label htmlFor="state" className="block text-sm font-semibold">
                  State
                </label>
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
              <div>
                <label htmlFor="city" className="block text-sm font-semibold">
                  City
                </label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="mt-1 block w-full p-2 border rounded"
                  disabled={!selectedDistrict}
                >
                  <option value="">Select City</option>
                  {cities &&
                    cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                </select>
              </div>

              {/* Add Children */}
              <div>
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
                >
                  Add
                </button>
                <button
                  onClick={() => setIsOpen(false)}
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
