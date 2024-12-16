"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase"; // Firestore config
import { collection, getDocs } from "firebase/firestore";

// Relation Types for visual representation
const relationTypes = {
  Father: "➡️ Father",
  Mother: "➡️ Mother",
  Son: "⬅️ Son",
  Daughter: "⬅️ Daughter",
  Brother: "➡️ Brother",
  Sister: "➡️ Sister",
  Uncle: "➡️ Uncle",
  Grandma: "➡️ Grandma",
  Grandpa: "➡️ Grandpa"
};

export default function FamilyTreeView() {
  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [familyTree, setFamilyTree] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch family members and relations from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersSnapshot = await getDocs(collection(db, "familyMembers"));
        const membersData = membersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const relationsSnapshot = await getDocs(collection(db, "relations"));
        const relationsData = relationsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMembers(membersData);
        setRelations(relationsData);

        const tree = buildFamilyTree(membersData, relationsData);
        setFamilyTree(tree);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build the family tree based on relations
  const buildFamilyTree = (members, relations) => {
    const tree = {};

    // Initialize the tree with members
    members.forEach((member) => {
      tree[member.id] = {
        name: member.name,
        children: [],
      };
    });

    // Establish relationships
    relations.forEach((relation) => {
      const { member1Id, member2Id, relationType } = relation;

      if (relationType === "Father" || relationType === "Mother") {
        tree[member1Id].children.push({
          id: member2Id,
          name: tree[member2Id].name,
          relation: relationType,
        });
      } else if (relationType === "Brother" || relationType === "Sister") {
        tree[member1Id].children.push({
          id: member2Id,
          name: tree[member2Id].name,
          relation: relationType,
        });
      }
    });

    return tree;
  };

  // Render the family tree as a flow diagram
  const renderTree = (tree, memberId) => {
    const member = tree[memberId];
    if (!member) return null;

    return (
      <div key={memberId} className="family-member relative flex flex-col items-center mb-6">
        <div className="node p-3 bg-blue-500 text-white rounded-lg">{member.name}</div>

        {member.children.length > 0 && (
          <div className="children flex flex-row justify-around mt-4 space-x-8">
            {member.children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="connection-line absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t-2 border-l-2 border-blue-500 transform rotate-45"></div>
                {renderTree(tree, child.id)}
                <div className="child-relationship mt-2">{relationTypes[child.relation]}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <p>Loading family tree...</p>;
  }

  return (
    <div className="family-tree-container text-center">
      <h2 className="text-2xl font-bold mb-4">Family Tree Flow Diagram</h2>
      <div className="family-tree flex justify-center">{renderTree(familyTree, Object.keys(familyTree)[0])}</div>
    </div>
  );
}
