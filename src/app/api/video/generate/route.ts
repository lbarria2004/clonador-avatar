import { NextRequest, NextResponse } from 'next/server';
import { createVideoTask, updateVideoTask } from '@/lib/video-utils';
import { ApiResponse, ScenarioSettings, VoiceSettings } from '@/types';
import { generateSpeech } from '@/lib/ai-provider';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      script, 
      voiceSettings, 
      avatarImage, 
      scenarioSettings,
      language = 'es'
    } = body;

    // Validate required fields
    if (!script) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'El guión es requerido' },
        { status: 400 }
      );
    }

    if (!avatarImage) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'La imagen del avatar es requerida' },
        { status: 400 }
      );
    }

    // Generate a unique task ID
    const taskId = randomUUID();
    createVideoTask(taskId);

    // Start async video generation
    generateVideo(taskId, {
      script,
      voiceSettings: voiceSettings || { voice: 'es-maria', speed: 1.0 },
      avatarImage,
      scenarioSettings: scenarioSettings || {},
      language
    });

    return NextResponse.json<ApiResponse<{ taskId: string }>>({
      success: true,
      data: { taskId }
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start video generation' 
      },
      { status: 500 }
    );
  }
}

interface VideoGenerationParams {
  script: string;
  voiceSettings: VoiceSettings;
  avatarImage: string;
  scenarioSettings: ScenarioSettings;
  language: string;
}

async function generateVideo(taskId: string, params: VideoGenerationParams) {
  try {
    updateVideoTask(taskId, { status: 'PROCESSING', progress: 5 });

    const { script, avatarImage, voiceSettings, scenarioSettings } = params;

    // Step 1: Generate audio from script
    updateVideoTask(taskId, { progress: 10, statusMessage: 'Generando audio...' });
    
    let audioBuffer: Buffer | null = null;
    try {
      audioBuffer = await generateSpeech(
        script, 
        voiceSettings.voice || 'es-maria', 
        voiceSettings.speed || 1.0
      );
      updateVideoTask(taskId, { progress: 30, statusMessage: 'Audio generado' });
    } catch (audioError) {
      console.log('Audio generation skipped:', audioError);
      updateVideoTask(taskId, { progress: 30, statusMessage: 'Continuando sin audio' });
    }

    // Step 2: Simulate video generation
    // In a real implementation, you would:
    // - Use a service like D-ID, Synthesia, or HeyGen
    // - Or use FFmpeg to combine avatar + audio
    
    updateVideoTask(taskId, { progress: 40, statusMessage: 'Procesando video...' });

    // Simulate processing time with progress updates
    for (let progress = 40; progress <= 90; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateVideoTask(taskId, { 
        progress,
        statusMessage: progress < 70 ? 'Aplicando efectos...' : 'Finalizando...'
      });
    }

    // Step 3: Complete - return result
    // For demo purposes, we return the avatar image
    // In production, this would be the actual video URL
    
    let base64Image = avatarImage;
    if (!avatarImage.startsWith('data:image')) {
      base64Image = `data:image/jpeg;base64,${avatarImage}`;
    }

    updateVideoTask(taskId, { 
      status: 'SUCCESS', 
      videoUrl: base64Image, // Placeholder - in production, this would be a video URL
      audioUrl: audioBuffer ? `data:audio/mp3;base64,${audioBuffer.toString('base64')}` : undefined,
      progress: 100,
      statusMessage: '¡Video generado exitosamente!'
    });

  } catch (error) {
    console.error('Video generation async error:', error);
    updateVideoTask(taskId, { 
      status: 'FAIL', 
      error: error instanceof Error ? error.message : 'Unknown error during video generation' 
    });
  }
}
