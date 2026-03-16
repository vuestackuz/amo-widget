import { defineStore } from 'pinia';

export const useHelpersStore = defineStore('helpers', () => {
  function abbreviatedContactName(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts.slice(1).map(p => p[0] + '.').join(' ')}`;
  }

  return { abbreviatedContactName };
});
