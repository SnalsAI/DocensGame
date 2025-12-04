'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Settings,
  Wand2,
  RefreshCw,
  Book,
  Globe,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Type,
} from 'lucide-react';

interface AccessibleReaderProps {
  content: string;
  title?: string;
  className?: string;
  showControls?: boolean;
  allowSimplification?: boolean;
}

interface SimplifiedContent {
  original: string;
  dsa?: string;
  l2?: { level: string; text: string };
}

export function AccessibleReader({
  content,
  title,
  className = '',
  showControls = true,
  allowSimplification = true,
}: AccessibleReaderProps) {
  const { settings, speak, stopSpeaking, isSpeaking } = useAccessibility();
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState(content);
  const [contentVersion, setContentVersion] = useState<'original' | 'dsa' | 'l2'>('original');
  const [simplifiedVersions, setSimplifiedVersions] = useState<SimplifiedContent>({ original: content });
  const [showToolbar, setShowToolbar] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [isReading, setIsReading] = useState(false);

  // Parse content into paragraphs
  useEffect(() => {
    const paras = content.split(/\n\n|\n/).filter((p) => p.trim());
    setParagraphs(paras);
    setSimplifiedVersions({ original: content });
    setDisplayContent(content);
  }, [content]);

  // DSA simplification mutation
  const dsaSimplifyMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post('/ai/simplify', {
        content: text,
        type: 'dsa',
      });
      return response.data.simplified;
    },
    onSuccess: (simplified) => {
      setSimplifiedVersions((prev) => ({ ...prev, dsa: simplified }));
      setDisplayContent(simplified);
      setContentVersion('dsa');
    },
  });

  // L2 simplification mutation
  const l2SimplifyMutation = useMutation({
    mutationFn: async ({ text, level }: { text: string; level: string }) => {
      const response = await api.post('/ai/simplify', {
        content: text,
        type: 'l2',
        level,
      });
      return { level, text: response.data.simplified };
    },
    onSuccess: (result) => {
      setSimplifiedVersions((prev) => ({ ...prev, l2: result }));
      setDisplayContent(result.text);
      setContentVersion('l2');
    },
  });

  // Apply keywords highlighting for DSA
  const highlightKeywords = (text: string): string => {
    if (!settings.highlightKeywords) return text;

    // Common patterns for important words (dates, names, key terms)
    const patterns = [
      /\b\d{4}\b/g, // Years
      /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g, // Proper nouns
      /(?<=\*\*)[^*]+(?=\*\*)/g, // Bold text
    ];

    let result = text;
    patterns.forEach((pattern) => {
      result = result.replace(pattern, '<mark class="keyword">$&</mark>');
    });

    return result;
  };

  // Split text into syllables (simple Italian syllabification)
  const syllabify = (text: string): string => {
    if (!settings.showSyllables) return text;

    // Simple syllable split for Italian
    const vowels = 'aeiouàèéìòù';
    const words = text.split(/(\s+)/);

    return words
      .map((word) => {
        if (/\s/.test(word)) return word;

        let result = '';
        let syllable = '';

        for (let i = 0; i < word.length; i++) {
          const char = word[i].toLowerCase();
          syllable += word[i];

          if (vowels.includes(char)) {
            // Check if next char is consonant followed by vowel
            if (i < word.length - 2) {
              const next = word[i + 1].toLowerCase();
              const nextNext = word[i + 2].toLowerCase();
              if (!vowels.includes(next) && vowels.includes(nextNext)) {
                result += syllable + '·';
                syllable = '';
              }
            } else if (i < word.length - 1) {
              result += syllable + '·';
              syllable = '';
            }
          }
        }
        result += syllable;
        return result.replace(/·$/, '');
      })
      .join('');
  };

  // Process content for display
  const processContent = (text: string): string => {
    let processed = text;

    if (settings.highlightKeywords) {
      processed = highlightKeywords(processed);
    }

    if (settings.showSyllables) {
      // Only syllabify plain text, not HTML tags
      processed = processed.replace(/(?<!<[^>]*)([^<>]+)(?![^<]*>)/g, (match) =>
        syllabify(match)
      );
    }

    return processed;
  };

  // Text-to-speech controls
  const readParagraph = (index: number) => {
    if (index >= paragraphs.length) {
      setIsReading(false);
      return;
    }

    setCurrentParagraph(index);
    speak(paragraphs[index]);
  };

  const startReading = () => {
    setIsReading(true);
    readParagraph(currentParagraph);
  };

  const pauseReading = () => {
    setIsReading(false);
    stopSpeaking();
  };

  const nextParagraph = () => {
    if (currentParagraph < paragraphs.length - 1) {
      setCurrentParagraph((prev) => prev + 1);
      if (isReading) {
        readParagraph(currentParagraph + 1);
      }
    }
  };

  const prevParagraph = () => {
    if (currentParagraph > 0) {
      setCurrentParagraph((prev) => prev - 1);
      if (isReading) {
        readParagraph(currentParagraph - 1);
      }
    }
  };

  const switchVersion = (version: 'original' | 'dsa' | 'l2') => {
    if (version === 'original') {
      setDisplayContent(simplifiedVersions.original);
    } else if (version === 'dsa' && simplifiedVersions.dsa) {
      setDisplayContent(simplifiedVersions.dsa);
    } else if (version === 'l2' && simplifiedVersions.l2) {
      setDisplayContent(simplifiedVersions.l2.text);
    }
    setContentVersion(version);
  };

  // Font style based on settings
  const fontStyle = {
    fontSize:
      settings.fontSize === 'normal'
        ? '1rem'
        : settings.fontSize === 'large'
        ? '1.125rem'
        : '1.25rem',
    lineHeight:
      settings.lineHeight === 'normal'
        ? 1.6
        : settings.lineHeight === 'relaxed'
        ? 1.8
        : 2,
    letterSpacing:
      settings.letterSpacing === 'normal'
        ? 'normal'
        : settings.letterSpacing === 'wide'
        ? '0.025em'
        : '0.05em',
  };

  return (
    <div className={`accessible-reader ${className}`}>
      {/* Control Bar */}
      {showControls && (
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            {/* TTS Controls */}
            {settings.textToSpeech && (
              <>
                <button
                  onClick={prevParagraph}
                  disabled={currentParagraph === 0}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Paragrafo precedente"
                >
                  <SkipBack className="h-4 w-4" />
                </button>

                <button
                  onClick={isReading ? pauseReading : startReading}
                  className={`p-2 rounded-lg ${
                    isReading ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100'
                  }`}
                  title={isReading ? 'Pausa' : 'Leggi'}
                >
                  {isReading ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>

                <button
                  onClick={nextParagraph}
                  disabled={currentParagraph >= paragraphs.length - 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                  title="Paragrafo successivo"
                >
                  <SkipForward className="h-4 w-4" />
                </button>

                <span className="text-sm text-gray-500 ml-2">
                  {currentParagraph + 1}/{paragraphs.length}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Version Switcher */}
            {allowSimplification && (
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => switchVersion('original')}
                  className={`px-3 py-1 rounded text-sm ${
                    contentVersion === 'original'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Originale
                </button>

                <button
                  onClick={() => {
                    if (simplifiedVersions.dsa) {
                      switchVersion('dsa');
                    } else {
                      dsaSimplifyMutation.mutate(content);
                    }
                  }}
                  disabled={dsaSimplifyMutation.isPending}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    contentVersion === 'dsa'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {dsaSimplifyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Book className="h-3 w-3" />
                  )}
                  DSA
                </button>

                <button
                  onClick={() => {
                    if (simplifiedVersions.l2) {
                      switchVersion('l2');
                    } else {
                      l2SimplifyMutation.mutate({
                        text: content,
                        level: settings.l2Level || 'A2',
                      });
                    }
                  }}
                  disabled={l2SimplifyMutation.isPending}
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    contentVersion === 'l2'
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {l2SimplifyMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  L2
                </button>
              </div>
            )}

            {/* Settings Toggle */}
            <button
              onClick={() => setShowToolbar(!showToolbar)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Quick Settings Toolbar */}
      {showToolbar && (
        <div className="bg-gray-50 border-b px-4 py-3 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-500" />
            <select
              value={settings.fontSize}
              onChange={(e) => {/* Would need updateSettings from context */}}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="normal">Normale</option>
              <option value="large">Grande</option>
              <option value="x-large">Molto Grande</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.highlightKeywords}
              onChange={() => {/* Would need updateSettings from context */}}
              className="rounded text-primary-600"
            />
            Evidenzia parole chiave
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showSyllables}
              onChange={() => {/* Would need updateSettings from context */}}
              className="rounded text-primary-600"
            />
            Mostra sillabe
          </label>
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`
          prose max-w-none p-6
          ${settings.dsaMode ? 'dsa-content' : ''}
          ${settings.highContrast ? 'high-contrast' : ''}
        `}
        style={fontStyle}
      >
        {title && <h1 className="text-2xl font-bold mb-6">{title}</h1>}

        {paragraphs.map((para, idx) => (
          <p
            key={idx}
            className={`
              mb-4 p-2 rounded transition-colors
              ${idx === currentParagraph && isReading ? 'bg-yellow-100' : ''}
              ${idx === currentParagraph ? 'ring-2 ring-primary-200' : ''}
            `}
            onClick={() => {
              setCurrentParagraph(idx);
              if (settings.textToSpeech) {
                speak(para);
              }
            }}
            dangerouslySetInnerHTML={{
              __html: processContent(
                contentVersion === 'original'
                  ? para
                  : contentVersion === 'dsa' && simplifiedVersions.dsa
                  ? simplifiedVersions.dsa.split(/\n\n|\n/)[idx] || para
                  : contentVersion === 'l2' && simplifiedVersions.l2
                  ? simplifiedVersions.l2.text.split(/\n\n|\n/)[idx] || para
                  : para
              ),
            }}
          />
        ))}
      </div>

      {/* Reading Progress Indicator */}
      {isReading && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <Volume2 className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Lettura in corso...</span>
          <button
            onClick={pauseReading}
            className="p-1 hover:bg-primary-700 rounded"
          >
            <Pause className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .keyword {
          background-color: #fef3c7;
          padding: 0 4px;
          border-radius: 2px;
          font-weight: 600;
        }

        .dsa-content p {
          margin-bottom: 1.5em;
        }

        .high-contrast {
          background-color: #ffffff;
          color: #000000;
        }

        .high-contrast .keyword {
          background-color: #ffff00;
          color: #000000;
        }
      `}</style>
    </div>
  );
}

// Simple word tooltip for translations
interface WordTooltipProps {
  word: string;
  translation?: string;
  children: React.ReactNode;
}

export function WordTooltip({ word, translation, children }: WordTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (!translation) {
    return <>{children}</>;
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="border-b border-dotted border-primary-400 cursor-help">
        {children}
      </span>
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap z-10">
          {translation}
        </span>
      )}
    </span>
  );
}
