// TTS has a max text length of 1024 characters
// This utility splits longer text into chunks

const MAX_TTS_LENGTH = 1024;

export interface TextChunk {
  text: string;
  index: number;
  isLast: boolean;
}

/**
 * Split text into chunks respecting sentence boundaries when possible
 */
export function splitTextForTTS(text: string): TextChunk[] {
  if (text.length <= MAX_TTS_LENGTH) {
    return [{ text, index: 0, isLast: true }];
  }

  const chunks: TextChunk[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  let currentChunk = '';
  let chunkIndex = 0;

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentChunk.length + trimmedSentence.length + 1 <= MAX_TTS_LENGTH) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push({ text: currentChunk, index: chunkIndex++, isLast: false });
      }
      
      // If a single sentence is too long, split by words
      if (trimmedSentence.length > MAX_TTS_LENGTH) {
        const words = trimmedSentence.split(' ');
        currentChunk = '';
        
        for (const word of words) {
          if (currentChunk.length + word.length + 1 <= MAX_TTS_LENGTH) {
            currentChunk += (currentChunk ? ' ' : '') + word;
          } else {
            if (currentChunk) {
              chunks.push({ text: currentChunk, index: chunkIndex++, isLast: false });
            }
            currentChunk = word;
          }
        }
      } else {
        currentChunk = trimmedSentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push({ text: currentChunk, index: chunkIndex, isLast: true });
  }

  // Update isLast flag for the actual last chunk
  if (chunks.length > 0) {
    chunks[chunks.length - 1].isLast = true;
  }

  return chunks;
}

/**
 * Calculate estimated duration for text based on speed
 */
export function estimateDuration(text: string, speed: number): number {
  // Average speaking rate is ~150 words per minute at speed 1.0
  const wordsPerMinute = 150 * speed;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return (wordCount / wordsPerMinute) * 60; // returns seconds
}

/**
 * Format duration in minutes and seconds
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}
