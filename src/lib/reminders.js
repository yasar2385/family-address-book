function parseIsoDate(value) {
  if (!value || typeof value !== "string") return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function nextOccurrence(value, now = new Date()) {
  const original = parseIsoDate(value);
  if (!original) return null;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(start.getFullYear(), original.getMonth(), original.getDate());
  if (next < start) next = new Date(start.getFullYear() + 1, original.getMonth(), original.getDate());
  return { original, next, daysAway: Math.round((next - start) / 86400000) };
}

export function upcomingEvents(members = [], days = 30, now = new Date()) {
  const events = [];
  members.forEach((member) => {
    if (member.isAlive === false) return;
    const birthday = nextOccurrence(member.dateOfBirth, now);
    if (birthday && birthday.daysAway <= days) {
      events.push({
        member,
        type: "birthday",
        date: birthday.next,
        daysAway: birthday.daysAway,
        years: birthday.next.getFullYear() - birthday.original.getFullYear()
      });
    }
    const anniversary = nextOccurrence(member.dateOfMarriage, now);
    if (anniversary && anniversary.daysAway <= days) {
      const years = anniversary.next.getFullYear() - anniversary.original.getFullYear();
      if (years > 0) {
        events.push({
          member,
          type: "anniversary",
          date: anniversary.next,
          daysAway: anniversary.daysAway,
          years
        });
      }
    }
  });
  return events.sort((a, b) => a.daysAway - b.daysAway);
}

export function recentYears(members = [], now = new Date()) {
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const births = [];
  const deaths = [];
  members.forEach((member) => {
    const born = parseIsoDate(member.dateOfBirth);
    if (born && born >= oneYearAgo) births.push({ member, date: born });
    if (member.isAlive === false) {
      const died = parseIsoDate(member.dateOfDeath);
      if (died && died >= oneYearAgo) deaths.push({ member, date: died });
    }
  });
  return { births, deaths };
}
