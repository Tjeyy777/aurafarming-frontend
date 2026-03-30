import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // For later: Handling global search or filter states
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  // Selected items for bulk actions (Common in CRMs)
  selectedIds: [],
  setSelectedIds: (ids) => set({ selectedIds: ids }),
}));