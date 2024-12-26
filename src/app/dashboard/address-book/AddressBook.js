// src/app/dashboard/address-book
"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Search, Filter, Loader2, Settings2 } from "lucide-react";
import { useToast } from "@/components/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

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

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [hasChildrenFilter, setHasChildrenFilter] = useState("all");

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
  ];
  // Fetch family members from Firestore
  const fetchFamilyMembers = async () => {
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
  };

  // Add a default family member to Firestore
  const addDefaultFamilyMember = async () => {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "familyMembers"), where("name", "==", "Default Member"))
      );
      if (querySnapshot.empty) {
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
      }
    } catch (error) {
      console.error("Error adding default family member:", error);
    }
  };


  // Apply filters
  const applyFilters = () => {
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
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStateFilter("all");
    setDistrictFilter("all");
    setHasChildrenFilter("all");
    setFilteredMembers(familyMembers);
  };

  // Effect for initial load
  useEffect(() => {
    fetchFamilyMembers();
  }, []);

  // Effect for filtering
  useEffect(() => {
    applyFilters();
  }, [searchTerm, stateFilter, districtFilter, hasChildrenFilter]);

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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Family Address Book</CardTitle>
            <CardDescription>{firebaseStatus}</CardDescription>
          </div>
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
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {columnVisibility.name && <TableHead>Name</TableHead>}
                  {columnVisibility.spouse && <TableHead>Spouse/Husband</TableHead>}
                  {columnVisibility.location && <TableHead>Location</TableHead>}
                  {columnVisibility.phone && <TableHead>Phone</TableHead>}
                  {columnVisibility.children && <TableHead>Children</TableHead>}
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
                            {member.children.map((child, index) => (
                              <li key={index}>{child}</li>
                            ))}
                          </ChildrenDialog>
                        ) : (
                          "No children"
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}