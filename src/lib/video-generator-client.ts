/**
 * Enhanced Client-side video generation with natural movements
 * Creates a real video from avatar image + audio with realistic animations
 */

export interface VideoGenerationOptions {
  avatarImage: string;
  audioBlob?: Blob | null;
  duration: number;
  width?: number;
  height?: number;
  onProgress?: (progress: number) => void;
}

export interface VideoGenerationResult {
  videoBlob: Blob;
  videoUrl: string;
}

// Animation easing functions
const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t);

/**
 * Creates a video from an avatar image with natural movements
 */
export async function generateAvatarVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  const {
    avatarImage,
    audioBlob,
    duration,
    width = 1280,
    height = 720,
    onProgress
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        // Audio setup for lip sync
        let audioElement: HTMLAudioElement | null = null;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let audioSource: MediaElementAudioSourceNode | null = null;

        if (audioBlob) {
          audioElement = new Audio();
          audioElement.src = URL.createObjectURL(audioBlob);
          audioElement.crossOrigin = 'anonymous';

          try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.5;
            audioSource = audioContext.createMediaElementSource(audioElement);
            audioSource.connect(analyser);
            analyser.connect(audioContext.destination);
          } catch (audioErr) {
            console.log('Audio analysis setup failed:', audioErr);
          }
        }

        // MediaRecorder setup
        const stream = canvas.captureStream(30);
        const mediaRecorderOptions: MediaRecorderOptions = {
          mimeType: getBestMimeType(),
          videoBitsPerSecond: 8000000
        };

        const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(chunks, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(videoBlob);
          if (audioElement) URL.revokeObjectURL(audioElement.src);
          resolve({ videoBlob, videoUrl });
        };

        // Animation state
        const fps = 30;
        const totalFrames = duration * fps;
        let currentFrame = 0;
        let startTime: number;

        // Movement state
        let blinkTimer = 0;
        let blinkProgress = 0;
        let isBlinking = false;
        let nextBlinkTime = 2 + Math.random() * 3;

        // Head movement
        let headNodPhase = 0;
        let headTiltPhase = Math.random() * Math.PI * 2;
        let headTurnPhase = Math.random() * Math.PI * 2;

        // Expression state
        let currentMouthOpen = 0;
        let targetMouthOpen = 0;
        let eyebrowRaise = 0;
        let smileIntensity = 0;

        // Random movement intervals
        let nextExpressionChange = 1 + Math.random() * 2;
        let expressionTimer = 0;

        // Start recording
        mediaRecorder.start(100);

        // Start audio
        if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.play().catch(() => {});
        }

        // Animation loop
        const animate = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = (timestamp - startTime) / 1000;
          currentFrame = Math.floor(elapsed * fps);

          if (onProgress) {
            onProgress(Math.min(95, (currentFrame / totalFrames) * 100));
          }

          // Clear canvas
          ctx!.fillStyle = '#1a1a2e';
          ctx!.fillRect(0, 0, width, height);

          // ===== AUDIO ANALYSIS =====
          if (analyser && audioElement && !audioElement.paused) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);

            // Voice frequency range (focus on speech frequencies)
            let voiceEnergy = 0;
            const voiceStart = 2;
            const voiceEnd = Math.floor(dataArray.length * 0.4);
            for (let i = voiceStart; i < voiceEnd; i++) {
              voiceEnergy += dataArray[i];
            }
            voiceEnergy /= (voiceEnd - voiceStart);
            
            // Map to mouth opening
            targetMouthOpen = Math.min(1, voiceEnergy / 100);
          } else {
            // Idle mouth movement
            targetMouthOpen = 0.05 + Math.sin(elapsed * 1.5) * 0.03;
          }

          // Smooth mouth animation
          currentMouthOpen += (targetMouthOpen - currentMouthOpen) * 0.4;

          // ===== BLINK ANIMATION =====
          blinkTimer += 1/30;
          
          if (!isBlinking && blinkTimer > nextBlinkTime) {
            isBlinking = true;
            blinkProgress = 0;
            nextBlinkTime = 2 + Math.random() * 4;
          }

          if (isBlinking) {
            blinkProgress += 0.15;
            if (blinkProgress >= 1) {
              isBlinking = false;
              blinkTimer = 0;
            }
          }

          // ===== HEAD MOVEMENTS =====
          // Nodding (vertical) - more pronounced when speaking
          const nodSpeed = audioElement && !audioElement.paused ? 2.5 : 1.2;
          headNodPhase += 0.03 * nodSpeed;
          const headNod = Math.sin(headNodPhase) * 3;

          // Tilting (lateral tilt)
          headTiltPhase += 0.02;
          const headTilt = Math.sin(headTiltPhase) * 4;

          // Turn (horizontal rotation simulation)
          headTurnPhase += 0.015;
          const headTurn = Math.sin(headTurnPhase) * 2;

          // ===== EXPRESSION CHANGES =====
          expressionTimer += 1/30;
          if (expressionTimer > nextExpressionChange) {
            expressionTimer = 0;
            nextExpressionChange = 1.5 + Math.random() * 3;
            
            // Random expression changes
            if (Math.random() > 0.7) {
              eyebrowRaise = 0.3 + Math.random() * 0.4;
            } else {
              eyebrowRaise = Math.max(0, eyebrowRaise - 0.2);
            }
            
            if (audioElement && !audioElement.paused && Math.random() > 0.5) {
              smileIntensity = 0.2 + Math.random() * 0.3;
            } else {
              smileIntensity = Math.max(0, smileIntensity - 0.1);
            }
          }

          // Decay expressions
          eyebrowRaise *= 0.98;

          // ===== DRAW AVATAR =====
          ctx!.save();

          // Apply head transformations
          const centerX = width / 2;
          const centerY = height / 2;

          // Breathing effect
          const breathe = 1 + Math.sin(elapsed * 0.8) * 0.008;

          // Move head position
          const headOffsetX = headTurn * 2 + Math.sin(elapsed * 0.5) * 1;
          const headOffsetY = headNod + Math.cos(elapsed * 0.7) * 1;

          ctx!.translate(centerX + headOffsetX, centerY + headOffsetY);
          ctx!.rotate((headTilt * Math.PI) / 180);
          ctx!.scale(breathe, breathe);
          ctx!.translate(-centerX, -centerY);

          // Calculate image dimensions
          const imgAspect = img.width / img.height;
          const canvasAspect = width / height;
          let drawWidth, drawHeight, drawX, drawY;

          if (imgAspect > canvasAspect) {
            drawHeight = height * 1.1;
            drawWidth = drawHeight * imgAspect;
          } else {
            drawWidth = width * 1.1;
            drawHeight = drawWidth / imgAspect;
          }
          drawX = (width - drawWidth) / 2;
          drawY = (height - drawHeight) / 2;

          // Draw main avatar image
          ctx!.drawImage(img, drawX, drawY, drawWidth, drawHeight);

          // ===== FACIAL FEATURES OVERLAYS =====
          
          // Face center estimation (adjust based on typical portrait)
          const faceCenterX = centerX + headTurn * 5;
          const faceCenterY = centerY * 0.85;
          const faceWidth = width * 0.35;
          const faceHeight = height * 0.45;

          // Eye positions
          const eyeY = faceCenterY - faceHeight * 0.08;
          const eyeSpacing = faceWidth * 0.22;
          const eyeWidth = faceWidth * 0.12;
          const eyeHeight = eyeWidth * 0.5;

          // BLINK OVERLAY
          if (isBlinking) {
            ctx!.globalAlpha = Math.sin(blinkProgress * Math.PI);
            ctx!.fillStyle = '#000000';
            
            // Left eye blink
            ctx!.beginPath();
            ctx!.ellipse(
              faceCenterX - eyeSpacing,
              eyeY,
              eyeWidth,
              eyeHeight * 1.2,
              0, 0, Math.PI * 2
            );
            ctx!.fill();
            
            // Right eye blink
            ctx!.beginPath();
            ctx!.ellipse(
              faceCenterX + eyeSpacing,
              eyeY,
              eyeWidth,
              eyeHeight * 1.2,
              0, 0, Math.PI * 2
            );
            ctx!.fill();
            
            ctx!.globalAlpha = 1;
          }

          // EYEBROW MOVEMENT
          if (eyebrowRaise > 0.05) {
            ctx!.globalAlpha = eyebrowRaise * 0.3;
            ctx!.strokeStyle = '#000000';
            ctx!.lineWidth = 3;
            
            const browY = eyeY - eyeHeight * 2 - eyebrowRaise * 15;
            const browArc = eyebrowRaise * 5;
            
            // Left eyebrow
            ctx!.beginPath();
            ctx!.moveTo(faceCenterX - eyeSpacing - eyeWidth, browY + 3);
            ctx!.quadraticCurveTo(
              faceCenterX - eyeSpacing,
              browY - browArc,
              faceCenterX - eyeSpacing + eyeWidth,
              browY + 2
            );
            ctx!.stroke();
            
            // Right eyebrow
            ctx!.beginPath();
            ctx!.moveTo(faceCenterX + eyeSpacing - eyeWidth, browY + 2);
            ctx!.quadraticCurveTo(
              faceCenterX + eyeSpacing,
              browY - browArc,
              faceCenterX + eyeSpacing + eyeWidth,
              browY + 3
            );
            ctx!.stroke();
            
            ctx!.globalAlpha = 1;
          }

          // MOUTH ANIMATION
          const mouthY = faceCenterY + faceHeight * 0.25;
          const mouthWidth = faceWidth * 0.25;
          const mouthHeight = currentMouthOpen * faceHeight * 0.12;

          if (currentMouthOpen > 0.03) {
            ctx!.globalAlpha = Math.min(1, currentMouthOpen * 1.5);
            
            // Create gradient for mouth interior
            const mouthGradient = ctx!.createLinearGradient(
              faceCenterX - mouthWidth,
              mouthY - mouthHeight,
              faceCenterX + mouthWidth,
              mouthY + mouthHeight
            );
            mouthGradient.addColorStop(0, '#1a0a0a');
            mouthGradient.addColorStop(0.5, '#2a1515');
            mouthGradient.addColorStop(1, '#1a0a0a');

            ctx!.fillStyle = mouthGradient;
            
            // Draw mouth shape (more realistic oval)
            ctx!.beginPath();
            ctx!.ellipse(
              faceCenterX,
              mouthY,
              mouthWidth + currentMouthOpen * 5,
              Math.max(mouthHeight, 3),
              0, 0, Math.PI * 2
            );
            ctx!.fill();

            // Teeth hint
            if (currentMouthOpen > 0.3) {
              ctx!.fillStyle = 'rgba(255,255,255,0.7)';
              ctx!.beginPath();
              ctx!.ellipse(
                faceCenterX,
                mouthY - mouthHeight * 0.2,
                mouthWidth * 0.6,
                Math.min(mouthHeight * 0.3, 4),
                0, 0, Math.PI * 2
              );
              ctx!.fill();
            }

            ctx!.globalAlpha = 1;
          }

          // SMILE LINES
          if (smileIntensity > 0.1) {
            ctx!.globalAlpha = smileIntensity * 0.4;
            ctx!.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx!.lineWidth = 2;

            // Left smile line
            ctx!.beginPath();
            ctx!.arc(
              faceCenterX - mouthWidth * 1.2,
              mouthY - 5,
              mouthWidth * 0.8,
              0.3, Math.PI * 0.7
            );
            ctx!.stroke();

            // Right smile line
            ctx!.beginPath();
            ctx!.arc(
              faceCenterX + mouthWidth * 1.2,
              mouthY - 5,
              mouthWidth * 0.8,
              Math.PI * 0.3, Math.PI - 0.3
            );
            ctx!.stroke();

            ctx!.globalAlpha = 1;
          }

          ctx!.restore();

          // ===== AMBIENT EFFECTS =====
          
          // Subtle vignette
          const vignetteGradient = ctx!.createRadialGradient(
            centerX, centerY, height * 0.3,
            centerX, centerY, height * 0.9
          );
          vignetteGradient.addColorStop(0, 'rgba(0,0,0,0)');
          vignetteGradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
          vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.4)');
          ctx!.fillStyle = vignetteGradient;
          ctx!.fillRect(0, 0, width, height);

          // Speaking indicator (subtle glow when audio is active)
          if (audioElement && !audioElement.paused && currentMouthOpen > 0.2) {
            ctx!.globalAlpha = currentMouthOpen * 0.15;
            const glowGradient = ctx!.createRadialGradient(
              faceCenterX, mouthY,
              0,
              faceCenterX, mouthY,
              faceWidth * 0.5
            );
            glowGradient.addColorStop(0, 'rgba(255,200,150,0.3)');
            glowGradient.addColorStop(1, 'rgba(255,200,150,0)');
            ctx!.fillStyle = glowGradient;
            ctx!.fillRect(0, 0, width, height);
            ctx!.globalAlpha = 1;
          }

          // Check completion
          if (currentFrame >= totalFrames) {
            if (audioElement) audioElement.pause();
            if (audioContext && audioContext.state !== 'closed') {
              audioContext.close();
            }
            mediaRecorder.stop();
            if (onProgress) onProgress(100);
            return;
          }

          requestAnimationFrame(animate);
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error('MediaRecorder error: ' + (event as any).error?.message));
        };

        requestAnimationFrame(animate);

      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error('Failed to load avatar image'));

    if (avatarImage.startsWith('data:image')) {
      img.src = avatarImage;
    } else {
      img.src = `data:image/jpeg;base64,${avatarImage}`;
    }
  });
}

function getBestMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'video/webm';
}

export async function getAudioDuration(audioBlob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.src = URL.createObjectURL(audioBlob);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(audio.src);
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audio.src);
      resolve(5);
    };
  });
}

export interface VideoPackage {
  videoBlob: Blob;
  videoUrl: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number;
}

export async function createFullVideoPackage(
  avatarImage: string,
  audioBlob: Blob | null,
  onProgress?: (progress: number, stage: string) => void
): Promise<VideoPackage> {
  let duration = 5;
  if (audioBlob) {
    duration = await getAudioDuration(audioBlob);
    duration = Math.max(duration, 3);
  }

  onProgress?.(5, 'Iniciando animación...');

  const result = await generateAvatarVideo({
    avatarImage,
    audioBlob,
    duration,
    onProgress: (p) => onProgress?.(5 + p * 0.9, 'Generando animación...')
  });

  onProgress?.(100, '¡Video completado!');

  return {
    videoBlob: result.videoBlob,
    videoUrl: result.videoUrl,
    audioBlob: audioBlob || undefined,
    audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
    duration
  };
}
