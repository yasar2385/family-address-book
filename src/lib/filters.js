export function filterMembers(members, filters, claimedByMember, showClaimStatus) {
  const query = filters.query.trim().toLowerCase();
  return members.filter((member) => {
    if (query) {
      const haystack = [
        member.name,
        member.nameTamil,
        member.spouseName,
        member.relationLabel,
        member.city,
        member.district,
        member.state,
        member.pincode,
        member.contactNumber,
        member.whatsappNumber
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.state && member.state !== filters.state) return false;
    if (filters.district && member.district !== filters.district) return false;
    if (filters.area && member.city !== filters.area) return false;
    if (filters.pincode && !String(member.pincode || "").startsWith(filters.pincode)) return false;
    if (
      filters.relation &&
      !String(member.relationLabel || "").toLowerCase().includes(filters.relation.toLowerCase())
    ) {
      return false;
    }
    if (showClaimStatus && filters.claimed !== "all") {
      const claimed = claimedByMember.has(member.id);
      if (filters.claimed === "claimed" && !claimed) return false;
      if (filters.claimed === "unclaimed" && claimed) return false;
    }
    return true;
  });
}
