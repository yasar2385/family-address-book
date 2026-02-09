"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase"; // Firestore config
import { collection, getDocs, getDoc, addDoc, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/components/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"



const relationTypes = ["Father", "Mother", "Son", "Daughter", "Sister", "Brother", "Uncle", "Grandma", "Grandpa"];

export default function LinkFamilyModal() {
  
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ member1: "", member2: "", relation: "" });
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [existingRelation, setExistingRelation] = useState(null); // To hold existing relation data

  // Fetch members from the Firestore database
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "familyMembers"));
        const membersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name
        }));
        setMembers(membersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching family members:", error);
      }
    };

    fetchMembers();
  }, []);

  // Check if a relation already exists between member1 and member2
  useEffect(() => {
    const checkExistingRelation = async () => {
      if (formData.member1 && formData.member2) {
        const relationQuery = query(
          collection(db, "relations"),
          where("member1Id", "==", formData.member1),
          where("member2Id", "==", formData.member2)
        );
        const querySnapshot = await getDocs(relationQuery);
        if (!querySnapshot.empty) {
          const existing = querySnapshot.docs[0].data();
          setExistingRelation({ id: querySnapshot.docs[0].id, ...existing });
        } else {
          setExistingRelation(null); // No existing relation
        }
      }
    };

    checkExistingRelation();
  }, [formData.member1, formData.member2]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.member1 === formData.member2) {
      // alert("You cannot link the same member twice.");
      toast({
        title: "Warning",
        description: "You cannot link the same member twice.",
        variant: "destructive",
      });
      return;
    }

    try {
      // If a relation exists, remove it
      if (existingRelation) {
        const existingRelationRef = doc(db, "relations", existingRelation.id);
        await deleteDoc(existingRelationRef);
        console.log("Existing relation unlinked.");
      }

      // Add or update the relation in Firestore
      await addDoc(collection(db, "relations"), {
        member1Id: formData.member1,
        member2Id: formData.member2,
        relationType: formData.relation
      });

      console.log("Family members linked successfully:", formData);

      // If the relation is Son or Daughter, update the children field of Member1
      if (formData.relation === "Son" || formData.relation === "Daughter") {
        const member1Ref = doc(db, "familyMembers", formData.member1);
        const member1Snapshot = await getDoc(member1Ref);
        const member1Data = member1Snapshot.data() || {};

        // Update the children field of Member1
        const existingChildren = Array.isArray(member1Data.children) ? member1Data.children : [];
        const updatedChildren = [...new Set([...existingChildren, formData.member2])];

        await updateDoc(member1Ref, { children: updatedChildren });
        console.log(`Member1's (ID: ${formData.member1}) children field updated`);
      }

      setIsOpen(false);
      setFormData({ member1: "", member2: "", relation: "" });
      setExistingRelation(null); // Reset the existing relation state
    } catch (error) {
      console.error("Error linking family members:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Link Family Members
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full sm:w-[500px]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold mb-4">Link Family Members</h3>

              {/* Member 1 Dropdown */}
              <div>
                <label htmlFor="member1" className="block text-sm font-semibold text-gray-600">
                  Member 1
                </label>
                <select
                  id="member1"
                  value={formData.member1}
                  onChange={(e) => setFormData({ ...formData, member1: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Member 1</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Member 2 Dropdown */}
              <div>
                <label htmlFor="member2" className="block text-sm font-semibold text-gray-600">
                  Member 2
                </label>
                <select
                  id="member2"
                  value={formData.member2}
                  onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Member 2</option>
                  {members
                    .filter((member) => member.id !== formData.member1) // Avoid selecting the same member
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Relation Type Dropdown */}
              <div>
                <label htmlFor="relation" className="block text-sm font-semibold text-gray-600">
                  Relation Type
                </label>
                <select
                  id="relation"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select Relation</option>
                  {relationTypes.map((relation) => (
                    <option key={relation} value={relation}>
                      {relation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
