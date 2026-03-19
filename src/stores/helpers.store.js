import { defineStore } from 'pinia';

export const useHelpersStore = defineStore('helpers', () => {
  function abbreviatedContactName(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts.slice(1).map(p => /^\p{L}/u.test(p) && p.length >= 3 ? p[0] + '.' : p).join(' ')}`;
  }

  return { abbreviatedContactName };
});
