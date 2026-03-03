// ============================================
// Global Store - Estado de la aplicación
// Los datos grandes (imágenes) se guardan en memoria sessionStorage
// Los datos pequeños (configuración) en localStorage
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  VoiceSettings,
  ScenarioSettings,
  VideoGenerationTask,
  ClonedVoice,
  AvatarAnalysis,
} from '@/types';

// Interface para el avatar sin el base64 pesado
interface AvatarMetadata {
  id: string;
  imageUrl: string; // URL temporal (blob:)
  analysis?: AvatarAnalysis;
  hasImage: boolean;
}

interface AvatarStore {
  // Avatar - solo metadatos en store, imagen en sessionStorage
  avatarMetadata: AvatarMetadata | null;
  setAvatarMetadata: (meta: AvatarMetadata | null) => void;
  
  // Script
  script: string;
  setScript: (script: string) => void;
  language: string;
  setLanguage: (language: string) => void;

  // Voice
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;

  // Cloned Voice
  clonedVoice: ClonedVoice | null;
  setClonedVoice: (voice: ClonedVoice | null) => void;

  // Scenario
  scenarioSettings: ScenarioSettings;
  setScenarioSettings: (settings: ScenarioSettings) => void;

  // Video Task - NO persistir (muy grande)
  videoTask: VideoGenerationTask | null;
  setVideoTask: (task: VideoGenerationTask | null) => void;

  // Progress
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  avatarMetadata: null,
  script: '',
  language: 'es',
  voiceSettings: {
    voice: 'es-maria' as const,
    speed: 1.0,
    volume: 5,
    useClonedVoice: false,
  },
  clonedVoice: null,
  scenarioSettings: {
    background: 'office' as const,
    cameraAngle: 'medium-shot' as const,
    lighting: 'natural' as const,
    clothingStyle: 'business' as const,
  },
  videoTask: null,
  isAnalyzing: false,
};

export const useAvatarStore = create<AvatarStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAvatarMetadata: (avatarMetadata) => set({ avatarMetadata }),
      setScript: (script) => set({ script }),
      setLanguage: (language) => set({ language }),
      setVoiceSettings: (voiceSettings) => set({ voiceSettings }),
      setClonedVoice: (clonedVoice) => set({ clonedVoice }),
      setScenarioSettings: (scenarioSettings) => set({ scenarioSettings }),
      setVideoTask: (videoTask) => set({ videoTask }),
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

      reset: () => set(initialState),
    }),
    {
      name: 'avatar-studio-storage',
      // Solo persistir datos pequeños, NO imágenes
      partialize: (state) => ({
        script: state.script,
        language: state.language,
        voiceSettings: state.voiceSettings,
        scenarioSettings: state.scenarioSettings,
        // NO guardamos: avatarMetadata (tiene imagen), clonedVoice, videoTask
      }),
    }
  )
);

// ============================================
// Helper para manejar la imagen del avatar
// Usamos sessionStorage para datos grandes
// ============================================

const AVATAR_IMAGE_KEY = 'avatar-studio-image';

export function saveAvatarImage(base64: string): void {
  try {
    // Limpiar datos antiguos primero
    clearAvatarImage();
    // Guardar en sessionStorage (más espacio que localStorage)
    sessionStorage.setItem(AVATAR_IMAGE_KEY, base64);
  } catch (error) {
    console.error('Error saving avatar image:', error);
    // Si falla, intentar limpiar y volver a guardar
    try {
      sessionStorage.clear();
      sessionStorage.setItem(AVATAR_IMAGE_KEY, base64);
    } catch (e) {
      console.error('Cannot save image even after clearing:', e);
    }
  }
}

export function getAvatarImage(): string | null {
  try {
    return sessionStorage.getItem(AVATAR_IMAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAvatarImage(): void {
  try {
    sessionStorage.removeItem(AVATAR_IMAGE_KEY);
  } catch {
    // ignore
  }
}

// ============================================
// Hook para obtener el progreso
// ============================================
export const useProgress = () => {
  const { avatarMetadata, script } = useAvatarStore();
  
  const completedSteps = [
    avatarMetadata?.hasImage === true,
    script.length > 0 && script.length <= 1024,
    true, // Voice always has defaults
    true, // Scenario always has defaults
  ];

  const allStepsComplete = completedSteps.every(Boolean);

  return { completedSteps, allStepsComplete };
};

// ============================================
// Hook combinado para el avatar completo
// ============================================
export const useAvatar = () => {
  const { avatarMetadata, setAvatarMetadata } = useAvatarStore();
  
  const setAvatar = (data: { id: string; imageUrl: string; base64: string; analysis?: AvatarAnalysis } | null) => {
    if (data) {
      // Guardar imagen en sessionStorage
      saveAvatarImage(data.base64);
      // Guardar metadatos en store
      setAvatarMetadata({
        id: data.id,
        imageUrl: data.imageUrl,
        analysis: data.analysis,
        hasImage: true,
      });
    } else {
      clearAvatarImage();
      setAvatarMetadata(null);
    }
  };
  
  const getAvatarBase64 = (): string | null => {
    return getAvatarImage();
  };
  
  const avatar = avatarMetadata?.hasImage 
    ? { ...avatarMetadata, base64: getAvatarImage() || '' }
    : null;
  
  return { avatar, setAvatar, getAvatarBase64 };
};
