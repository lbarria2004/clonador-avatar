// ============================================
// AI Provider Types
// Sistema modular para múltiples proveedores de IA
// ============================================

export type AIProvider = 'openai' | 'z-ai';

// Voice language type
export type VoiceLanguage = 'all' | 'spanish-latino' | 'english' | 'neutral';

// Voice types
export type VoiceType = 
  // OpenAI Voices
  | 'alloy' 
  | 'echo' 
  | 'fable' 
  | 'onyx' 
  | 'nova' 
  | 'shimmer'
  // Spanish Latino Voices (mapped)
  | 'es-carlos'    // Maps to onyx (male, deep)
  | 'es-diego'     // Maps to echo (male, warm)
  | 'es-maria'     // Maps to nova (female, professional)
  | 'es-sofia'     // Maps to shimmer (female, soft)
  | 'es-alex';     // Maps to alloy (neutral)

export interface VoiceSettings {
  voice: VoiceType;
  speed: number; // 0.25 to 4.0 for OpenAI
  volume?: number;
  useClonedVoice?: boolean;
  clonedVoiceId?: string;
}

export interface VoiceAnalysis {
  suggestedSpeed: number;
  voiceCharacteristics: string[];
  suggestedVoiceType: string;
  confidence: number;
  voiceCharacteristicsExtra?: string[];
}

export interface ClonedVoice {
  id: string;
  name: string;
  audioSampleId: string;
  transcribedText: string;
  analysis: VoiceAnalysis;
  createdAt: Date;
}

// Avatar types
export interface AvatarAnalysis {
  facialFeatures: string[];
  suggestedStyles: string[];
  description: string;
  recommendedScenarios: string[];
}

export interface UploadedAvatar {
  id: string;
  imageUrl: string;
  base64: string;
  analysis?: AvatarAnalysis;
}

// Scenario types
export type BackgroundType = 'office' | 'studio' | 'outdoor' | 'custom';
export type CameraAngle = 'close-up' | 'medium-shot' | 'full-body';
export type LightingType = 'natural' | 'studio' | 'dramatic' | 'soft';
export type ClothingStyle = 'business' | 'casual' | 'formal' | 'creative';

export interface ScenarioSettings {
  background: BackgroundType;
  customBackgroundUrl?: string;
  cameraAngle: CameraAngle;
  lighting: LightingType;
  clothingStyle: ClothingStyle;
}

// Video generation types
export type VideoStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAIL';

export interface VideoGenerationTask {
  taskId: string;
  status: VideoStatus;
  videoUrl?: string;
  error?: string;
  progress?: number;
}

// Script types
export interface ScriptTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  language: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Voice option for dropdown
export interface VoiceOption {
  value: VoiceType;
  label: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  flag: string;
}

// Voice mapping for OpenAI
export const VOICE_MAPPING: Record<string, VoiceType> = {
  'es-carlos': 'onyx',      // Deep male voice
  'es-diego': 'echo',       // Warm male voice
  'es-maria': 'nova',       // Professional female
  'es-sofia': 'shimmer',    // Soft female voice
  'es-alex': 'alloy',       // Neutral voice
};

export const VOICE_OPTIONS: VoiceOption[] = [
  // Spanish Latino Voices (mapped to OpenAI equivalents)
  { value: 'es-carlos', label: 'Carlos (Latino)', description: 'Voz masculina profesional y clara', gender: 'male', language: 'spanish-latino', flag: '🇲🇽' },
  { value: 'es-diego', label: 'Diego (Latino)', description: 'Voz masculina cálida y amigable', gender: 'male', language: 'spanish-latino', flag: '🇦🇷' },
  { value: 'es-maria', label: 'María (Latino)', description: 'Voz femenina profesional en español', gender: 'female', language: 'spanish-latino', flag: '🇲🇽' },
  { value: 'es-sofia', label: 'Sofia (Latino)', description: 'Voz femenina suave y expresiva', gender: 'female', language: 'spanish-latino', flag: '🇨🇴' },
  { value: 'es-alex', label: 'Alex (Latino Neutro)', description: 'Voz neutral versátil', gender: 'neutral', language: 'spanish-latino', flag: '🌎' },
  
  // OpenAI Native Voices
  { value: 'alloy', label: 'Alloy', description: 'Neutral and versatile voice', gender: 'neutral', language: 'english', flag: '🇺🇸' },
  { value: 'echo', label: 'Echo', description: 'Warm male voice', gender: 'male', language: 'english', flag: '🇺🇸' },
  { value: 'fable', label: 'Fable', description: 'British storytelling voice', gender: 'neutral', language: 'english', flag: '🇬🇧' },
  { value: 'onyx', label: 'Onyx', description: 'Deep male voice', gender: 'male', language: 'english', flag: '🇺🇸' },
  { value: 'nova', label: 'Nova', description: 'Professional female voice', gender: 'female', language: 'english', flag: '🇺🇸' },
  { value: 'shimmer', label: 'Shimmer', description: 'Soft female voice', gender: 'female', language: 'english', flag: '🇺🇸' },
];

