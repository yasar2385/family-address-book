"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const relationTypes = {
  Father: "👨 Father",
  Mother: "👩 Mother",
  Son: "👦 Son",
  Daughter: "👧 Daughter",
  Brother: "👬 Brother",
  Sister: "👭 Sister",
  Uncle: "🧔 Uncle",
  Grandma: "👵 Grandma",
  Grandpa: "👴 Grandpa"
};

export default function FamilyTreeView() {
  const [members, setMembers] = useState([]);
  const [relations, setRelations] = useState([]);
  const [familyTree, setFamilyTree] = useState({});
  const [loading, setLoading] = useState(true);

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

  const buildFamilyTree = (members, relations) => {
    const tree = {};

    // Initialize members with additional info
    members.forEach((member) => {
      tree[member.id] = {
        name: member.name,
        spouseName: member.spouseName,
        children: [],
        level: 0,
        parents: [],
        siblings: [],
      };
    });

    // First pass: establish direct relationships
    relations.forEach((relation) => {
      const { member1Id, member2Id, relationType } = relation;
      
      switch (relationType) {
        case "Father":
        case "Mother":
          tree[member1Id].children.push({
            id: member2Id,
            relation: relationType
          });
          tree[member2Id].parents.push({
            id: member1Id,
            relation: relationType
          });
          break;
        case "Brother":
        case "Sister":
          tree[member1Id].siblings.push({
            id: member2Id,
            relation: relationType
          });
          break;
      }
    });

    // Second pass: calculate levels
    const calculateLevels = (memberId, level = 0, visited = new Set()) => {
      if (visited.has(memberId)) return;
      visited.add(memberId);
      
      tree[memberId].level = Math.max(tree[memberId].level, level);
      
      // Process children
      tree[memberId].children.forEach(child => {
        calculateLevels(child.id, level + 1, visited);
      });
      
      // Process siblings at same level
      tree[memberId].siblings.forEach(sibling => {
        calculateLevels(sibling.id, level, visited);
      });
    };

    // Start level calculation from root members (those without parents)
    Object.keys(tree).forEach(memberId => {
      if (tree[memberId].parents.length === 0) {
        calculateLevels(memberId);
      }
    });

    return tree;
  };

  const renderMemberCard = (memberId, member) => {
    const hasSpouse = member.spouseName && member.spouseName.trim() !== "";
    
    return (
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-lg shadow-md bg-white border-2 
          ${member.level === 0 ? 'border-blue-500' : 
            member.level === 1 ? 'border-green-500' : 
            member.level === 2 ? 'border-purple-500' : 'border-gray-500'}`}>
          <div className="font-semibold text-lg">{member.name}</div>
          {hasSpouse && (
            <div className="text-sm text-gray-600 mt-1">
              ❤️ {member.spouseName}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTreeLevel = (tree, memberId, visited = new Set()) => {
    if (visited.has(memberId)) return null;
    visited.add(memberId);

    const member = tree[memberId];
    if (!member) return null;

    const hasChildren = member.children.length > 0;
    const hasSiblings = member.siblings.length > 0;

    return (
      <div className="flex flex-col items-center">
        {renderMemberCard(memberId, member)}
        
        {/* Render children */}
        {hasChildren && (
          <div className="mt-8 relative">
            <div className="absolute top-0 left-1/2 h-8 w-px bg-gray-300 -translate-x-1/2" />
            <div className="flex gap-12">
              {member.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="text-sm text-gray-500 mb-2">
                    {relationTypes[child.relation]}
                  </div>
                  {renderTreeLevel(tree, child.id, visited)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Render siblings */}
        {hasSiblings && (
          <div className="mt-4 flex gap-8">
            {member.siblings.map((sibling) => (
              <div key={sibling.id} className="flex flex-col items-center">
                <div className="text-sm text-gray-500 mb-2">
                  {relationTypes[sibling.relation]}
                </div>
                {renderTreeLevel(tree, sibling.id, visited)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading family tree...</div>
      </div>
    );
  }

  // Find root members (those without parents)
  const rootMembers = Object.keys(familyTree).filter(
    memberId => familyTree[memberId].parents.length === 0
  );

  return (
    <div className="p-8 max-w-full overflow-x-auto">
      <h2 className="text-2xl font-bold mb-8 text-center">Family Tree</h2>
      <div className="flex justify-center">
        <div className="flex gap-12">
          {rootMembers.map(memberId => (
            <div key={memberId} className="flex flex-col items-center">
              {renderTreeLevel(familyTree, memberId, new Set())}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}