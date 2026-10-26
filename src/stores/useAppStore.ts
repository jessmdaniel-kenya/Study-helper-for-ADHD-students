import { create } from 'zustand';

export type EnergyLevel = 'Low' | 'Medium' | 'Wired';

export interface AccessibilityProfile {
  dyslexiaFont: boolean;
  reducedMotion: boolean;
  lowSensory: boolean;
}

interface AppState {
  energyLevel: EnergyLevel | null;
  accessibilityProfile: AccessibilityProfile;
  setEnergyLevel: (energyLevel: EnergyLevel) => void;
  setAccessibilityProfile: (profile: Partial<AccessibilityProfile>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  energyLevel: null,
  accessibilityProfile: {
    dyslexiaFont: false,
    reducedMotion: false,
    lowSensory: false,
  },
  setEnergyLevel: (energyLevel) => set({ energyLevel }),
  setAccessibilityProfile: (profile) =>
    set((state) => ({
      accessibilityProfile: {
        ...state.accessibilityProfile,
        ...profile,
      },
    })),
}));
