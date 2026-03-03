// ============================================
// Multi-Provider TTS (Text-to-Speech)
// Soporta múltiples servicios de TTS gratuitos y de pago
// ============================================

import { VoiceType, VOICE_MAPPING } from '@/types';

// ============================================
// Voces en Español Latino por proveedor
// ============================================

// ElevenLabs - Excelente calidad, tier gratis 10K chars/mes
const ELEVENLABS_VOICE_MAPPING: Record<string, string> = {
  'es-carlos': 'UgBBYS2sOqTuPpoFb1UK',  // Marcus - masculino profundo
  'es-diego': 'onwK4e9ZLuTAKHlMVjOr',  // Julio - masculino cálido
  'es-maria': 'XrExE9yKIg1WjnnlVkGX',  // Matilda - femenino profesional
  'es-sofia': 'FGYEbJTysFAMYVh4AFqx',  // Gigi - femenino suave
  'es-alex': 'pNInz6obpgDQGcFmaJgB',   // Adam - neutral
  // OpenAI voices fallback
  'alloy': 'pNInz6obpgDQGcFmaJgB',
  'echo': 'onwK4e9ZLuTAKHlMVjOr',
  'fable': 'UgBBYS2sOqTuPpoFb1UK',
  'onyx': 'UgBBYS2sOqTuPpoFb1UK',
  'nova': 'XrExE9yKIg1WjnnlVkGX',
  'shimmer': 'FGYEbJTysFAMYVh4AFqx',
};

// StreamElements TTS (Gratis - usado por streamers)
const STREAMELEMENTS_VOICES: Record<string, string> = {
  'es-carlos': 'Miguel',      // Español México masculino
  'es-diego': 'Enrique',      // Español España masculino
  'es-maria': 'Paulina',      // Español México femenino
  'es-sofia': 'Lola',         // Español España femenino
  'es-alex': 'Pedro',         // Español neutro
  'alloy': 'Brian',
  'echo': 'Joey',
  'fable': 'English Male 1',
  'onyx': 'Daniel',
  'nova': 'Samantha',
  'shimmer': 'English Female 1',
};

// Google Cloud TTS - Gratis 4M chars/mes
const GOOGLE_TTS_VOICES: Record<string, { name: string; languageCode: string }> = {
  'es-carlos': { name: 'es-US-Neural2-B', languageCode: 'es-US' },    // Masculino US
  'es-diego': { name: 'es-ES-Neural2-A', languageCode: 'es-ES' },     // Masculino España
  'es-maria': { name: 'es-US-Neural2-A', languageCode: 'es-US' },     // Femenino US
  'es-sofia': { name: 'es-ES-Neural2-B', languageCode: 'es-ES' },     // Femenino España
  'es-alex': { name: 'es-US-Neural2-C', languageCode: 'es-US' },      // Neutral US
  'alloy': { name: 'en-US-Neural2-C', languageCode: 'en-US' },
  'echo': { name: 'en-US-Neural2-D', languageCode: 'en-US' },
  'fable': { name: 'en-GB-Neural2-A', languageCode: 'en-GB' },
  'onyx': { name: 'en-US-Neural2-B', languageCode: 'en-US' },
  'nova': { name: 'en-US-Neural2-F', languageCode: 'en-US' },
  'shimmer': { name: 'en-US-Neural2-E', languageCode: 'en-US' },
};

// Azure TTS - Gratis 500K chars/mes
const AZURE_TTS_VOICES: Record<string, string> = {
  'es-carlos': 'es-MX-JorgeNeural',       // México masculino
  'es-diego': 'es-ES-AlvaroNeural',       // España masculino
  'es-maria': 'es-MX-DaliaNeural',        // México femenino
  'es-sofia': 'es-ES-ElviraNeural',       // España femenino
  'es-alex': 'es-US-AlonsoNeural',        // US español neutro
  'alloy': 'en-US-GuyNeural',
  'echo': 'en-US-ChristopherNeural',
  'fable': 'en-GB-RyanNeural',
  'onyx': 'en-US-EricNeural',
  'nova': 'en-US-JennyNeural',
  'shimmer': 'en-US-AriaNeural',
};

// ============================================
// ElevenLabs TTS (Mejor calidad, gratis 10K chars/mes)
// ============================================
async function generateWithElevenLabs(
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  const voiceId = ELEVENLABS_VOICE_MAPPING[voice];
  if (!voiceId) {
    return null;
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.substring(0, 2500),
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('ElevenLabs error:', error);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log('ElevenLabs failed:', error);
    return null;
  }
}

