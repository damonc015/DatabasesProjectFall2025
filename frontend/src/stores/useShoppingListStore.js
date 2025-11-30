import { create } from 'zustand';

const useShoppingListStore = create((set) => ({
  isModalOpen: false,
  // history, createlist, modifylist
  isListHistory: 'createlist',
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsListHistory: (value) => set({ isListHistory: value }),
  // mini modal for confirming save changes
  isMiniModalOpen: false,
  setIsMiniModalOpen: (value) => set({ isMiniModalOpen: value }),
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
