'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Volume2, Play, Loader2, Pause, Mic, Globe, Sparkles } from 'lucide-react';
import { VoiceSettings, VoiceOption, VOICE_OPTIONS, VoiceLanguage, ClonedVoice, VOICE_MAPPING } from '@/types';
import { cn } from '@/lib/utils';

interface VoiceConfiguratorProps {
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  clonedVoice: ClonedVoice | null;
}

export function VoiceConfigurator({ voiceSettings, setVoiceSettings, clonedVoice }: VoiceConfiguratorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<VoiceLanguage>('all');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter voices by language
  const filteredVoices = VOICE_OPTIONS.filter(voice => {
    if (selectedLanguage === 'all') return true;
    return voice.language === selectedLanguage;
  });

  // Group voices by language for better organization
  const voicesByLanguage = VOICE_OPTIONS.reduce((acc, voice) => {
    const lang = voice.language;
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(voice);
    return acc;
  }, {} as Record<VoiceLanguage, VoiceOption[]>);

  const selectedVoice = VOICE_OPTIONS.find(v => v.value === voiceSettings.voice);

  const handleVoiceChange = useCallback((value: string) => {
    setVoiceSettings({
      ...voiceSettings,
      voice: value as VoiceSettings['voice'],
      useClonedVoice: false,
    });
  }, [voiceSettings, setVoiceSettings]);

  const handleSpeedChange = useCallback((value: number[]) => {
    setVoiceSettings({
      ...voiceSettings,
      speed: value[0],
    });
  }, [voiceSettings, setVoiceSettings]);

  const handleVolumeChange = useCallback((value: number[]) => {
    setVoiceSettings({
      ...voiceSettings,
      volume: value[0],
    });
  }, [voiceSettings, setVoiceSettings]);

  const handleUseClonedVoice = useCallback(() => {
    if (clonedVoice) {
      setVoiceSettings({
        ...voiceSettings,
        useClonedVoice: true,
        speed: clonedVoice.analysis.suggestedSpeed,
      });
    }
  }, [clonedVoice, voiceSettings, setVoiceSettings]);

  // Get the actual voice to use for TTS (map Spanish voices to actual TTS voices)
  const getActualVoice = useCallback(() => {
    if (voiceSettings.useClonedVoice) {
      // Use a default voice for cloned voice
      return 'luodo';
    }
    // Map Spanish Latino voices to actual TTS voices
    if (VOICE_MAPPING[voiceSettings.voice]) {
      return VOICE_MAPPING[voiceSettings.voice];
    }
    return voiceSettings.voice;
  }, [voiceSettings]);

  const handlePreview = useCallback(async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const actualVoice = getActualVoice();
      
      const response = await fetch('/api/voice/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '¡Hola! Esta es una vista previa de la voz seleccionada. ¿Cómo suena?',
          voice: actualVoice,
          speed: voiceSettings.speed,
          volume: voiceSettings.volume,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [voiceSettings, isPlaying, getActualVoice]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          Configuración de Voz
        </CardTitle>
        <CardDescription>
          Selecciona voz y ajusta los parámetros de audio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Mode Tabs */}
        <Tabs defaultValue="preset" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="preset" className="flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Voces Predefinidas
            </TabsTrigger>
            <TabsTrigger value="cloned" className="flex items-center gap-1.5" disabled={!clonedVoice}>
              <Mic className="h-4 w-4" />
              Mi Voz {clonedVoice && '✓'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4 mt-0">
            {/* Language Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Filtrar por idioma:</Label>
              <div className="flex flex-wrap gap-1">
                {[
                  { value: 'all', label: 'Todas', flag: '🌐' },
                  { value: 'spanish-latino', label: 'Español Latino', flag: '🌎' },
                  { value: 'english', label: 'Inglés', flag: '🇬🇧' },
                  { value: 'neutral', label: 'Neutral', flag: '🌐' },
                ].map((lang) => (
                  <Button
                    key={lang.value}
                    variant={selectedLanguage === lang.value ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedLanguage(lang.value as VoiceLanguage)}
                  >
                    <span className="mr-1">{lang.flag}</span>
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label>Voz</Label>
              <Select value={voiceSettings.voice} onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una voz" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[250px]">
                    {selectedLanguage === 'all' ? (
                      // Show grouped by language
                      Object.entries(voicesByLanguage).map(([lang, voices]) => (
                        <div key={lang}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                            {lang === 'spanish-latino' && '🌎 Español Latino'}
                            {lang === 'english' && '🇬🇧 Inglés'}
                            {lang === 'chinese' && '🇨🇳 Chino'}
                            {lang === 'neutral' && '🌐 Neutral'}
                          </div>
                          {voices.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2 py-1">
                                <span>{option.flag}</span>
                                <span className="font-medium">{option.label}</span>
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {option.gender === 'male' ? '♂' : option.gender === 'female' ? '♀' : '⚪'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </div>
                      ))
                    ) : (
                      // Show filtered list
                      filteredVoices.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2 py-1">
                            <span>{option.flag}</span>
                            <span className="font-medium">{option.label}</span>
                            <Badge variant="outline" className="text-xs ml-auto">
                              {option.gender === 'male' ? '♂' : option.gender === 'female' ? '♀' : '⚪'}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </ScrollArea>
                </SelectContent>
              </Select>
              {selectedVoice && (
                <p className="text-xs text-muted-foreground">{selectedVoice.description}</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cloned" className="space-y-4 mt-0">
            {clonedVoice ? (
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="font-medium">Usando tu voz clonada</span>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Características aplicadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {clonedVoice.analysis.voiceCharacteristics.map((char, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant={voiceSettings.useClonedVoice ? "default" : "outline"}
                  className="w-full"
                  onClick={handleUseClonedVoice}
                >
                  {voiceSettings.useClonedVoice ? '✓ Voz Clonada Activada' : 'Activar Mi Voz'}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-muted/50 rounded-xl text-center">
                <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sube una muestra de tu voz en la sección "Clonar Mi Voz" para usar esta opción
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Speed Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Velocidad</Label>
            <span className="text-sm text-muted-foreground">{voiceSettings.speed.toFixed(1)}x</span>
          </div>
          <Slider
            value={[voiceSettings.speed]}
            onValueChange={handleSpeedChange}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lento</span>
            <span>Normal</span>
            <span>Rápido</span>
          </div>
        </div>

        {/* Volume Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Volumen</Label>
            <span className="text-sm text-muted-foreground">{voiceSettings.volume.toFixed(1)}</span>
          </div>
          <Slider
            value={[voiceSettings.volume]}
            onValueChange={handleVolumeChange}
            min={0.1}
            max={10}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Suave</span>
            <span>Medio</span>
            <span>Fuerte</span>
          </div>
        </div>

        {/* Preview Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handlePreview}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4 mr-2" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Cargando...' : isPlaying ? 'Detener' : 'Vista Previa de Voz'}
        </Button>
      </CardContent>
    </Card>
  );
}
