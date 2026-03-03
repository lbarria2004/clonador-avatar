'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  RefreshCw,
  CheckCircle,
  Volume2,
  Play,
  Pause,
  FileVideo,
  Music,
  Key,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { VideoGenerationTask, VoiceSettings, ScenarioSettings, UploadedAvatar } from '@/types';
import { cn } from '@/lib/utils';
import { createFullVideoPackage, VideoPackage } from '@/lib/video-generator-client';

interface VideoGeneratorProps {
  uploadedAvatar: UploadedAvatar | null;
  script: string;
  language: string;
  voiceSettings: VoiceSettings;
  scenarioSettings: ScenarioSettings;
  customBackground: string | null;
  videoTask: VideoGenerationTask | null;
  setVideoTask: (task: VideoGenerationTask | null) => void;
}

// D-ID voice mapping for Spanish
const DID_VOICE_MAPPING: Record<string, string> = {
  'es-maria': 'es-MX-DaliaNeural',
  'es-carlos': 'es-MX-JorgeNeural',
  'es-soledad': 'es-AR-ElenaNeural',
  'es-tomas': 'es-AR-TomasNeural',
  'es-latino': 'es-MX-DaliaNeural',
  'es-spain': 'es-ES-ElviraNeural',
};

export function VideoGenerator({
  uploadedAvatar,
  script,
  language,
  voiceSettings,
  scenarioSettings,
  customBackground,
  videoTask,
  setVideoTask,
}: VideoGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [videoPackage, setVideoPackage] = useState<VideoPackage | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [didVideoUrl, setDidVideoUrl] = useState<string | null>(null);
  const [didApiKey, setDidApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [useDID, setUseDID] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('did-api-key');
    if (savedKey) {
      setDidApiKey(savedKey);
    } else {
      // No API key saved, show input automatically
      setShowApiKeyInput(true);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (videoPackage?.videoUrl) {
        URL.revokeObjectURL(videoPackage.videoUrl);
      }
    };
  }, [audioUrl, videoPackage]);

  // Check requirements
  const hasAvatar = !!uploadedAvatar?.base64;
  const hasScript = script.length > 0 && script.length <= 1024;
  const canGenerate = hasAvatar && hasScript && !isGenerating;

  // Save API key
  const saveApiKey = useCallback(() => {
    if (didApiKey.trim()) {
      localStorage.setItem('did-api-key', didApiKey.trim());
      setShowApiKeyInput(false);
    }
  }, [didApiKey]);

  // Poll D-ID video status
  const pollDIDStatus = useCallback(async (talkId: string) => {
    try {
      const response = await fetch(`/api/video/did/${talkId}`, {
        headers: {
          'x-did-api-key': didApiKey
        }
      });
      const result = await response.json();

      if (result.success && result.data) {
        const { status, videoUrl, error } = result.data;
        
        if (status === 'done' && videoUrl) {
          setDidVideoUrl(videoUrl);
          setGenerationProgress(100);
          setStatusMessage('¡Video generado con IA!');
          setIsGenerating(false);
          setVideoTask({
            taskId: talkId,
            status: 'SUCCESS',
            videoUrl: videoUrl,
            progress: 100,
          });
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (status === 'error' || error) {
          throw new Error(error || 'Error en D-ID');
        } else {
          // Still processing
          setGenerationProgress(prev => Math.min(prev + 5, 90));
        }
      }
    } catch (error) {
      console.error('D-ID poll error:', error);
    }
  }, [didApiKey, setVideoTask]);

  // Generate with D-ID
  const generateWithDID = useCallback(async () => {
    if (!uploadedAvatar?.base64 || !hasScript) return;

    setIsGenerating(true);
    setVideoTask(null);
    setDidVideoUrl(null);
    setGenerationProgress(5);
    setStatusMessage('Preparando imagen...');

    try {
      // Step 1: Generate audio first
      setGenerationProgress(10);
      setStatusMessage('Generando audio...');
      
      let audioBase64: string | null = null;
      
      try {
        const audioResponse = await fetch('/api/voice/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: script,
            voice: voiceSettings.voice || 'es-maria',
            speed: voiceSettings.speed || 1.0,
          }),
        });

        if (audioResponse.ok) {
          const audioBlobResult = await audioResponse.blob();
          const audioObjUrl = URL.createObjectURL(audioBlobResult);
          setAudioUrl(audioObjUrl);
          setAudioBlob(audioBlobResult);
          
          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlobResult);
          await new Promise<void>((resolve) => {
            reader.onloadend = () => {
              audioBase64 = reader.result as string;
              resolve();
            };
          });
          
          setGenerationProgress(25);
          setStatusMessage('Audio generado ✓');
        }
      } catch (audioError) {
        console.log('Audio generation error:', audioError);
      }

      // Step 2: Create D-ID talk
      setGenerationProgress(30);
      setStatusMessage('Enviando a D-ID IA...');

      const didVoice = DID_VOICE_MAPPING[voiceSettings.voice || 'es-maria'] || 'es-MX-DaliaNeural';
      
      const payload: any = {
        sourceUrl: uploadedAvatar.base64,
        voiceId: didVoice,
        language: language || 'es',
      };

      // Use audio if available, otherwise use text
      if (audioBase64) {
        payload.audioUrl = audioBase64;
      } else {
        payload.text = script;
      }

      const response = await fetch('/api/video/did', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-did-api-key': didApiKey
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        // Check if API key is missing
        if (result.error?.includes('API key') || response.status === 401) {
          setShowApiKeyInput(true);
          throw new Error('Necesitas configurar tu API key de D-ID');
        }
        throw new Error(result.error || 'Error al crear video');
      }

      setGenerationProgress(40);
      setStatusMessage('Generando video con IA...');
      
      // Start polling for status
      const talkId = result.data.talkId;
      pollIntervalRef.current = setInterval(() => {
        pollDIDStatus(talkId);
      }, 3000);

      // Initial poll
      await pollDIDStatus(talkId);

    } catch (error) {
      console.error('D-ID generation error:', error);
      setIsGenerating(false);
      setGenerationProgress(0);
      setVideoTask({
        taskId: '',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }, [
    uploadedAvatar, 
    script, 
    voiceSettings,
    language,
    didApiKey,
    hasScript,
    setVideoTask,
    pollDIDStatus
  ]);

  // Generate with Canvas (fallback)
  const generateWithCanvas = useCallback(async () => {
    if (!uploadedAvatar?.base64 || !hasScript) return;

    setIsGenerating(true);
    setVideoTask(null);
    setVideoPackage(null);
    setGenerationProgress(0);
    setStatusMessage('Preparando...');
    setAudioUrl(null);
    setAudioBlob(null);

    try {
      // Generate audio
      setGenerationProgress(5);
      setStatusMessage('Generando audio...');
      
      let generatedAudioBlob: Blob | null = null;
      
      try {
        const audioResponse = await fetch('/api/voice/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: script,
            voice: voiceSettings.voice || 'es-maria',
            speed: voiceSettings.speed || 1.0,
          }),
        });

        if (audioResponse.ok) {
          generatedAudioBlob = await audioResponse.blob();
          const audioObjUrl = URL.createObjectURL(generatedAudioBlob);
          setAudioUrl(audioObjUrl);
          setAudioBlob(generatedAudioBlob);
          setGenerationProgress(20);
          setStatusMessage('Audio generado ✓');
        }
      } catch (audioError) {
        console.log('Audio generation skipped:', audioError);
      }

      // Generate video
      setStatusMessage('Creando video...');
      
      const result = await createFullVideoPackage(
        uploadedAvatar.base64,
        generatedAudioBlob,
        (progress, stage) => {
          setGenerationProgress(20 + progress * 0.8);
          setStatusMessage(stage);
        }
      );

      setVideoPackage(result);
      setGenerationProgress(100);
      setStatusMessage('¡Video generado!');
      
      setVideoTask({
        taskId: 'canvas-generated',
        status: 'SUCCESS',
        videoUrl: result.videoUrl,
        progress: 100,
      });

    } catch (error) {
      console.error('Canvas video generation failed:', error);
      setVideoTask({
        taskId: '',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [
    uploadedAvatar, 
    script, 
    voiceSettings, 
    setVideoTask,
    hasScript
  ]);

  const handleGenerate = useCallback(async () => {
    if (useDID && didApiKey) {
      await generateWithDID();
    } else {
      await generateWithCanvas();
    }
  }, [useDID, didApiKey, generateWithDID, generateWithCanvas]);

  const handlePlayAudio = useCallback(() => {
    if (audioRef.current && audioUrl) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  }, [audioUrl, isPlayingAudio]);

  const handleDownloadVideo = useCallback(() => {
    const url = didVideoUrl || videoPackage?.videoUrl;
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-video-${Date.now()}.mp4`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [didVideoUrl, videoPackage]);

  const handleDownloadAudio = useCallback(() => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `avatar-audio-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [audioUrl]);

  const handleReset = useCallback(() => {
    setVideoTask(null);
    setVideoPackage(null);
    setDidVideoUrl(null);
    setIsGenerating(false);
    setGenerationProgress(0);
    setStatusMessage('');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setAudioBlob(null);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [setVideoTask, audioUrl]);

  const hasVideo = !!(didVideoUrl || videoPackage?.videoUrl);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Generación de Video
        </CardTitle>
        <CardDescription>
          Crea tu video con avatar IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
          <Button
            variant={useDID ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setUseDID(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            IA D-ID (Recomendado)
          </Button>
          <Button
            variant={!useDID ? 'default' : 'ghost'}
            size="sm"
            className="flex-1"
            onClick={() => setUseDID(false)}
          >
            <FileVideo className="h-4 w-4 mr-2" />
            Básico
          </Button>
        </div>

        {/* D-ID API Key Input */}
        {useDID && (
          <div className="space-y-3">
            {!showApiKeyInput && didApiKey ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">API Key configurada ✓</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowApiKeyInput(true)}
                  className="h-7 text-xs"
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Key className="h-4 w-4" />
                  <span className="text-sm font-medium">Configura tu API Key de D-ID</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Para generar videos con movimientos naturales, ingresa tu API key de D-ID.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Pega aquí tu API key de D-ID..."
                    value={didApiKey}
                    onChange={(e) => setDidApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={saveApiKey} size="sm" className="px-4">
                    Guardar
                  </Button>
                </div>
                <a 
                  href="https://studio.d-id.com/account-settings" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Obtener API key gratis en D-ID (5 min de video gratis)
                </a>
              </div>
            )}
          </div>
        )}

        {/* Requirements Checklist */}
        <div className="space-y-2 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 text-sm">
            {hasAvatar ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={hasAvatar ? 'text-foreground' : 'text-muted-foreground'}>
              Avatar cargado
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {hasScript ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : script.length > 1024 ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : (
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={hasScript ? 'text-foreground' : script.length > 1024 ? 'text-destructive' : 'text-muted-foreground'}>
              Guión {script.length > 1024 ? '(excede 1024 chars)' : script.length === 0 ? '(vacío)' : '✓'}
            </span>
          </div>
          {useDID && (
            <div className="flex items-center gap-2 text-sm">
              {didApiKey ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span className={didApiKey ? 'text-foreground' : 'text-amber-600'}>
                API Key D-ID {didApiKey ? '✓' : '(requerida para IA)'}
              </span>
            </div>
          )}
        </div>

        {/* Validation Errors */}
        {!hasAvatar && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sube una imagen de avatar primero.
            </AlertDescription>
          </Alert>
        )}
        
        {!hasScript && script.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Escribe un guión para tu avatar.
            </AlertDescription>
          </Alert>
        )}

        {script.length > 1024 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              El guión excede el límite de 1024 caracteres.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">{statusMessage}</p>
                <p className="text-xs text-muted-foreground">{Math.round(generationProgress)}% completado</p>
              </div>
            </div>
            <Progress value={generationProgress} className="h-2" />
          </div>
        )}

        {/* Error Status */}
        {videoTask?.status === 'FAIL' && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
            <XCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {videoTask.error || 'Error al generar video'}
            </span>
          </div>
        )}

        {/* Audio Preview */}
        {audioUrl && !isGenerating && !hasVideo && (
          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground flex-1">Audio generado</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayAudio}
              className="h-8"
            >
              {isPlayingAudio ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onEnded={() => setIsPlayingAudio(false)}
            />
          </div>
        )}

        {/* Success - Video Result */}
        {hasVideo && (
          <div className="space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video rounded-xl overflow-hidden border border-border/50 bg-black">
              <video
                ref={videoRef}
                src={didVideoUrl || videoPackage?.videoUrl}
                className="w-full h-full object-contain"
                onEnded={() => setIsPlayingVideo(false)}
                controls
                autoPlay
              />
              <div className="absolute bottom-2 left-2 flex items-center">
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {useDID ? 'Video IA generado' : 'Video generado'}
                </Badge>
              </div>
            </div>
            
            {/* Duration Info */}
            {videoPackage && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Duración: {videoPackage.duration.toFixed(1)}s</span>
              </div>
            )}
            
            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleDownloadVideo} className="w-full">
                <FileVideo className="h-4 w-4 mr-2" />
                Descargar Video
              </Button>
              {audioUrl && (
                <Button variant="outline" onClick={handleDownloadAudio} className="w-full">
                  <Music className="h-4 w-4 mr-2" />
                  Descargar Audio
                </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={handleReset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generar Nuevo Video
            </Button>
          </div>
        )}

        {/* Generate Button */}
        {(!videoTask || videoTask.status === 'FAIL') && !hasVideo && (
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            disabled={!canGenerate || (useDID && !didApiKey)}
            onClick={handleGenerate}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                {useDID ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generar Video con IA
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    Generar Video Básico
                  </>
                )}
              </>
            )}
          </Button>
        )}

        {/* Mode Info */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          {useDID ? (
            <p>D-ID genera videos con movimientos naturales y sincronización labial.</p>
          ) : (
            <p>Modo básico: video simple con efectos sutiles.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
