import { NextResponse } from 'next/server';
import { getTTSProviders } from '@/lib/ai-provider';

export async function GET() {
  const ttsProviders = getTTSProviders();
  
  return NextResponse.json({
    version: '1.0.3',
    timestamp: new Date().toISOString(),
    provider: 'multi-tts',
    ttsProviders: ttsProviders,
    apiKeys: {
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      googleTTS: !!process.env.GOOGLE_TTS_API_KEY,
      azureTTS: !!(process.env.AZURE_TTS_KEY && process.env.AZURE_TTS_REGION),
      openai: !!process.env.OPENAI_API_KEY,
      voicerss: !!process.env.VOICERSS_API_KEY,
    },
    env: process.env.NODE_ENV
  });
}
