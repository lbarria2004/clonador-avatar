'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Wand2, Languages, AlertCircle } from 'lucide-react';
import { SCRIPT_TEMPLATES, LANGUAGE_OPTIONS, ScriptTemplate } from '@/types';
import { estimateDuration, formatDuration } from '@/lib/text-utils';
import { cn } from '@/lib/utils';

interface ScriptEditorProps {
  script: string;
  setScript: (script: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  speed: number;
}

export function ScriptEditor({ script, setScript, language, setLanguage, speed }: ScriptEditorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const charCount = script.length;
  const maxChars = 1024;
  const isOverLimit = charCount > maxChars;
  const estimatedDuration = estimateDuration(script, speed);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = SCRIPT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setScript(template.content);
      setLanguage(template.language);
      setSelectedTemplate(templateId);
    }
  }, [setScript, setLanguage]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScript(e.target.value);
    setSelectedTemplate('');
  }, [setScript]);

  return (
    <Card className="bg-gradient-to-br from-card to-card/95 border-border/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Script Editor
            </CardTitle>
            <CardDescription>
              Write or select a script for your avatar
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Script Templates */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Wand2 className="h-3 w-3" />
            Quick Templates
          </p>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {SCRIPT_TEMPLATES.map((template: ScriptTemplate) => (
                <Button
                  key={template.id}
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Enter your script here... The avatar will speak this text in the generated video."
            className={cn(
              "min-h-[180px] resize-none",
              isOverLimit && "border-destructive focus-visible:ring-destructive"
            )}
            value={script}
            onChange={handleTextChange}
          />
          
          <div className="flex items-center justify-between text-xs">
            <div className={cn(
              "flex items-center gap-1",
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            )}>
              {isOverLimit && <AlertCircle className="h-3 w-3" />}
              <span>{charCount} / {maxChars} chars</span>
              {isOverLimit && <span className="font-medium">(exceeds limit)</span>}
            </div>
            <div className="text-muted-foreground">
              Est. duration: {formatDuration(estimatedDuration)}
            </div>
          </div>
        </div>

        {/* Script Tips */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Tips:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Keep scripts under {maxChars} characters for best TTS quality</li>
            <li>Use clear punctuation for natural pauses</li>
            <li>Avoid abbreviations and spell out numbers</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
