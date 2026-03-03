// ============================================
// OpenAI Provider
// Cliente para APIs de OpenAI (TTS, ASR, VLM, Images)
// ============================================

import OpenAI from 'openai';
import { VoiceType, VOICE_MAPPING, AvatarAnalysis, VoiceAnalysis } from '@/types';

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY no está configurada. Añádela a tus variables de entorno.');
  }
  return new OpenAI({ apiKey });
}

// ============================================
// Text-to-Speech (TTS)
// ============================================

/**
 * Convert text to speech using OpenAI TTS
 * Supports Spanish with natural-sounding voices
 */
export async function generateSpeech(
  text: string,
  voice: VoiceType = 'es-maria',
  speed: number = 1.0
): Promise<Buffer> {
  const openai = getOpenAIClient();
  
  // Map Spanish voices to OpenAI voices
  const actualVoice = VOICE_MAPPING[voice] || voice;
  
  // Clamp speed to OpenAI's supported range (0.25 to 4.0)
  const clampedSpeed = Math.max(0.25, Math.min(4.0, speed));
  
  // Limit text length (OpenAI has a 4096 character limit)
  const limitedText = text.substring(0, 4000);
  
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1', // Use tts-1-hd for higher quality
      voice: actualVoice as OpenAI.Audio.Speech.Voice,
      input: limitedText,
      speed: clampedSpeed,
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('OpenAI TTS Error:', error);
    throw new Error(`Error generando audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// Speech-to-Text (ASR / Whisper)
// ============================================

/**
 * Transcribe audio using OpenAI Whisper
 * Supports multiple audio formats: mp3, mp4, mpeg, mpga, m4a, wav, webm
 */
export async function transcribeAudio(
  audioData: string | Buffer,
  mimeType?: string
): Promise<string> {
  const openai = getOpenAIClient();
  
  try {
    let buffer: Buffer;
    let filename = 'audio.wav';
    
    if (typeof audioData === 'string') {
      // Handle base64 string
      let base64Data = audioData;
      if (audioData.includes(',')) {
        // Extract from data URI (e.g., "data:audio/wav;base64,xxxxx")
        const matches = audioData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = audioData;
    }
    
    // Determine file type from mimeType or default to wav
    if (mimeType) {
      const ext = mimeType.split('/')[1] || 'wav';
      filename = `audio.${ext === 'mpeg' ? 'mp3' : ext}`;
    }
    
    // Create a File object from buffer
    const file = new File([buffer], filename, { 
      type: mimeType || 'audio/wav' 
    });
    
    const response = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: file,
      language: 'es', // Default to Spanish, can be made configurable
      response_format: 'text',
    });

    return response;
  } catch (error) {
    console.error('OpenAI Whisper Error:', error);
    throw new Error(`Error transcribiendo audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// Vision Language Model (VLM)
// ============================================

/**
 * Analyze avatar image using GPT-4 Vision
 * Extracts facial features and suggests styles
 */
export async function analyzeAvatar(
  imageBase64: string
): Promise<AvatarAnalysis> {
  const openai = getOpenAIClient();
  
  // Extract base64 data from data URI
  const base64Data = imageBase64.startsWith('data:image') 
    ? imageBase64 
    : `data:image/jpeg;base64,${imageBase64}`;
  
  const prompt = `Analiza esta foto de retrato para un generador de videos con avatar AI.

Proporciona un análisis detallado en formato JSON con esta estructura exacta:
{
  "facialFeatures": ["feature1", "feature2", "feature3", "feature4"],
  "suggestedStyles": ["style1", "style2", "style3"],
  "description": "Una breve descripción de la apariencia de la persona",
  "recommendedScenarios": ["scenario1", "scenario2", "scenario3"]
}

Incluye:
- facialFeatures: Rasgos faciales notables (forma de rostro, ojos, expresión, etc.)
- suggestedStyles: Estilos de ropa y presentación que combinarían bien
- description: Descripción general profesional
- recommendedScenarios: Escenarios de video recomendados (ej: presentaciones corporativas, tutoriales, marketing)

Responde SOLO con el JSON válido.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use gpt-4o for better analysis
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { url: base64Data } 
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      facialFeatures: ['Apariencia profesional', 'Rasgos claros'],
      suggestedStyles: ['Business profesional', 'Casual elegante'],
      description: 'Una persona con presencia profesional adecuada para contenido de video.',
      recommendedScenarios: ['Presentaciones', 'Tutoriales', 'Marketing'],
    };
  } catch (error) {
    console.error('OpenAI Vision Error:', error);
    throw new Error(`Error analizando avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyze voice sample characteristics
 */
export async function analyzeVoiceSample(
  transcribedText: string
): Promise<VoiceAnalysis> {
  const openai = getOpenAIClient();
  
  const prompt = `Analiza el siguiente texto transcrito de una muestra de voz y sugiere características para TTS.

Texto transcrito: "${transcribedText}"

Responde SOLO en formato JSON:
{
  "suggestedSpeed": <número entre 0.5 y 2.0>,
  "voiceCharacteristics": ["característica1", "característica2", "característica3"],
  "suggestedVoiceType": "tipo de voz sugerido",
  "confidence": <número entre 0 y 1>
}

Incluye en voiceCharacteristics: tono, ritmo, formalidad, energía, etc.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un experto en análisis de voz. Responde solo en JSON válido.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return {
      suggestedSpeed: 1.0,
      voiceCharacteristics: ['natural', 'clara'],
      suggestedVoiceType: 'neutral',
      confidence: 0.5,
    };
  } catch (error) {
    console.error('Voice Analysis Error:', error);
    return {
      suggestedSpeed: 1.0,
      voiceCharacteristics: ['natural'],
      suggestedVoiceType: 'neutral',
      confidence: 0.5,
    };
  }
}

// ============================================
// Image Generation (DALL-E)
// ============================================

/**
 * Generate background image using DALL-E
 */
export async function generateBackground(
  prompt: string
): Promise<string> {
  const openai = getOpenAIClient();
  
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt} Wide angle, suitable for video background, professional quality, no text, no people in foreground.`,
      n: 1,
      size: '1792x1024', // Widescreen for video
      quality: 'standard',
      response_format: 'b64_json',
    });

    const imageBase64 = response.data[0]?.b64_json;
    if (!imageBase64) {
      throw new Error('No se generó imagen');
    }

    return `data:image/png;base64,${imageBase64}`;
  } catch (error) {
    console.error('DALL-E Error:', error);
    throw new Error(`Error generando imagen: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// Video Generation Placeholder
// ============================================

/**
 * Generate video from image
 * Note: OpenAI doesn't have native video generation yet
 * This is a placeholder that generates a dynamic image
 */
export async function generateVideoFromImage(
  imageBase64: string,
  prompt: string
): Promise<{ taskId: string; status: string }> {
  // For now, we'll use image generation to create a "talking head" style image
  // In production, you would integrate with services like:
  // - RunwayML
  // - Synthesia
  // - D-ID
  // - Replicate (with video models)
  
  const taskId = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  // Simulate async processing
  return {
    taskId,
    status: 'PROCESSING',
  };
}

// ============================================
// Chat Completions (for script assistance)
// ============================================

/**
 * Generate script suggestions
 */
export async function generateScriptSuggestion(
  topic: string,
  tone: string = 'professional',
  language: string = 'es'
): Promise<string> {
  const openai = getOpenAIClient();
  
  const languagePrompt = language === 'es' 
    ? 'Escribe el guión completamente en español.' 
    : 'Write the script completely in English.';

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Eres un guionista profesional especializado en videos de avatar AI. 
Crea guiones concisos, naturales y atractivos para videos cortos.
${languagePrompt}`
        },
        {
          role: 'user',
          content: `Crea un guión corto (máximo 200 palabras) para un video sobre: "${topic}"
Tono: ${tone}
El guión debe ser natural y fluido para ser narrado por un avatar.`
        },
      ],
      max_tokens: 500,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Script Generation Error:', error);
    throw new Error(`Error generando guión: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================
// Export all functions
// ============================================

const OpenAIProvider = {
  generateSpeech,
  transcribeAudio,
  analyzeAvatar,
  analyzeVoiceSample,
  generateBackground,
  generateVideoFromImage,
  generateScriptSuggestion,
};

export default OpenAIProvider;
