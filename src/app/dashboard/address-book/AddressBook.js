// src/app/dashboard/address-book
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AddressBook() {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState(""); // To track Firebase connection status

  // Fetch family members from Firestore
  const fetchFamilyMembers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "familyMembers"));

      // Check if collection is empty
      if (querySnapshot.empty) {
        console.log("No family members found. Adding default data...");
        await addDefaultFamilyMember(); // Add default data
        setFirebaseStatus("No data found. Default family member added.");
      } else {
        const members = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFamilyMembers(members);
        setFirebaseStatus("Family members loaded successfully.");
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
      setFirebaseStatus("Error fetching family members. Check Firebase setup.");
    } finally {
      setLoading(false);
    }
  };

  // Add a default family member to Firestore
  const addDefaultFamilyMember = async () => {
    try {
      await addDoc(collection(db, "familyMembers"), {
        name: "Default Member",
        spouseName: "Default Spouse",
        contactNumber: "000-000-0000",
        state: "Default State",
        district: "Default District",
        city: "Default City",
        children: ["Default Child"],
      });
      console.log("Default family member added successfully.");
    } catch (error) {
      console.error("Error adding default family member:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-4">
        <p>Loading family members...</p>
        <p className="text-gray-500">{firebaseStatus}</p>
      </div>
    );
  }

  if (familyMembers.length === 0) {
    return (
      <div className="text-center py-4">
        <p>No family members found.</p>
        <p className="text-gray-500">{firebaseStatus}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <p className="text-sm text-gray-500">{firebaseStatus}</p>
      <table className="min-w-full border-collapse border border-gray-300 mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Spouse/Husband</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Phone</th>
            <th className="border border-gray-300 px-4 py-2 text-left">Children</th>
          </tr>
        </thead>
        <tbody>
          {familyMembers.map((member) => (
            <tr key={member.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">{member.name}</td>
              <td className="border border-gray-300 px-4 py-2">{member.spouseName || "N/A"}</td>
              <td className="border border-gray-300 px-4 py-2">
                {`${member.city || ""}, ${member.district || ""}, ${member.state || ""}`}
              </td>
              <td className="border border-gray-300 px-4 py-2">{member.contactNumber || "N/A"}</td>
              <td className="border border-gray-300 px-4 py-2">
                {member.children?.length > 0 ? member.children.join(", ") : "No children"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
