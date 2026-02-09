// src/app/dashboard/address-book
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import { collection, deleteDoc, doc, getDocs, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AddFamilyModal from "@/app/dashboard/components/AddFamilyModal";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenuCheckboxItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Loader2, Search, Settings2, LayoutList, GitGraph, MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const RecursiveRow = ({ member, depth, expandedRows, toggleExpand, beginEdit, handleDelete, showHeadBadge = false }) => {
  const hasChildren = member.childrenNodes && member.childrenNodes.length > 0;
  const isExpanded = expandedRows.has(member.id);

  return (
    <>
      <TableRow className={depth > 0 ? "bg-gray-50/30" : ""}>
        <TableCell className="font-medium" style={{ paddingLeft: `${depth * 24 + 12}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(member.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6" /> // Spacer for alignment
            )}
            <div className="flex flex-col">
              <span className="text-gray-900">{member.name}</span>
              {member.spouseName && (
                <span className="text-xs text-gray-400 font-normal">
                  Spouse: {member.spouseName}
                </span>
              )}
            </div>
            {showHeadBadge && depth === 0 && (
              <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">Head</Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="text-sm text-gray-600">
          {member.contactNumber || <span className="text-gray-300">N/A</span>}
        </TableCell>
        <TableCell className="text-sm text-gray-500">
          <div className="flex flex-col">
            <span>{member.city || "N/A"}</span>
            {member.isAlive === false && (
              <span className="text-[10px] text-red-500 font-medium">In Memory</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => beginEdit(member)}>
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(member)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {hasChildren && isExpanded && (
        member.childrenNodes.map(child => (
          <RecursiveRow
            key={child.id}
            member={child}
            depth={depth + 1}
            expandedRows={expandedRows}
            toggleExpand={toggleExpand}
            beginEdit={beginEdit}
            handleDelete={handleDelete}
            showHeadBadge={showHeadBadge}
          />
        ))
      )}
    </>
  );
};

const ChildrenDialog = ({ memberName, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="link" className="p-0 h-auto">
          View Children
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Children of {memberName}</DialogTitle>
        </DialogHeader>
        <ul className="list-disc pl-4 mt-2">
          {children}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default function AddressBook() {

  const { toast } = useToast();

  const [familyMembers, setFamilyMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firebaseStatus, setFirebaseStatus] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMember, setActiveMember] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [hasChildrenFilter, setHasChildrenFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Derived state for unique values
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  // Add column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    spouse: false,
    location: true,
    phone: true,
    children: false,
  });

  // Column definitions
  const columns = [
    { id: 'name', title: 'Name' },
    { id: 'spouse', title: 'Spouse/Husband' },
    { id: 'location', title: 'Location' },
    { id: 'phone', title: 'Phone' },
    { id: 'children', title: 'Children' },
    { id: 'actions', title: 'Actions' },
  ];

  // Fetch family members from Firestore
  const fetchFamilyMembers = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "familyMembers"));

      if (querySnapshot.empty) {
        console.log("No family members found. Adding default data...");
        await addDefaultFamilyMember();
        setFirebaseStatus("No data found. Default family member added.");
      } else {
        const members = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFamilyMembers(members);
        setFilteredMembers(members);

        // Extract unique states and districts
        const uniqueStates = [...new Set(members.map(member => member.state).filter(Boolean))];
        const uniqueDistricts = [...new Set(members.map(member => member.district).filter(Boolean))];

        setStates(uniqueStates);
        setDistricts(uniqueDistricts);
        setFirebaseStatus("Family members loaded successfully.");
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
      setFirebaseStatus("Error fetching family members. Check Firebase setup.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...familyMembers];

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.spouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.contactNumber?.includes(searchTerm)
      );
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter(member => member.state === stateFilter);
    }

    // District filter
    if (districtFilter !== "all") {
      filtered = filtered.filter(member => member.district === districtFilter);
    }

    // Has children filter
    if (hasChildrenFilter !== "all") {
      if (hasChildrenFilter === "yes") {
        filtered = filtered.filter(member => member.children?.length > 0);
      } else if (hasChildrenFilter === "no") {
        filtered = filtered.filter(member => !member.children?.length);
      }
    }

    setFilteredMembers(filtered);
  }, [familyMembers, hasChildrenFilter, districtFilter, searchTerm, stateFilter]);

  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const hierarchicalData = useMemo(() => {
    // 1. Group by Area
    const groups = {};
    filteredMembers.forEach(member => {
      const area = [member.city, member.district, member.state].filter(Boolean).join(", ") || "No Area Set";
      if (!groups[area]) groups[area] = [];
      groups[area].push(member);
    });

    // 2. For each area, build a tree
    const result = Object.entries(groups).map(([area, members]) => {
      const memberMap = new Map(members.map(m => [m.id, { ...m, childrenNodes: [] }]));
      const roots = [];
      const allChildrenIds = new Set();

      members.forEach(m => {
        if (Array.isArray(m.children)) {
          m.children.forEach(childId => allChildrenIds.add(childId));
        }
      });

      members.forEach(m => {
        const node = memberMap.get(m.id);
        if (!allChildrenIds.has(m.id)) {
          roots.push(node);
        }
        if (Array.isArray(m.children)) {
          m.children.forEach(childId => {
            const childNode = memberMap.get(childId);
            if (childNode) {
              node.childrenNodes.push(childNode);
            }
          });
        }
      });

      return { area, roots };
    });

    return result;
  }, [filteredMembers]);

  const familyTreeRoots = useMemo(() => {
    const memberMap = new Map(filteredMembers.map(m => [m.id, { ...m, childrenNodes: [] }]));
    const roots = [];
    const allChildrenIds = new Set();

    filteredMembers.forEach(m => {
      if (Array.isArray(m.children)) {
        m.children.forEach(childId => allChildrenIds.add(childId));
      }
    });

    filteredMembers.forEach(m => {
      const node = memberMap.get(m.id);
      if (!allChildrenIds.has(m.id)) {
        roots.push(node);
      }
      if (Array.isArray(m.children)) {
        m.children.forEach(childId => {
          const childNode = memberMap.get(childId);
          if (childNode) {
            node.childrenNodes.push(childNode);
          }
        });
      }
    });

    return roots;
  }, [filteredMembers]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStateFilter("all");
    setDistrictFilter("all");
    setHasChildrenFilter("all");
    setFilteredMembers(familyMembers);
  };

  const beginEdit = (member) => {
    setActiveMember({
      ...member,
      latitude: member.latitude || "",
      longitude: member.longitude || "",
      googleMapUrl: member.googleMapUrl || "",
      dateOfBirth: member.dateOfBirth || "",
      dateOfMarriage: member.dateOfMarriage || "",
      dateOfDeath: member.dateOfDeath || "",
      isAlive: member.isAlive !== false,
      children: member.children || []
    });
    setIsEditOpen(true);
  };

  const extractCoordinates = (url) => {
    if (!url) return null;
    const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match1 = url.match(pattern1);
    if (match1) return { lat: match1[1], lng: match1[2] };

    const pattern2 = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
    const match2 = url.match(pattern2);
    if (match2) return { lat: match2[1], lng: match2[2] };

    const pattern3 = /[?&](q|query|destination|daddr)=([-]?\d+\.\d+),([-]?\d+\.\d+)/;
    const match3 = url.match(pattern3);
    if (match3) return { lat: match3[2], lng: match3[3] };

    return null;
  };

  const handleEditChange = (field, value) => {
    if (field === "googleMapUrl") {
      const coords = extractCoordinates(value);
      if (coords) {
        setActiveMember((prev) => ({
          ...prev,
          googleMapUrl: value,
          latitude: coords.lat,
          longitude: coords.lng,
        }));
        return;
      }
    }

    if (field === "latitude" || field === "longitude") {
      const lat = field === "latitude" ? value : activeMember.latitude;
      const lng = field === "longitude" ? value : activeMember.longitude;
      setActiveMember((prev) => ({
        ...prev,
        [field]: value,
        googleMapUrl: lat && lng
          ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
          : prev.googleMapUrl
      }));
      return;
    }

    setActiveMember((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!activeMember?.id || isSaving) return;
    setIsSaving(true);
    try {
      const memberRef = doc(db, "familyMembers", activeMember.id);
      const mapUrl = activeMember.latitude && activeMember.longitude
        ? `https://www.google.com/maps/dir/?api=1&destination=${activeMember.latitude},${activeMember.longitude}`
        : "";
      const payload = {
        name: activeMember.name,
        spouseName: activeMember.spouseName || "",
        contactNumber: activeMember.contactNumber || "",
        state: activeMember.state || "",
        district: activeMember.district || "",
        city: activeMember.city || "",
        latitude: activeMember.latitude || "",
        longitude: activeMember.longitude || "",
        googleMapUrl: mapUrl,
        dateOfBirth: activeMember.dateOfBirth || "",
        dateOfMarriage: activeMember.dateOfMarriage || "",
        isAlive: activeMember.isAlive !== false,
        dateOfDeath: activeMember.isAlive === false ? activeMember.dateOfDeath || "" : "",
        children: Array.isArray(activeMember.children) ? activeMember.children : []
      };

      await updateDoc(memberRef, payload);
      const updatedMembers = familyMembers.map((member) =>
        member.id === activeMember.id ? { ...member, ...payload } : member
      );
      setFamilyMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      toast({
        title: "Updated",
        description: "Family member updated successfully."
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating member:", error);
      toast({
        title: "Error",
        description: "Failed to update family member.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!member?.id) return;
    const confirmed = window.confirm(`Delete ${member.name}? This cannot be undone.`);
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "familyMembers", member.id));
      const updatedMembers = familyMembers.filter((item) => item.id !== member.id);
      setFamilyMembers(updatedMembers);
      setFilteredMembers(updatedMembers);
      toast({
        title: "Deleted",
        description: "Family member removed."
      });
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Error",
        description: "Failed to delete family member.",
        variant: "destructive"
      });
    }
  };

  // Effect for initial load
  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  // Effect for filtering
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">{firebaseStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Family Address Book</CardTitle>
            <CardDescription>{firebaseStatus}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
              <TabsList>
                <TabsTrigger value="table" className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4" />
                  Table
                </TabsTrigger>
                <TabsTrigger value="area" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Area Wise
                </TabsTrigger>
                <TabsTrigger value="family" className="flex items-center gap-2">
                  <GitGraph className="h-4 w-4" />
                  Family Tree
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <AddFamilyModal />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id]}
                    onCheckedChange={(checked) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [column.id]: checked,
                      }))
                    }
                  >
                    {column.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>

        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, spouse, city, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Districts</SelectItem>
                {districts.map(district => (
                  <SelectItem key={district} value={district}>{district}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={hasChildrenFilter} onValueChange={setHasChildrenFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Has Children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="yes">With Children</SelectItem>
                <SelectItem value="no">Without Children</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
          </div>

          {/* Active Filters Display */}
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <Badge variant="secondary">Search: {searchTerm}</Badge>
            )}
            {stateFilter !== "all" && (
              <Badge variant="secondary">State: {stateFilter}</Badge>
            )}
            {districtFilter !== "all" && (
              <Badge variant="secondary">District: {districtFilter}</Badge>
            )}
            {hasChildrenFilter !== "all" && (
              <Badge variant="secondary">
                Children: {hasChildrenFilter === "yes" ? "Yes" : "No"}
              </Badge>
            )}
          </div>
        </div>

        {/* Table Section */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No family members found matching the filters.
          </div>
        ) : viewMode === "table" ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.name && <TableHead>Name</TableHead>}
                  {columnVisibility.spouse && <TableHead>Spouse/Husband</TableHead>}
                  {columnVisibility.location && <TableHead>Location</TableHead>}
                  {columnVisibility.phone && <TableHead>Phone</TableHead>}
                  {columnVisibility.children && <TableHead>Children</TableHead>}
                  <TableHead>Map</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    {columnVisibility.name && (
                      <TableCell className="font-medium">{member.name}</TableCell>
                    )}
                    {columnVisibility.spouse && (
                      <TableCell>{member.spouseName || "N/A"}</TableCell>
                    )}
                    {columnVisibility.location && (
                      <TableCell>
                        {[member.city, member.district, member.state]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </TableCell>
                    )}
                    {columnVisibility.phone && (
                      <TableCell>{member.contactNumber || "N/A"}</TableCell>
                    )}
                    {columnVisibility.children && (
                      <TableCell>
                        {member.children?.length > 0 ? (
                          <ChildrenDialog memberName={member.name}>
                            {member.children.map((child, index) => {
                              const childName = familyMembers.find(fm => fm.id === child)?.name || child;
                              return <li key={index}>{childName}</li>;
                            })}
                          </ChildrenDialog>
                        ) : (
                          "No children"
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {member.latitude && member.longitude ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Open Map
                        </a>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => beginEdit(member)}>
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(member)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : viewMode === "area" ? (
          <div className="space-y-6">
            {hierarchicalData.map(({ area, roots }) => (
              <div key={area} className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {area}
                </h3>
                <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="w-[400px]">Family Member (Tree View)</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Location Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roots.map(root => (
                        <RecursiveRow
                          key={root.id}
                          member={root}
                          depth={0}
                          expandedRows={expandedRows}
                          toggleExpand={toggleExpand}
                          beginEdit={beginEdit}
                          handleDelete={handleDelete}
                          showHeadBadge={false}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50/80">
                <TableRow>
                  <TableHead className="w-[450px]">Unified Family Tree</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyTreeRoots.map(root => (
                  <RecursiveRow
                    key={root.id}
                    member={root}
                    depth={0}
                    expandedRows={expandedRows}
                    toggleExpand={toggleExpand}
                    beginEdit={beginEdit}
                    handleDelete={handleDelete}
                    showHeadBadge={true}
                  />
                ))}
              </TableBody>
            </Table>
            {familyTreeRoots.length === 0 && (
              <div className="p-12 text-center text-gray-400">
                No family connections found. Use &quot;Link Family Members&quot; to build your tree.
              </div>
            )}
          </div>
        )}

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Family Member</DialogTitle>
              <DialogDescription>Update the member details below.</DialogDescription>
            </DialogHeader>
            {activeMember && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={activeMember.name || ""}
                      onChange={(e) => handleEditChange("name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Spouse/Husband</label>
                    <Input
                      value={activeMember.spouseName || ""}
                      onChange={(e) => handleEditChange("spouseName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contact Number</label>
                    <Input
                      value={activeMember.contactNumber || ""}
                      onChange={(e) => handleEditChange("contactNumber", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">City</label>
                    <Input
                      value={activeMember.city || ""}
                      onChange={(e) => handleEditChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">District</label>
                    <Input
                      value={activeMember.district || ""}
                      onChange={(e) => handleEditChange("district", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">State</label>
                    <Input
                      value={activeMember.state || ""}
                      onChange={(e) => handleEditChange("state", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Latitude</label>
                    <Input
                      value={activeMember.latitude || ""}
                      onChange={(e) => handleEditChange("latitude", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Longitude</label>
                    <Input
                      value={activeMember.longitude || ""}
                      onChange={(e) => handleEditChange("longitude", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Google Map URL</label>
                    <Input
                      placeholder="Paste Google Maps URL here"
                      value={activeMember.googleMapUrl || ""}
                      onChange={(e) => handleEditChange("googleMapUrl", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Birth</label>
                    <Input
                      type="date"
                      value={activeMember.dateOfBirth || ""}
                      onChange={(e) => handleEditChange("dateOfBirth", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date of Marriage</label>
                    <Input
                      type="date"
                      value={activeMember.dateOfMarriage || ""}
                      onChange={(e) => handleEditChange("dateOfMarriage", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Is Alive?</label>
                    <Select
                      value={activeMember.isAlive !== false ? "yes" : "no"}
                      onValueChange={(value) => handleEditChange("isAlive", value === "yes")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {activeMember.isAlive === false && (
                    <div>
                      <label className="text-sm font-medium">Date of Death</label>
                      <Input
                        type="date"
                        value={activeMember.dateOfDeath || ""}
                        onChange={(e) => handleEditChange("dateOfDeath", e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}