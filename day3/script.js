let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const searchWord = word.toLowerCase();
  return notes.filter(note => note.text.toLowerCase().includes(searchWord));
}

function longestNote() {
  if (notes.length === 0) return null;

  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) longest = note;
  }
  return longest;
}

function countByCategory() {
  const counts = { personal: 0, work: 0, study: 0 };
  for (const note of notes) counts[note.category]++;
  return counts;
}

function getSummary() {
  if (notes.length === 0) return "0 notes: no notes.";

  const counts = countByCategory();
  const categories = ["personal", "work", "study"];
  const details = categories.filter(category => counts[category] > 0)
    .map(category => `${counts[category]} ${category}`)
    .join(", ");
  return `${notes.length} ${notes.length === 1 ? "note" : "notes"}: ${details}.`;
}

function isDuplicate(text) {
  return notes.some(note =>
    note.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
}

function addNote(text, category) {
  const cleanText = text.trim();
  const categories = ["personal", "work", "study"];

  if (cleanText.length < 1 || cleanText.length > 200) {
    console.log("Not added: text must be 1 to 200 characters.");
    return false;
  }
  if (!categories.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }
  if (isDuplicate(cleanText)) {
    console.log("Not added: this note already exists.");
    return false;
  }

  notes.push({ id: notes.length + 1, text: cleanText, category });
  return true;
}

console.log(searchNotes("MILK")); // Expected: [{ id: 1, text: "Buy milk and bread", category: "personal" }]
console.log(searchNotes("unmatched")); // Expected: []
console.log(longestNote()); // Expected: note 3, "Email the project report to Grace"

const starterNotes = notes;
notes = [];
console.log(longestNote()); // Expected: null
console.log(countByCategory()); // Expected: { personal: 0, work: 0, study: 0 }
console.log(getSummary()); // Expected: "0 notes: no notes."
notes = starterNotes;
console.log(countByCategory()); // Expected: { personal: 2, work: 1, study: 2 }
console.log(getSummary()); // Expected: "5 notes: 2 personal, 1 work, 2 study."
notes = [starterNotes[0]];
console.log(getSummary()); // Expected: "1 note: 1 personal."
notes = starterNotes;

console.log(isDuplicate("  BUY MILK AND BREAD  ")); // Expected: true
console.log(isDuplicate("Read a book")); // Expected: false

console.log(addNote("Plan the weekend", "personal")); // Expected: true
console.log(addNote("  ", "personal")); // Expected: false, with a text-length reason
console.log(addNote("Plan a trip", "travel")); // Expected: false, with a category reason
console.log(addNote("plan THE weekend", "personal")); // Expected: false, with a duplicate reason
