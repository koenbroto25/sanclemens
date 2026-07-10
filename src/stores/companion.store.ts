// src/stores/companion.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type CompanionMode = 'Normal' | 'Grief' | 'Doubt' | 'Gratitude' | 'Preparation' | 'Emergency';

interface EncryptedMessage {
  id: string;
  role: 'user' | 'bot';
  content: string; // Ciphertext (base64 encoded)
  iv: string;      // Initialization Vector (base64 encoded)
  timestamp: string;
}

interface CompanionStore {
  currentMode: CompanionMode;
  sessionId: string | null;
  pinUnlocked: boolean;
  encryptionKey: CryptoKey | null; // Stored in memory, NOT persisted
  messages: EncryptedMessage[];
  salt: string | null; // Stored in localStorage for key derivation, base64 encoded
  
  setMode: (mode: CompanionMode) => void;
  setSessionId: (id: string | null) => void;
  setPinUnlocked: (unlocked: boolean) => void;
  setEncryptionKey: (key: CryptoKey | null) => void;
  setSalt: (salt: string | null) => void;
  lockCompanion: () => void;
  addMessage: (msg: EncryptedMessage) => void;
  resetMessages: () => void;
}

// Custom storage to prevent CryptoKey from being serialized
const runtimeStorage = {
  getItem: (name: string) => {
    // For hydration, we'll only load the salt from actual localStorage
    const stored = localStorage.getItem(name);
    return stored ? JSON.parse(stored) : null;
  },
  setItem: (name: string, value: string) => {
    // Only save the 'salt' to localStorage, not the encryptionKey or transient state
    const { state, version } = JSON.parse(value);
    const stateToPersist = {
      currentMode: state.currentMode,
      sessionId: state.sessionId,
      messages: state.messages,
      salt: state.salt, // Persist the salt
    };
    localStorage.setItem(name, JSON.stringify({ state: stateToPersist, version }));
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};


export const useCompanionStore = create<CompanionStore>()(
  persist(
    (set, get) => ({
      currentMode: 'Normal',
      sessionId: null,
      pinUnlocked: false,
      encryptionKey: null, // Initial state, not persisted
      messages: [],
      salt: null, // Initial state, will be loaded from persisted state or generated
      
      setMode: (mode) => set({ currentMode: mode }),
      setSessionId: (id) => set({ sessionId: id }),
      setPinUnlocked: (unlocked) => set({ pinUnlocked: unlocked }),
      setEncryptionKey: (key) => set({ encryptionKey: key }),
      setSalt: (newSalt) => set({ salt: newSalt }),
      lockCompanion: () => set({ pinUnlocked: false, encryptionKey: null }),
      addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
      resetMessages: () => set({ messages: [] }),
    }),
    {
      name: 'companion-storage',
      storage: createJSONStorage(() => runtimeStorage), // Use custom storage
      partialize: (state) => ({
        // Specify what to persist. encryptionKey is explicitly omitted.
        currentMode: state.currentMode,
        sessionId: state.sessionId,
        messages: state.messages, // Messages are persisted as ciphertext
        salt: state.salt,
      }),
      // Only rehydrate certain parts, encryptionKey will be null on rehydration
      onRehydrateStorage: (state) => {
        if (state) {
          state.encryptionKey = null;
          state.pinUnlocked = false; // Reset PIN unlocked status on rehydrate
        }
      },
    }
  )
);
