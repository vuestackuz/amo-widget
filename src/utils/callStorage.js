const STORAGE_KEY = 'utel_widget_calls';
const MAX_CALLS = 200;

export function saveCallToStorage(call) {
  const calls = getCallsFromStorage();
  // Avoid duplicates — replace if same id already exists
  const idx = calls.findIndex(c => c.id === call.id);
  if (idx !== -1) {
    calls[idx] = call;
  } else {
    calls.unshift(call); // newest first
    if (calls.length > MAX_CALLS) calls.length = MAX_CALLS;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
  } catch (e) {
    console.warn('[CallStorage] Failed to save:', e);
  }
}

export function getCallsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}
