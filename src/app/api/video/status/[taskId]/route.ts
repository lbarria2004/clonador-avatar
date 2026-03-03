import { NextRequest, NextResponse } from 'next/server';
import { getVideoTask } from '@/lib/video-utils';
import { ApiResponse, VideoGenerationTask } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    if (!taskId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const task = getVideoTask(taskId);

    if (!task) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<VideoGenerationTask>>({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Video status check error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to check video status' 
      },
      { status: 500 }
    );
  }
}
