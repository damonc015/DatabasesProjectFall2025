import { create } from 'zustand';

const useShoppingListStore = create((set) => ({
  isModalOpen: true,
  // history, createlist, modifylist
  isListHistory: 'history',
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsListHistory: (value) => set({ isListHistory: value }),
}));

export default useShoppingListStore;