export const BACKGROUND_OPTIONS: { value: BackgroundType; label: string; icon: string }[] = [
  { value: 'office', label: 'Oficina Moderna', icon: '🏢' },
  { value: 'studio', label: 'Estudio Profesional', icon: '🎬' },
  { value: 'outdoor', label: 'Exterior', icon: '🌳' },
  { value: 'custom', label: 'Fondo Personalizado', icon: '🎨' },
];

export const CAMERA_ANGLE_OPTIONS: { value: CameraAngle; label: string; description: string }[] = [
  { value: 'close-up', label: 'Primer Plano', description: 'Enfoque en el rostro y expresiones' },
  { value: 'medium-shot', label: 'Plano Medio', description: 'Cuerpo superior en el encuadre' },
  { value: 'full-body', label: 'Cuerpo Entero', description: 'Figura completa visible' },
];

export const LIGHTING_OPTIONS: { value: LightingType; label: string; description: string }[] = [
  { value: 'natural', label: 'Luz Natural', description: 'Efecto de luz diurna suave' },
  { value: 'studio', label: 'Iluminación Studio', description: 'Iluminación profesional uniforme' },
  { value: 'dramatic', label: 'Dramática', description: 'Sombras y contrastes fuertes' },
  { value: 'soft', label: 'Brillo Suave', description: 'Iluminación difusa gentil' },
];

export const CLOTHING_STYLE_OPTIONS: { value: ClothingStyle; label: string; icon: string }[] = [
  { value: 'business', label: 'Business Profesional', icon: '👔' },
  { value: 'casual', label: 'Casual Elegante', icon: '👕' },
  { value: 'formal', label: 'Formal', icon: '🤵' },
  { value: 'creative', label: 'Creativo', icon: '🎭' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
];

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  // Spanish Templates
  {
    id: '1',
    name: 'Introducción de Producto',
    category: 'Marketing',
    content: '¡Hola! Hoy quiero presentarte nuestro increíble nuevo producto. Está diseñado para hacer tu vida más fácil y eficiente. Déjame contarte sobre sus características principales.',
    language: 'es',
  },
  {
    id: '2',
    name: 'Mensaje de Bienvenida',
    category: 'Greeting',
    content: '¡Bienvenido a nuestra plataforma! Estamos emocionados de tenerte aquí. Este es el lugar donde la innovación se encuentra con la simplicidad.',
    language: 'es',
  },
  {
    id: '3',
    name: 'Apertura de Tutorial',
    category: 'Education',
    content: 'En este tutorial, te guiaré a través de los pasos esenciales para comenzar. Al finalizar, tendrás una comprensión sólida de cómo funciona todo.',
    language: 'es',
  },
  {
    id: '4',
    name: 'Presentación de Empresa',
    category: 'Business',
    content: 'Nuestra empresa está construida sobre una base de innovación y excelencia. Creemos en ofrecer soluciones de calidad que realmente marquen la diferencia.',
    language: 'es',
  },
  // English Templates
  {
    id: '5',
    name: 'Product Introduction',
    category: 'Marketing',
    content: 'Hello! Today I want to introduce you to our amazing new product. It\'s designed to make your life easier and more efficient. Let me tell you about its key features.',
    language: 'en',
  },
  {
    id: '6',
    name: 'Welcome Message',
    category: 'Greeting',
    content: 'Welcome to our platform! We\'re excited to have you here. This is where innovation meets simplicity, and we can\'t wait to show you around.',
    language: 'en',
  },
];
