// frontend/lib/lang.js
// Tiny language store (English / Hindi) shared by chat + glossary tooltips.

export const LANG_KEY = "fineprint_lang";

export function getLang() {
  if (typeof window === "undefined") return "en";
  try {
    return localStorage.getItem(LANG_KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

export function setLang(lang) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
  // Let any mounted component (glossary tooltips, chat) react instantly
  window.dispatchEvent(new CustomEvent("fineprint:lang", { detail: lang }));
}