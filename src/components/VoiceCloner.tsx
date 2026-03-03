'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Mic, 
  X, 
  Loader2, 
  CheckCircle2, 
  AudioWaveform,
  Sparkles,
  Play,
  Trash2,
  AlertCircle,
  FileAudio
} from 'lucide-react';
import { ClonedVoice } from '@/types';
import { cn } from '@/lib/utils';

interface VoiceClonerProps {
  onVoiceClone: (clonedVoice: ClonedVoice) => void;
  clonedVoice: ClonedVoice | null;
  onClearClonedVoice: () => void;
}

export function VoiceCloner({ onVoiceClone, clonedVoice, onClearClonedVoice }: VoiceClonerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  const analyzeVoiceSample = useCallback(async (base64Audio: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // Simulate progress while waiting for API
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioBase64: base64Audio }),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      const result = await response.json();

      if (result.success && result.data) {
        const { transcribedText, analysis, audioSampleId } = result.data;
        
        const newClonedVoice: ClonedVoice = {
          id: crypto.randomUUID(),
          name: 'Mi Voz Clonada',
          audioSampleId,
          transcribedText,
          analysis,
          createdAt: new Date(),
        };

        onVoiceClone(newClonedVoice);
      } else {
        throw new Error(result.error || 'Failed to analyze voice sample');
      }
    } catch (err) {
      console.error('Voice analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Error al analizar la muestra de voz');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [onVoiceClone]);

  const handleFile = useCallback(async (file: File) => {
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      setError('Por favor sube un archivo de audio válido');
      return;
    }

    // ASR only supports WAV and WebM formats
    const validFormats = ['audio/wav', 'audio/wave', 'audio/webm', 'audio/x-wav'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidFormat = validFormats.includes(file.type) || ['wav', 'webm'].includes(fileExtension || '');

    if (!isValidFormat) {
      setError(
        <div className="space-y-2">
          <p>Formato no soportado. El sistema solo acepta <strong>WAV</strong> o <strong>WebM</strong>.</p>
          <p className="text-xs">Tu archivo: <span className="font-mono">{file.name}</span></p>
          <p className="text-xs text-muted-foreground">
            💡 Puedes convertir tu audio a WAV usando: 
            <a href="https://online-audio-converter.com" target="_blank" rel="noopener noreferrer" className="text-primary underline ml-1">
              online-audio-converter.com
            </a>
          </p>
        </div>
      );
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es muy grande. Máximo 10MB.');
      return;
    }

    setError(null);
    setAudioPreview(null);
    onClearClonedVoice();

    try {
      const base64 = await convertToBase64(file);
      setAudioPreview(base64);
      
      // Start analysis
      await analyzeVoiceSample(base64);
    } catch (err) {
      console.error('File processing failed:', err);
      setError('Error al procesar el archivo de audio');
    }
  }, [convertToBase64, analyzeVoiceSample, onClearClonedVoice]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const clearAudio = useCallback(() => {
    setAudioPreview(null);
    setError(null);
    onClearClonedVoice();
  }, [onClearClonedVoice]);

  const playAudioPreview = useCallback(() => {
    if (audioRef.current && audioPreview) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioPreview]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Clonar Mi Voz
        </CardTitle>
        <CardDescription>
          Sube una muestra de tu voz para personalizar el audio (Solo WAV o WebM)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Cloned Voice Result */}
        {clonedVoice && !isAnalyzing && (
          <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-600 dark:text-green-400">
                  ¡Voz analizada correctamente!
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAudio}
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

            {/* Analysis Results */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Características detectadas:</p>
              <div className="flex flex-wrap gap-1">
                {clonedVoice.analysis.voiceCharacteristics.map((char, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Suggested Settings */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Velocidad sugerida:</span>
                <span className="ml-1 font-medium">{clonedVoice.analysis.suggestedSpeed.toFixed(1)}x</span>
              </div>
              <div className="p-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Tipo de voz:</span>
                <span className="ml-1 font-medium">{clonedVoice.analysis.suggestedVoiceType}</span>
              </div>
            </div>

            {/* Transcribed Text Preview */}
            {clonedVoice.transcribedText && (
              <div className="p-2 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Texto transcrito:</p>
                <p className="text-xs italic">"{clonedVoice.transcribedText.substring(0, 150)}..."</p>
              </div>
            )}
          </div>
        )}

        {/* Audio Preview */}
        {audioPreview && !clonedVoice && !isAnalyzing && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <FileAudio className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground flex-1">Audio cargado</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={playAudioPreview}
              className="h-8 w-8"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAudio}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <audio ref={audioRef} src={audioPreview} />
          </div>
        )}

        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Analizando muestra de voz...</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Upload Area */}
        {!audioPreview && !clonedVoice && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-6 transition-all duration-300",
              "flex flex-col items-center justify-center min-h-[150px] cursor-pointer",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragging 
                ? "border-primary bg-primary/10 scale-[1.02]" 
                : "border-border/50"
            )}
          >
            <input
              type="file"
              accept="audio/wav,audio/webm,audio/x-wav,.wav,.webm"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Arrastra tu audio aquí</p>
                <p className="text-xs text-muted-foreground">
                  o haz clic para seleccionar
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">WAV</Badge>
                <Badge variant="outline" className="text-xs">WebM</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Máximo 10MB
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="p-3 bg-muted/30 rounded-lg space-y-1">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Consejos para mejores resultados:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Graba entre 10-30 segundos de tu voz</li>
            <li>Habla de forma natural y clara</li>
            <li>Evita ruido de fondo</li>
            <li>Usa formato <strong>WAV</strong> para mejor calidad</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
