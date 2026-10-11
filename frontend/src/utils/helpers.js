/**
 * Utility helpers for NewsSense
 */

// Calculate estimated reading time in minutes
export function calculateReadingTime(text) {
  if (!text) return '1 min read';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

// ===== LocalStorage Bookmarks / Reading List =====
// localStorage persists across refreshes, tab closes, and browser restarts.
// It only clears when the user manually clears browser data.
const BOOKMARKS_KEY = 'newsense_saved_articles';

export function getSavedArticleIds() {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isArticleSaved(id) {
  const ids = getSavedArticleIds();
  return ids.includes(id);
}

export function toggleSaveArticle(id) {
  try {
    const ids = getSavedArticleIds();
    let updated;
    if (ids.includes(id)) {
      updated = ids.filter(item => item !== id);
    } else {
      updated = [...ids, id];
    }
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    // Dispatch storage event so other components sync instantly
    window.dispatchEvent(new Event('newsense_bookmarks_updated'));
    return updated.includes(id);
  } catch {
    return false;
  }
}

// ===== Search History / Lookup Patterns =====
// Stores recent searches for autocomplete/suggestion patterns
const SEARCH_HISTORY_KEY = 'newsense_search_history';
const MAX_SEARCH_HISTORY = 8;

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToSearchHistory(query) {
  if (!query || !query.trim()) return;
  try {
    const trimmed = query.trim();
    let history = getSearchHistory();
    // Remove duplicate if exists, then prepend
    history = history.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    history.unshift(trimmed);
    // Cap at max
    if (history.length > MAX_SEARCH_HISTORY) {
      history = history.slice(0, MAX_SEARCH_HISTORY);
    }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Silently fail — localStorage may be full or unavailable
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Silently fail
  }
}

// ===== Accessible Keyboard Helpers =====
/**
 * Returns true if the active element is a text input field.
 * Used to prevent keyboard shortcuts from firing while typing.
 */
export function isTyping() {
  const tag = document.activeElement?.tagName;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) || 
         document.activeElement?.isContentEditable;
}

// ===== Date Formatting =====
const MONTH_NAMES = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];

export function formatEditorialDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return '';
  }
}
