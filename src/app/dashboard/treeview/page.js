"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ChevronDown, ChevronRight, Heart, User } from "lucide-react";

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
  const [expandedNodes, setExpandedNodes] = useState(new Set());

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

        // Initialize with root nodes expanded (optional, or start collapsed)
        // const rootIds = Object.keys(tree).filter(id => tree[id].parents.length === 0);
        // setExpandedNodes(new Set(rootIds));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleNode = (memberId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedNodes(newExpanded);
  };

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
        ...member
      };
    });

    // First pass: establish direct relationships
    relations.forEach((relation) => {
      const { member1Id, member2Id, relationType } = relation;

      // Safety check if members exist
      if (!tree[member1Id] || !tree[member2Id]) return;

      switch (relationType) {
        case "Father":
        case "Mother":
        case "Son":
        case "Daughter":
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

      if (tree[memberId]) {
        tree[memberId].level = Math.max(tree[memberId].level, level);

        // Process children
        tree[memberId].children.forEach(child => {
          calculateLevels(child.id, level + 1, visited);
        });

        // Process siblings at same level
        tree[memberId].siblings.forEach(sibling => {
          calculateLevels(sibling.id, level, visited);
        });
      }
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
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expandedNodes.has(memberId);

    // Determine status based on spouse presence (simple heuristic for "Married")
    const isMarried = hasSpouse;

    return (
      <div className="flex flex-col items-center relative z-10">
        <div
          className={`
            p-3 rounded-lg shadow-md bg-white border-2 cursor-pointer transition-all hover:shadow-lg
            ${member.level === 0 ? 'border-blue-500' :
              member.level === 1 ? 'border-green-500' :
                member.level === 2 ? 'border-purple-500' : 'border-gray-500'}
            min-w-[180px]
          `}
          onClick={() => hasChildren && toggleNode(memberId)}
        >
          <div className="flex justify-between items-start">
            <div className="font-semibold text-lg">{member.name}</div>
            {hasChildren && (
              <div className="text-gray-400 ml-2">
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
          </div>

          {hasSpouse && (
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <Heart size={12} className="text-red-500" /> {member.spouseName}
            </div>
          )}

          {/* Status Indicator for Children (Married/Unmarried) */}
          {/* Only show this for non-root nodes or if specifically requested */}
          <div className="mt-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 inline-block">
            {isMarried ? "Married" : "Unmarried"}
          </div>
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
    const isExpanded = expandedNodes.has(memberId);

    return (
      <div className="flex flex-col items-center">
        {renderMemberCard(memberId, member)}

        {/* Render children only if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-8 relative animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 left-1/2 h-8 w-px bg-gray-300 -translate-x-1/2 -mt-4" />
            {/* Horizontal connector line */}
            {member.children.length > 1 && (
              <div className="absolute top-4 left-0 right-0 h-px bg-gray-300 mx-[calc(50%/var(--child-count))]" />
            )}

            <div className="flex gap-8 pt-4 relative">
              {/* Horizontal line connecting children */}
              {member.children.length > 1 && (
                <div
                  className="absolute top-0 left-0 right-0 h-px bg-gray-300"
                  style={{
                    left: '2rem', // Approximate half width of first child
                    right: '2rem' // Approximate half width of last child
                  }}
                />
              )}

              {member.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center relative">
                  {/* Vertical line to child */}
                  <div className="absolute -top-4 left-1/2 h-4 w-px bg-gray-300 -translate-x-1/2" />

                  <div className="text-xs text-gray-500 mb-1 bg-white px-1 z-10">
                    {relationTypes[child.relation]}
                  </div>
                  {renderTreeLevel(tree, child.id, visited)}
                </div>
              ))}
            </div>
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
    <div className="p-8 max-w-full overflow-x-auto min-h-screen bg-gray-50">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Family Tree</h2>
      <p className="text-center text-gray-500 mb-8">Click on a card to view family members</p>
      <div className="flex justify-center min-w-max">
        <div className="flex gap-16">
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