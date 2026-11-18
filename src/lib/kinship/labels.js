export const TAMIL_LABELS = [
  { en: "Father", ta: "Appa", tamil: "அப்பா" },
  { en: "Mother", ta: "Amma", tamil: "அம்மா" },
  { en: "Elder brother", ta: "Anna", tamil: "அண்ணா" },
  { en: "Elder sister", ta: "Akka", tamil: "அக்கா" },
  { en: "Younger brother", ta: "Thambi", tamil: "தம்பி" },
  { en: "Younger sister", ta: "Thangai", tamil: "தங்கை" },
  { en: "Maternal uncle", ta: "Mama", tamil: "மாமா" },
  { en: "Maternal aunt", ta: "Chithi", tamil: "சித்தி" },
  { en: "Elder maternal aunt", ta: "Periyamma", tamil: "பெரியம்மா" },
  { en: "Paternal aunt", ta: "Athai", tamil: "அத்தை" },
  { en: "Grandfather", ta: "Thatha", tamil: "தாத்தா" },
  { en: "Grandmother", ta: "Paati", tamil: "பாட்டி" },
  { en: "Son-in-law", ta: "Mappillai", tamil: "மாப்பிள்ளை" },
  { en: "Daughter-in-law", ta: "Marumagal", tamil: "மருமகள்" },
  { en: "Cousin", ta: "Cousin", tamil: "" },
  { en: "In-law", ta: "Sambandhi", tamil: "சம்பந்தி" }
];

export const RELATION_LABEL_SUGGESTIONS = TAMIL_LABELS.map((label) =>
  label.tamil ? `${label.ta} · ${label.tamil}` : label.ta
);

export function tamilFor(label) {
  if (!label) return null;
  const found = TAMIL_LABELS.find(
    (item) =>
      item.en.toLowerCase() === label.toLowerCase() ||
      item.ta.toLowerCase() === label.toLowerCase() ||
      item.tamil === label
  );
  return found || null;
}
