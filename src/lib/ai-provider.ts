// ============================================
// AI Provider Factory
// Unifica el acceso a diferentes proveedores de IA
// ============================================

import { VoiceType, VoiceAnalysis, AvatarAnalysis } from '@/types';
import MultiTTSProvider from './multi-tts-provider';
import OpenAIProvider from './openai-provider';

// ============================================
// Unified API functions
// ============================================

/**
 * Generate speech from text (Multi-provider TTS)
 * Intenta StreamElements (gratis) -> OpenAI -> VoiceRSS -> Google Translate
 */
export async function generateSpeech(
  text: string,
  voice: VoiceType = 'es-maria',
  speed: number = 1.0
): Promise<Buffer> {
  return MultiTTSProvider.generateSpeech(text, voice, speed);
}

/**
 * Transcribe audio to text using Whisper (OpenAI)
 */
export async function transcribeAudio(
  audioData: string | Buffer,
  mimeType?: string
): Promise<string> {
  return MultiTTSProvider.transcribeAudio(audioData, mimeType);
}

/**
 * Analyze avatar image using Vision
 */
export async function analyzeAvatar(
  imageBase64: string
): Promise<AvatarAnalysis> {
  return OpenAIProvider.analyzeAvatar(imageBase64);
}

/**
 * Analyze voice sample
 */
export async function analyzeVoiceSample(
  transcribedText: string
): Promise<VoiceAnalysis> {
  return OpenAIProvider.analyzeVoiceSample(transcribedText);
}

/**
 * Generate background image
 */
export async function generateBackground(
  description: string
): Promise<string> {
  return OpenAIProvider.generateBackground(description);
}

/**
 * Generate video from image
 */
export async function generateVideoFromImage(
  imageBase64: string,
  prompt: string
): Promise<{ taskId: string; status: string }> {
  return OpenAIProvider.generateVideoFromImage(imageBase64, prompt);
}

/**
 * Generate script suggestion
 */
export async function generateScriptSuggestion(
  topic: string,
  tone: string,
  language: string
): Promise<string> {
  return OpenAIProvider.generateScriptSuggestion(topic, tone, language);
}

/**
 * Get available TTS providers
 */
export function getTTSProviders() {
  return MultiTTSProvider.getTTSProviderInfo();
}

// Export the providers for direct access
export { default as OpenAIProvider } from './openai-provider';
export { default as MultiTTSProvider } from './multi-tts-provider';
