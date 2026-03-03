import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/ai-provider';
import { VoiceType, ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice = 'es-maria', speed = 1.0, volume = 1.0 } = body;

    if (!text) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Text is required' },
        { status: 400 }
      );
    }

    // Validate and clamp parameters
    const clampedSpeed = Math.max(0.25, Math.min(4.0, Number(speed) || 1.0));
    const selectedVoice = voice as VoiceType;

    // Limit preview text to 500 characters for quick preview
    const previewText = text.substring(0, 500);

    const audioBuffer = await generateSpeech(previewText, selectedVoice, clampedSpeed);

    // Return the audio file directly
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate voice preview' 
      },
      { status: 500 }
    );
  }
}
