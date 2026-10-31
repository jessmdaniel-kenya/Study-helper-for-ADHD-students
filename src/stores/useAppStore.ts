// src/stores/useAppStore.ts
import { create } from 'zustand';

export type EnergyLevel = 'Low' | 'Medium' | 'Wired';

export interface AccessibilityProfile {
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  lowSensory: boolean;
}

export interface MaterialProgress {
  format: string;
  score: string;
  date: string;
}

export interface Material {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  marked: boolean;
  progress: MaterialProgress[]; 
}

interface AppState {
  energyLevel: EnergyLevel | null;
  accessibilityProfile: AccessibilityProfile;
  setEnergyLevel: (energyLevel: EnergyLevel) => void;
  setAccessibilityProfile: (profile: Partial<AccessibilityProfile>) => void;
  
  materials: Material[];
  addMaterial: (m: Material) => void;
  deleteMaterial: (id: string) => void;
  toggleMarked: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  energyLevel: null,
  accessibilityProfile: {
    dyslexiaFont: false,
    reducedMotion: false,
    lowSensory: false,
  },
  materials: [
    {
      id: 'demo-1',
      title: 'Contract Formation',
      content: 'An offer must be clear and communicated to the offeree. A valid acceptance creates binding obligations.',
      marked: false,
      progress: [
        { format: 'Flashcards', score: '85%', date: 'Today' },
        { format: 'Multiple Choice', score: '60%', date: 'Yesterday' },
        { format: 'Free Response', score: 'In Progress', date: 'Oct 28' }
      ]
    }
  ],
  setEnergyLevel: (energyLevel) => set({ energyLevel }),
  setAccessibilityProfile: (profile) =>
    set((state) => ({
      accessibilityProfile: {
        ...state.accessibilityProfile,
        ...profile,
      },
    })),
  addMaterial: (m) => set((state) => ({ materials: [m, ...(state.materials || [])] })),
  deleteMaterial: (id) => set((state) => ({ materials: state.materials.filter(m => m.id !== id) })),
  toggleMarked: (id) => set((state) => ({
    materials: state.materials.map(m => m.id === id ? { ...m, marked: !m.marked } : m)
  }))
}));