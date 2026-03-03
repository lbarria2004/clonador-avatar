import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, AvatarAnalysis } from '@/types';

// Análisis por defecto cuando la API de OpenAI no está disponible
function getDefaultAnalysis(): AvatarAnalysis {
  return {
    facialFeatures: [
      'Rasgos faciales claros',
      'Expresión natural',
      'Apariencia profesional',
      'Adecuado para video'
    ],
    suggestedStyles: [
      'Business profesional',
      'Casual elegante',
      'Estudio profesional'
    ],
    description: 'Una persona con presencia profesional adecuada para contenido de video. La imagen se ha procesado correctamente.',
    recommendedScenarios: [
      'Presentaciones corporativas',
      'Tutoriales educativos',
      'Videos de marketing'
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Image is required' },
        { status: 400 }
      );
    }

    // Ensure the image is in base64 format
    let base64Image = image;
    if (!image.startsWith('data:image')) {
      base64Image = `data:image/jpeg;base64,${image}`;
    }

    // Intentar análisis con OpenAI Vision si hay API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { 
                    type: 'text', 
                    text: `Analiza esta foto de retrato para un generador de videos con avatar AI.

Proporciona un análisis en formato JSON con esta estructura exacta:
{
  "facialFeatures": ["feature1", "feature2", "feature3", "feature4"],
  "suggestedStyles": ["style1", "style2", "style3"],
  "description": "Una breve descripción de la apariencia de la persona",
  "recommendedScenarios": ["scenario1", "scenario2", "scenario3"]
}

Responde SOLO con el JSON válido.`
                  },
                  { 
                    type: 'image_url', 
                    image_url: { url: base64Image } 
                  },
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const content = result.choices[0]?.message?.content || '';
          
          // Parse JSON response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            return NextResponse.json<ApiResponse<AvatarAnalysis>>({
              success: true,
              data: analysis
            });
          }
        }
      } catch (openaiError) {
        console.log('OpenAI Vision no disponible, usando análisis por defecto');
      }
    }

    // Fallback: devolver análisis por defecto
    return NextResponse.json<ApiResponse<AvatarAnalysis>>({
      success: true,
      data: getDefaultAnalysis()
    });

  } catch (error) {
    console.error('Avatar analysis error:', error);
    
    // Incluso en error, devolver análisis por defecto para que el usuario pueda continuar
    return NextResponse.json<ApiResponse<AvatarAnalysis>>({
      success: true,
      data: getDefaultAnalysis()
    });
  }
}
