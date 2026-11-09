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

export interface MaterialOverview {
  overview: string
  summary: string
  summaryBlocks?: ({ type: 'heading'; level: number; text: string } | { type: 'paragraph'; text: string } | { type: 'list'; ordered: boolean; items: string[] })[]
  keyPoints: { point: string; quote: string }[]
  keyTerms: { term: string; definition: string }[]
  studyPlan: string[]
}

export interface Material {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  storagePath?: string;
  overview?: MaterialOverview;
  marked: boolean;
  progress: MaterialProgress[]; 
}

interface AppState {
  energyLevel: EnergyLevel | null;
  accessibilityProfile: AccessibilityProfile;
  setEnergyLevel: (energyLevel: EnergyLevel) => void;
  setAccessibilityProfile: (profile: Partial<AccessibilityProfile>) => void;
  
  materials: Material[];
  materialsLoaded: boolean;
  setMaterials: (materials: Material[]) => void;
  addMaterial: (m: Material) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
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
  materials: [],
  materialsLoaded: false,
  setEnergyLevel: (energyLevel) => set({ energyLevel }),
  setAccessibilityProfile: (profile) =>
    set((state) => ({
      accessibilityProfile: {
        ...state.accessibilityProfile,
        ...profile,
      },
    })),
  setMaterials: (materials) => set({ materials, materialsLoaded: true }),
  addMaterial: (m) => set((state) => ({ materials: [m, ...(state.materials || [])] })),
  updateMaterial: (id, updates) => set((state) => ({
    materials: state.materials.map((material) => material.id === id ? { ...material, ...updates } : material),
  })),
  deleteMaterial: (id) => set((state) => ({ materials: state.materials.filter(m => m.id !== id) })),
  toggleMarked: (id) => set((state) => ({
    materials: state.materials.map(m => m.id === id ? { ...m, marked: !m.marked } : m)
  }))
}));
