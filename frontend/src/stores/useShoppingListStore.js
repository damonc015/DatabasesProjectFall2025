import { create } from 'zustand';

const useShoppingListStore = create((set) => ({
  isModalOpen: true,
  // history, createlist, modifylist
  isListHistory: 'history',
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsListHistory: (value) => set({ isListHistory: value }),
  // create list
  tempCreateListBelowThresholdItems: [],
  setTempCreateListBelowThresholdItems: (value) => set({ tempCreateListBelowThresholdItems: value }),
  tempCreateListAtThresholdItems: [],
  setTempCreateListAtThresholdItems: (value) => set({ tempCreateListAtThresholdItems: value }),
  // active list for modify list
  activeListId: null,
  setActiveListId: (value) => set({ activeListId: value }),
  tempActiveListItems: [],
  setTempActiveListItems: (value) => set({ tempActiveListItems: value }),
}));

export default useShoppingListStore;
