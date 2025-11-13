import { create } from 'zustand';

const useShoppingListStore = create((set) => ({
  isModalOpen: false,
  isListHistory: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  setIsListHistory: (value) => set({ isListHistory: value }),
}));

export default useShoppingListStore;
