const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearButton = document.querySelector("#clear-btn");
const themeButton = document.querySelector("#theme-toggle");

const draftKey = "day4-note-draft";
const themeKey = "day4-note-theme";
const characterLimit = 200;

function updateCounts() {
  const text = noteText.value;
  const characters = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  charCount.textContent = `${characters} / ${characterLimit} characters`;
  wordCount.textContent = `${words} words`;
  charCount.classList.toggle("warning", characters > 180);
  charCount.classList.toggle("over", characters > characterLimit);
}

function clearDraft() {
  noteText.value = "";
  localStorage.removeItem(draftKey);
  updateCounts();
  noteText.focus();
}

function updateThemeButton() {
  themeButton.textContent = document.body.classList.contains("dark")
    ? "Light mode"
    : "Dark mode";
}

noteText.value = localStorage.getItem(draftKey) || "";
document.body.classList.toggle("dark", localStorage.getItem(themeKey) === "dark");
updateThemeButton();
updateCounts();

noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem(draftKey, noteText.value);
});

clearButton.addEventListener("click", clearDraft);

noteText.addEventListener("keydown", event => {
  if (event.key === "Escape") clearDraft();
});

themeButton.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(themeKey, isDark ? "dark" : "light");
  updateThemeButton();
});
