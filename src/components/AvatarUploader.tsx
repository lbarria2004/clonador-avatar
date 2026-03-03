'use client';

import { useCallback, useState, useEffect } from 'react';
import { Upload, X, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AvatarAnalysis } from '@/types';
import { cn } from '@/lib/utils';

interface AvatarUploaderProps {
  onAvatarUpload: (avatar: { id: string; imageUrl: string; base64: string; analysis?: AvatarAnalysis }) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export function AvatarUploader({ onAvatarUpload, isAnalyzing, setIsAnalyzing }: AvatarUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AvatarAnalysis | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }, []);

  const analyzeImage = useCallback(async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/avatar/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalysis(result.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [setIsAnalyzing]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    setUploadComplete(false);
    setAnalysis(null);
    
    try {
      const base64 = await convertToBase64(file);
      
      // Crear URL temporal para preview (evita guardar en localStorage)
      const blobUrl = URL.createObjectURL(file);
      setPreview(blobUrl);
      
      // Notificar al padre inmediatamente
      onAvatarUpload({
        id: crypto.randomUUID(),
        imageUrl: blobUrl,
        base64: base64,
      });
      setUploadComplete(true);
      
      // Analizar en segundo plano
      await analyzeImage(base64);
    } catch (error) {
      console.error('Error processing image:', error);
    }
  }, [convertToBase64, analyzeImage, onAvatarUpload]);

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

  const clearImage = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setAnalysis(null);
    setUploadComplete(false);
    onAvatarUpload({ id: '', imageUrl: '', base64: '' });
  }, [preview, onAvatarUpload]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Subir Avatar
          {uploadComplete && preview && (
            <CheckCircle className="h-4 w-4 text-green-500 ml-2" />
          )}
        </CardTitle>
        <CardDescription>
          Sube una foto para crear tu avatar con IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300",
              "flex flex-col items-center justify-center min-h-[250px] cursor-pointer",
              "hover:border-primary/50 hover:bg-primary/5",
              isDragging 
                ? "border-primary bg-primary/10 scale-[1.02]" 
                : "border-border/50"
            )}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-lg">Arrastra tu foto aquí</p>
                <p className="text-sm text-muted-foreground">
                  o haz clic para seleccionar
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">JPG</Badge>
                <Badge variant="outline" className="text-xs">PNG</Badge>
                <Badge variant="outline" className="text-xs">WebP</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Recomendado: Foto de retrato, iluminación frontal
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={preview}
                alt="Avatar preview"
                className="w-full aspect-square object-cover rounded-xl border border-border/50"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
              {isAnalyzing && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm font-medium">Analizando avatar...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Status indicator */}
            {uploadComplete && !isAnalyzing && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 p-3 rounded-lg">
                <CheckCircle className="h-4 w-4" />
                <span>Avatar listo para usar</span>
              </div>
            )}

            {analysis && (
              <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  Análisis IA
                </div>
                <p className="text-sm text-muted-foreground">{analysis.description}</p>
                
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Rasgos:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.facialFeatures.slice(0, 4).map((feature, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Estilos sugeridos:</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.suggestedStyles.slice(0, 3).map((style, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
