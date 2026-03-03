import { NextRequest, NextResponse } from 'next/server';
import { generateBackground } from '@/lib/ai-provider';
import { ApiResponse, BackgroundType } from '@/types';

const BACKGROUND_PROMPTS: Record<BackgroundType, string> = {
  office: 'Professional modern office background, clean minimalist design, large windows with natural light, contemporary furniture, potted plants, neutral colors, ideal for video calls and presentations, 4k quality',
  studio: 'Professional photography studio background, soft lighting setup, neutral backdrop, studio equipment visible, clean modern aesthetic, perfect for portrait videos, 4k quality',
  outdoor: 'Beautiful outdoor park scene, green trees, soft sunlight filtering through leaves, walking path, peaceful natural environment, professional quality, cinematic, 4k quality',
  custom: 'Clean professional setting that works well for various video content types, neutral colors, modern and versatile, 4k quality'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backgroundType, customPrompt } = body;

    if (!backgroundType) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Background type is required' },
        { status: 400 }
      );
    }

    const prompt = backgroundType === 'custom' && customPrompt 
      ? customPrompt 
      : BACKGROUND_PROMPTS[backgroundType as BackgroundType] || BACKGROUND_PROMPTS.office;

    const imageBase64 = await generateBackground(prompt);

    return NextResponse.json<ApiResponse<{ image: string }>>({
      success: true,
      data: { image: imageBase64 }
    });

  } catch (error) {
    console.error('Scenario generation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate scenario' 
      },
      { status: 500 }
    );
  }
}
