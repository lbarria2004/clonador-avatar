'use client';

import { AvatarUploader } from '@/components/AvatarUploader';
import { ScriptEditor } from '@/components/ScriptEditor';
import { VoiceConfigurator } from '@/components/VoiceConfigurator';
import { VoiceCloner } from '@/components/VoiceCloner';
import { ScenarioSelector } from '@/components/ScenarioSelector';
import { VideoGenerator } from '@/components/VideoGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Video, 
  Sparkles, 
  Wand2, 
  Settings, 
  Image as ImageIcon,
  Mic,
  FileText,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { useAvatarStore, useProgress, useAvatar } from '@/store/avatar-store';

export default function Home() {
  // Get state from global store
  const {
    script,
    language,
    voiceSettings,
    clonedVoice,
    scenarioSettings,
    videoTask,
    isAnalyzing,
    setScript,
    setLanguage,
    setVoiceSettings,
    setClonedVoice,
    setScenarioSettings,
    setVideoTask,
    setIsAnalyzing,
    reset,
  } = useAvatarStore();

  const { avatar, setAvatar } = useAvatar();
  const { completedSteps, allStepsComplete } = useProgress();

  const handleAvatarUpload = (data: { id: string; imageUrl: string; base64: string; analysis?: any }) => {
    setAvatar(data);
  };

  const handleVoiceClone = (voice: any) => {
    setClonedVoice(voice);
  };

  const handleClearClonedVoice = () => {
    setClonedVoice(null);
    setVoiceSettings({ ...voiceSettings, useClonedVoice: false });
  };

  // Custom background ahora es parte de scenarioSettings
  const customBackground = scenarioSettings.background === 'custom' ? null : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AI Avatar Studio</h1>
                <p className="text-xs text-muted-foreground">Crea videos con avatares personalizados impulsados por IA</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Impulsado por IA
              </Badge>
              <div className="flex items-center gap-1">
                {completedSteps.map((done, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      done ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="avatar" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="avatar" className="flex items-center gap-1.5">
                  <Wand2 className="h-4 w-4 hidden sm:block" />
                  Avatar
                  {completedSteps[0] && <span className="ml-1 text-primary">✓</span>}
                </TabsTrigger>
                <TabsTrigger value="script" className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 hidden sm:block" />
                  Script
                  {completedSteps[1] && <span className="ml-1 text-primary">✓</span>}
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center gap-1.5">
                  <Mic className="h-4 w-4 hidden sm:block" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="scenario" className="flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 hidden sm:block" />
                  Scene
                </TabsTrigger>
              </TabsList>

              <TabsContent value="avatar" className="mt-0">
                <AvatarUploader
                  onAvatarUpload={handleAvatarUpload}
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                />
              </TabsContent>

              <TabsContent value="script" className="mt-0">
                <ScriptEditor
                  script={script}
                  setScript={setScript}
                  language={language}
                  setLanguage={setLanguage}
                  speed={voiceSettings.speed}
                />
              </TabsContent>

              <TabsContent value="voice" className="mt-0 space-y-4">
                <VoiceCloner
                  onVoiceClone={handleVoiceClone}
                  clonedVoice={clonedVoice}
                  onClearClonedVoice={handleClearClonedVoice}
                />
                <VoiceConfigurator
                  voiceSettings={voiceSettings}
                  setVoiceSettings={setVoiceSettings}
                  clonedVoice={clonedVoice}
                />
              </TabsContent>

              <TabsContent value="scenario" className="mt-0">
                <ScenarioSelector
                  scenarioSettings={scenarioSettings}
                  setScenarioSettings={setScenarioSettings}
                  customBackground={null}
                  setCustomBackground={() => {}}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Preview & Generate */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Progreso de Configuración
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Subir Avatar', done: completedSteps[0] },
                  { label: 'Escribir Guion', done: completedSteps[1] },
                  { label: 'Configurar Voz', done: completedSteps[2] },
                  { label: 'Definir Escenario', done: completedSteps[3] },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                        step.done
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>
                      {step.label}
                    </span>
                    {step.done && (
                      <ChevronRight className="h-4 w-4 text-primary ml-auto" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Video Generator */}
            <VideoGenerator
              uploadedAvatar={avatar}
              script={script}
              language={language}
              voiceSettings={voiceSettings}
              scenarioSettings={scenarioSettings}
              customBackground={null}
              videoTask={videoTask}
              setVideoTask={setVideoTask}
            />

            {/* Quick Tips */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                Consejos Pro
              </h3>
              <ScrollArea className="h-32">
                <ul className="text-xs text-muted-foreground space-y-2">
                  <li>• Usa fotos de retrato de alta calidad para mejores resultados</li>
                  <li>• Mantén los guiones bajo 1024 caracteres para TTS óptimo</li>
                  <li>• Sube una muestra de tu voz para personalizar el audio</li>
                  <li>• Los escenarios de oficina funcionan genial para contenido profesional</li>
                  <li>• La iluminación natural da una sensación cálida y amigable</li>
                  <li>• Selecciona voces en español latino para contenido en español</li>
                </ul>
              </ScrollArea>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>AI Avatar Video Generator</span>
            <span>Powered by Multi-TTS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