// ============================================
// StreamElements TTS (Gratis, sin API key)
// ============================================
async function generateWithStreamElements(
  text: string,
  voice: string
): Promise<Buffer | null> {
  const voiceName = STREAMELEMENTS_VOICES[voice] || 'Miguel';
  
  try {
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voiceName)}&text=${encodeURIComponent(text)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log('StreamElements failed:', error);
    return null;
  }
}

// ============================================
// Google Cloud TTS (Gratis 4M chars/mes)
// ============================================
async function generateWithGoogleCloud(
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer | null> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  const voiceConfig = GOOGLE_TTS_VOICES[voice];
  if (!voiceConfig) {
    return null;
  }
  
  try {
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: text.substring(0, 5000) },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: Math.max(0.25, Math.min(4.0, speed)),
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('Google Cloud TTS error:', error);
      return null;
    }
    
    const result = await response.json();
    if (result.audioContent) {
      return Buffer.from(result.audioContent, 'base64');
    }
    
    return null;
  } catch (error) {
    console.log('Google Cloud TTS failed:', error);
    return null;
  }
}

// ============================================
// Azure Cognitive Services TTS (Gratis 500K chars/mes)
// ============================================
async function generateWithAzure(
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer | null> {
  const apiKey = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION || 'eastus';
  
  if (!apiKey) {
    return null;
  }
  
  const voiceName = AZURE_TTS_VOICES[voice];
  if (!voiceName) {
    return null;
  }
  
  try {
    // Primero obtener token de acceso
    const tokenResponse = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    if (!tokenResponse.ok) {
      return null;
    }
    
    const accessToken = await tokenResponse.text();
    
    // Luego sintetizar voz
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">
        <voice name="${voiceName}">
          <prosody rate="${speed}">
            ${text.substring(0, 5000).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </prosody>
        </voice>
      </speak>
    `;
    
    const ttsResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: ssml,
    });
    
    if (!ttsResponse.ok) {
      return null;
    }
    
    const arrayBuffer = await ttsResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log('Azure TTS failed:', error);
    return null;
  }
}

// ============================================
// OpenAI TTS (de pago)
// ============================================
async function generateWithOpenAI(
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  try {
    const openaiVoice = VOICE_MAPPING[voice] || voice;
    
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: openaiVoice,
        input: text.substring(0, 4000),
        speed: Math.max(0.25, Math.min(4.0, speed)),
        response_format: 'mp3',
      }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log('OpenAI TTS failed:', error);
    return null;
  }
}

// ============================================
// VoiceRSS TTS (Gratis con API key - 35000 chars/día)
// ============================================
async function generateWithVoiceRSS(
  text: string,
  voice: string,
  speed: number = 1.0
): Promise<Buffer | null> {
  const apiKey = process.env.VOICERSS_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  const isSpanish = voice.startsWith('es-');
  const voiceMap: Record<string, string> = {
    'es-carlos': 'es-mx-m1',
    'es-diego': 'es-es-m1',
    'es-maria': 'es-mx-f1',
    'es-sofia': 'es-es-f1',
    'es-alex': 'es-mx-m2',
  };
  
  const voiceName = voiceMap[voice] || (isSpanish ? 'es-mx-f1' : 'en-us-f1');
  
  try {
    const url = 'https://api.voicerss.org/';
    const params = new URLSearchParams({
      key: apiKey,
      hl: isSpanish ? 'es-mx' : 'en-us',
      src: text.substring(0, 3000),
      v: voiceName,
      r: String(Math.round((speed - 1) * 10)),
      c: 'mp3',
      f: '44khz_16bit_stereo',
      ssml: 'false',
      b64: 'false',
    });
    
    const response = await fetch(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.toString().startsWith('ERROR')) {
      return null;
    }
    
    return buffer;
  } catch (error) {
    console.log('VoiceRSS failed:', error);
    return null;
  }
}

// ============================================
// Google Translate TTS (Gratis, sin API key - fallback)
// ============================================
async function generateWithGoogleTranslate(
  text: string,
  voice: string
): Promise<Buffer | null> {
  const isSpanishVoice = voice.startsWith('es-');
  const lang = isSpanishVoice ? 'es-MX' : 'en-US';
  
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.substring(0, 200))}&tl=${lang}&client=tw-ob`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.log('Google Translate TTS failed:', error);
    return null;
  }
}

// ============================================
// Función principal: Intenta múltiples proveedores en orden
// ============================================
export async function generateSpeech(
  text: string,
  voice: VoiceType = 'es-maria',
  speed: number = 1.0
): Promise<Buffer> {
  const limitedText = text.substring(0, 2500);
  
  // Mapear voz si es necesario
  const voiceToUse = voice.startsWith('es-') ? voice : (VOICE_MAPPING[voice] || voice);
  
  const errors: string[] = [];
  
  // Orden de preferencia (mejor calidad primero):
  // 1. ElevenLabs (excelente calidad, gratis 10K chars/mes)
  const elevenlabs = await generateWithElevenLabs(limitedText, voiceToUse, speed);
  if (elevenlabs && elevenlabs.length > 5000) {
    console.log('✓ ElevenLabs TTS success');
    return elevenlabs;
  }
  if (!elevenlabs) errors.push('ElevenLabs: no API key or failed');
  
  // 2. Google Cloud TTS (muy buena calidad, gratis 4M chars/mes)
  const googleCloud = await generateWithGoogleCloud(limitedText, voiceToUse, speed);
  if (googleCloud && googleCloud.length > 5000) {
    console.log('✓ Google Cloud TTS success');
    return googleCloud;
  }
  if (!googleCloud) errors.push('Google Cloud: no API key or failed');
  
  // 3. Azure TTS (buena calidad, gratis 500K chars/mes)
  const azure = await generateWithAzure(limitedText, voiceToUse, speed);
  if (azure && azure.length > 5000) {
    console.log('✓ Azure TTS success');
    return azure;
  }
  if (!azure) errors.push('Azure: no API key or failed');
  
  // 4. OpenAI TTS (si tienes créditos)
  const openai = await generateWithOpenAI(limitedText, voiceToUse, speed);
  if (openai && openai.length > 5000) {
    console.log('✓ OpenAI TTS success');
    return openai;
  }
  if (!openai) errors.push('OpenAI: no credits or failed');
  
  // 5. StreamElements TTS (gratis, calidad decente)
  const streamelements = await generateWithStreamElements(limitedText, voiceToUse);
  if (streamelements && streamelements.length > 5000) {
    console.log('✓ StreamElements TTS success');
    return streamelements;
  }
  if (!streamelements) errors.push('StreamElements: failed');
  
  // 6. VoiceRSS (gratis 35K chars/día)
  const voicerss = await generateWithVoiceRSS(limitedText, voiceToUse, speed);
  if (voicerss && voicerss.length > 5000) {
    console.log('✓ VoiceRSS TTS success');
    return voicerss;
  }
  if (!voicerss) errors.push('VoiceRSS: no API key or failed');
  
  // 7. Google Translate TTS (fallback final, gratuito)
  const googleTranslate = await generateWithGoogleTranslate(limitedText, voiceToUse);
  if (googleTranslate && googleTranslate.length > 1000) {
    console.log('✓ Google Translate TTS success (fallback)');
    return googleTranslate;
  }
  errors.push('Google Translate: failed');
  
  throw new Error(`Todos los proveedores TTS fallaron: ${errors.join('; ')}`);
}

// ============================================
// Transcripción de audio (solo OpenAI Whisper)
// ============================================
export async function transcribeAudio(
  audioData: string | Buffer,
  mimeType?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY es requerida para transcripción');
  }
  
  let buffer: Buffer;
  let filename = 'audio.wav';
  
  if (typeof audioData === 'string') {
    let base64Data = audioData;
    if (audioData.includes(',')) {
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
  
  if (mimeType) {
    const ext = mimeType.split('/')[1] || 'wav';
    filename = `audio.${ext === 'mpeg' ? 'mp3' : ext}`;
  }
  
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType || 'audio/wav' }), filename);
  formData.append('model', 'whisper-1');
  formData.append('language', 'es');
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Whisper error: ${error}`);
  }
  
  const result = await response.json();
  return result.text;
}

// ============================================
// Información de proveedores disponibles
// ============================================
export function getTTSProviderInfo(): { provider: string; available: boolean; tier: string }[] {
  return [
    { provider: 'ElevenLabs', available: !!process.env.ELEVENLABS_API_KEY, tier: 'Gratis: 10K chars/mes' },
    { provider: 'Google Cloud TTS', available: !!process.env.GOOGLE_TTS_API_KEY, tier: 'Gratis: 4M chars/mes' },
    { provider: 'Azure TTS', available: !!process.env.AZURE_TTS_KEY, tier: 'Gratis: 500K chars/mes' },
    { provider: 'OpenAI TTS', available: !!process.env.OPENAI_API_KEY, tier: 'De pago' },
    { provider: 'StreamElements', available: true, tier: 'Gratis ilimitado' },
    { provider: 'VoiceRSS', available: !!process.env.VOICERSS_API_KEY, tier: 'Gratis: 35K chars/día' },
    { provider: 'Google Translate', available: true, tier: 'Gratis (fallback)' },
  ];
}

const MultiTTSProvider = {
  generateSpeech,
  transcribeAudio,
  getTTSProviderInfo,
};

export default MultiTTSProvider;
