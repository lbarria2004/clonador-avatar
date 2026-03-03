import { NextRequest, NextResponse } from 'next/server';

// D-ID API configuration
const DID_API_URL = 'https://api.d-id.com';

// Get API key from environment or request header
function getApiKey(request: NextRequest): string {
  // First try header, then environment variable
  const headerKey = request.headers.get('x-did-api-key');
  return headerKey || process.env.DID_API_KEY || '';
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Create a D-ID talk from image and audio/text
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      sourceUrl,      // Base64 or URL of the avatar image
      audioUrl,       // URL or base64 of audio
      text,           // Text to speak (if no audio)
      voiceId,        // Voice ID for TTS
      language,       // Language code
    } = body;

    const apiKey = getApiKey(request);
    
    if (!apiKey) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'D-ID API key no configurada. Agrega tu API key en la configuración.' },
        { status: 500 }
      );
    }

    if (!sourceUrl) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Imagen del avatar es requerida' },
        { status: 400 }
      );
    }

    // Prepare the talk payload
    const talkPayload: any = {
      source_url: sourceUrl,
      config: {
        fluent: true,
        pad_audio: 0.5,
        driver_url: "bank://lively/",
        motion_factor: 1.0, // Higher = more movement
        face_detect: true,
        sharpen: true,
      }
    };

    // Add audio or text
    if (audioUrl) {
      // Use provided audio
      talkPayload.driver_url = "bank://lively/";
      if (audioUrl.startsWith('data:audio')) {
        // It's base64 - need to upload to storage first or use differently
        talkPayload.script = {
          type: "audio",
          audio_url: audioUrl,
        };
      } else {
        talkPayload.script = {
          type: "audio",
          audio_url: audioUrl,
        };
      }
    } else if (text) {
      // Use TTS
      talkPayload.script = {
        type: "text",
        input: text,
        provider: {
          type: "microsoft",
          voice_id: voiceId || "es-MX-DaliaNeural",
          voice_config: {
            style: "cheerful",
            rate: "1.0",
            pitch: "0%"
          }
        }
      };
    } else {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Se requiere audio o texto para generar el video' },
        { status: 400 }
      );
    }

    console.log('Creating D-ID talk...');

    // Create the talk
    const createResponse = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(talkPayload),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('D-ID create error:', errorData);
      
      // Check for specific errors
      if (createResponse.status === 401) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'API key de D-ID inválida' },
          { status: 401 }
        );
      }
      if (createResponse.status === 402) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'Créditos de D-ID agotados. Verifica tu cuenta.' },
          { status: 402 }
        );
      }
      
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: errorData.message || errorData.error?.message || 'Error al crear video con D-ID' },
        { status: createResponse.status }
      );
    }

    const talkData = await createResponse.json();
    console.log('D-ID talk created:', talkData.id);

    return NextResponse.json<ApiResponse<{ talkId: string; status: string }>>({
      success: true,
      data: {
        talkId: talkData.id,
        status: talkData.status || 'created'
      }
    });

  } catch (error) {
    console.error('D-ID video generation error:', error);
    return NextResponse.json<ApiResponse<null>>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al generar video' 
      },
      { status: 500 }
    );
  }
}
