import { NextRequest, NextResponse } from 'next/server';

const DID_API_URL = 'https://api.d-id.com';

// Get API key from environment or request header
function getApiKey(request: NextRequest): string {
  const headerKey = request.headers.get('x-did-api-key');
  return headerKey || process.env.DID_API_KEY || '';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get D-ID talk status and result
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ talkId: string }> }
) {
  try {
    const { talkId } = await params;
    const apiKey = getApiKey(request);

    if (!apiKey) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'D-ID API key no configurada' },
        { status: 500 }
      );
    }

    if (!talkId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Talk ID es requerido' },
        { status: 400 }
      );
    }

    // Get talk status from D-ID
    const response = await fetch(`${DID_API_URL}/talks/${talkId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: errorData.message || 'Error al obtener estado del video' },
        { status: response.status }
      );
    }

    const talkData = await response.json();

    // Map D-ID status to our status
    const status = talkData.status;
    let videoUrl = null;
    let audioUrl = null;
    let duration = null;

    if (status === 'done') {
      videoUrl = talkData.result_url;
      audioUrl = talkData.audio_url;
      duration = talkData.duration;
    }

    return NextResponse.json<ApiResponse<{
      id: string;
      status: string;
      videoUrl?: string;
      audioUrl?: string;
      duration?: number;
      error?: string;
    }>>({
      success: true,
      data: {
        id: talkData.id,
        status: status,
        videoUrl: videoUrl,
        audioUrl: audioUrl,
        duration: duration,
        error: talkData.error?.message
      }
    });

  } catch (error) {
    console.error('D-ID status check error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al verificar estado' 
      },
      { status: 500 }
    );
  }
}
