import { ScenarioSettings } from '@/types';

/**
 * Generate a video prompt based on scenario settings
 */
export function generateVideoPrompt(scenario: ScenarioSettings, scriptHint?: string): string {
  const backgroundDescriptions: Record<string, string> = {
    office: 'a modern, clean professional office with large windows, minimalist desk setup, and soft ambient lighting',
    studio: 'a professional photography studio with soft box lighting, neutral backdrop, and professional equipment',
    outdoor: 'a beautiful outdoor setting with natural lighting, perhaps a park or urban environment',
    custom: scenario.customBackgroundUrl || 'a custom professional setting',
  };

  const angleDescriptions: Record<string, string> = {
    'close-up': 'close-up shot focusing on the face and upper shoulders',
    'medium-shot': 'medium shot showing the person from waist up',
    'full-body': 'full body shot showing the complete figure',
  };

  const lightingDescriptions: Record<string, string> = {
    natural: 'soft, natural daylight',
    studio: 'professional, even studio lighting',
    dramatic: 'dramatic lighting with strong shadows and highlights',
    soft: 'gentle, diffused soft lighting',
  };

  const clothingDescriptions: Record<string, string> = {
    business: 'business professional attire with a blazer or suit',
    casual: 'smart casual clothing, relaxed but professional',
    formal: 'formal attire, elegant and sophisticated',
    creative: 'creative, stylish clothing with unique flair',
  };

  const background = backgroundDescriptions[scenario.background];
  const angle = angleDescriptions[scenario.cameraAngle];
  const lighting = lightingDescriptions[scenario.lighting];
  const clothing = clothingDescriptions[scenario.clothingStyle];

  let prompt = `A professional video of a person wearing ${clothing}, ${angle}, standing in ${background}, with ${lighting}. `;
  
  if (scriptHint) {
    prompt += `The person is speaking naturally, with appropriate facial expressions and gestures for: "${scriptHint.substring(0, 100)}..."`;
  } else {
    prompt += 'The person is speaking naturally with confident facial expressions and natural gestures.';
  }

  prompt += ' High quality, professional video production, smooth motion, realistic.';

  return prompt;
}

/**
 * Video task storage for polling
 * In production, this would be a database or cache like Redis
 */
interface VideoTaskInfo {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAIL';
  videoUrl?: string;
  error?: string;
  progress: number;
  createdAt: number;
}

const videoTasks = new Map<string, VideoTaskInfo>();

export function createVideoTask(taskId: string): void {
  videoTasks.set(taskId, {
    taskId,
    status: 'PENDING',
    progress: 0,
    createdAt: Date.now(),
  });
}

export function updateVideoTask(taskId: string, updates: Partial<VideoTaskInfo>): void {
  const existing = videoTasks.get(taskId);
  if (existing) {
    videoTasks.set(taskId, { ...existing, ...updates });
  }
}

export function getVideoTask(taskId: string): VideoTaskInfo | undefined {
  return videoTasks.get(taskId);
}

export function deleteVideoTask(taskId: string): void {
  videoTasks.delete(taskId);
}

// Clean up old tasks (older than 1 hour)
export function cleanupOldTasks(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [taskId, task] of videoTasks.entries()) {
    if (task.createdAt < oneHourAgo) {
      videoTasks.delete(taskId);
    }
  }
}
