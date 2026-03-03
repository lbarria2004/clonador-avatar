'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ScenarioSettings, 
  BACKGROUND_OPTIONS, 
  CAMERA_ANGLE_OPTIONS, 
  LIGHTING_OPTIONS, 
  CLOTHING_STYLE_OPTIONS 
} from '@/types';
import { Camera, Lightbulb, Shirt, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';

interface ScenarioSelectorProps {
  scenarioSettings: ScenarioSettings;
  setScenarioSettings: (settings: ScenarioSettings) => void;
  customBackground: string | null;
  setCustomBackground: (bg: string | null) => void;
}

export function ScenarioSelector({ 
  scenarioSettings, 
  setScenarioSettings,
  customBackground,
  setCustomBackground 
}: ScenarioSelectorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleBackgroundChange = useCallback(async (value: string) => {
    setScenarioSettings({
      ...scenarioSettings,
      background: value as ScenarioSettings['background'],
    });

    if (value !== 'custom') {
      setCustomBackground(null);
    }
  }, [scenarioSettings, setScenarioSettings, setCustomBackground]);

  const handleCameraAngleChange = useCallback((value: string) => {
    setScenarioSettings({
      ...scenarioSettings,
      cameraAngle: value as ScenarioSettings['cameraAngle'],
    });
  }, [scenarioSettings, setScenarioSettings]);

  const handleLightingChange = useCallback((value: string) => {
    setScenarioSettings({
      ...scenarioSettings,
      lighting: value as ScenarioSettings['lighting'],
    });
  }, [scenarioSettings, setScenarioSettings]);

  const handleClothingChange = useCallback((value: string) => {
    setScenarioSettings({
      ...scenarioSettings,
      clothingStyle: value as ScenarioSettings['clothingStyle'],
    });
  }, [scenarioSettings, setScenarioSettings]);

  const generateCustomBackground = useCallback(async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/scenario/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundType: scenarioSettings.background }),
      });

      const result = await response.json();
      if (result.success && result.data?.image) {
        setCustomBackground(result.data.image);
      }
    } catch (error) {
      console.error('Background generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [scenarioSettings.background, setCustomBackground]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Scenario & Styling
        </CardTitle>
        <CardDescription>
          Configure the visual environment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Background Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Background
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {BACKGROUND_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={scenarioSettings.background === option.value ? "default" : "outline"}
                className={cn(
                  "justify-start h-auto py-2 px-3",
                  scenarioSettings.background === option.value && "ring-2 ring-primary"
                )}
                onClick={() => handleBackgroundChange(option.value)}
              >
                <span className="mr-2 text-lg">{option.icon}</span>
                <span className="text-sm">{option.label}</span>
              </Button>
            ))}
          </div>
          
          {scenarioSettings.background === 'custom' && (
            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={generateCustomBackground}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Background
              </Button>
              
              {customBackground && (
                <img
                  src={customBackground}
                  alt="Generated custom background preview"
                  className="w-full h-24 object-cover rounded-lg border"
                />
              )}
            </div>
          )}
        </div>

        {/* Camera Angle */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Camera Angle
          </Label>
          <RadioGroup
            value={scenarioSettings.cameraAngle}
            onValueChange={handleCameraAngleChange}
            className="grid grid-cols-1 gap-2"
          >
            {CAMERA_ANGLE_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-2 rounded-lg border transition-colors",
                  scenarioSettings.cameraAngle === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-border"
                )}
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <div className="flex-1">
                  <Label htmlFor={option.value} className="font-medium cursor-pointer">
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Lighting */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Lighting
          </Label>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {LIGHTING_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={scenarioSettings.lighting === option.value ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleLightingChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Clothing Style */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            Clothing Style
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {CLOTHING_STYLE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={scenarioSettings.clothingStyle === option.value ? "default" : "outline"}
                className="justify-start"
                onClick={() => handleClothingChange(option.value)}
              >
                <span className="mr-2">{option.icon}</span>
                <span className="text-xs">{option.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
