'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AccessibilitySettings {
  // Visual settings
  fontSize: 'normal' | 'large' | 'x-large';
  lineHeight: 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'normal' | 'wide' | 'wider';
  fontFamily: 'default' | 'opendyslexic' | 'atkinson' | 'lexie';

  // Color settings
  highContrast: boolean;
  darkMode: boolean;
  reducedMotion: boolean;

  // DSA specific
  dsaMode: boolean;
  showSyllables: boolean;
  highlightKeywords: boolean;

  // L2 specific
  l2Mode: boolean;
  l2Level: 'A1' | 'A2' | 'B1' | 'none';
  showTranslations: boolean;
  translationLanguage: string;

  // Audio settings
  textToSpeech: boolean;
  ttsSpeed: number; // 0.5 - 2
  ttsVoice: string;
  autoRead: boolean;

  // Game settings
  extraTime: boolean;
  extraTimePercent: number; // 10-100
  simplifiedInstructions: boolean;
  audioFeedback: boolean;
  visualFeedback: boolean;

  // Focus aids
  readingRuler: boolean;
  focusHighlight: boolean;
  hideClutter: boolean;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 'normal',
  lineHeight: 'normal',
  letterSpacing: 'normal',
  fontFamily: 'default',
  highContrast: false,
  darkMode: false,
  reducedMotion: false,
  dsaMode: false,
  showSyllables: false,
  highlightKeywords: false,
  l2Mode: false,
  l2Level: 'none',
  showTranslations: false,
  translationLanguage: 'en',
  textToSpeech: false,
  ttsSpeed: 1,
  ttsVoice: '',
  autoRead: false,
  extraTime: false,
  extraTimePercent: 30,
  simplifiedInstructions: false,
  audioFeedback: true,
  visualFeedback: true,
  readingRuler: false,
  focusHighlight: false,
  hideClutter: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
  applyDSAPreset: () => void;
  applyL2Preset: (level: 'A1' | 'A2' | 'B1') => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const STORAGE_KEY = 'edu-atelier-accessibility';

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
        } catch (e) {
          console.error('Failed to parse accessibility settings:', e);
        }
      }
      setSpeechSynthesis(window.speechSynthesis);
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  // Apply CSS variables based on settings
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Font size
    const fontSizes = { normal: '16px', large: '18px', 'x-large': '20px' };
    root.style.setProperty('--a11y-font-size', fontSizes[settings.fontSize]);

    // Line height
    const lineHeights = { normal: '1.5', relaxed: '1.75', loose: '2' };
    root.style.setProperty('--a11y-line-height', lineHeights[settings.lineHeight]);

    // Letter spacing
    const letterSpacings = { normal: '0', wide: '0.05em', wider: '0.1em' };
    root.style.setProperty('--a11y-letter-spacing', letterSpacings[settings.letterSpacing]);

    // Font family
    const fontFamilies = {
      default: 'system-ui, sans-serif',
      opendyslexic: '"OpenDyslexic", sans-serif',
      atkinson: '"Atkinson Hyperlegible", sans-serif',
      lexie: '"Lexie Readable", sans-serif',
    };
    root.style.setProperty('--a11y-font-family', fontFamilies[settings.fontFamily]);

    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    root.classList.toggle('dark-mode', settings.darkMode);
    root.classList.toggle('reduced-motion', settings.reducedMotion);
    root.classList.toggle('dsa-mode', settings.dsaMode);
    root.classList.toggle('reading-ruler', settings.readingRuler);
    root.classList.toggle('focus-highlight', settings.focusHighlight);
    root.classList.toggle('hide-clutter', settings.hideClutter);

  }, [settings]);

  const updateSettings = (partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const applyDSAPreset = () => {
    setSettings((prev) => ({
      ...prev,
      dsaMode: true,
      fontSize: 'large',
      lineHeight: 'relaxed',
      letterSpacing: 'wide',
      fontFamily: 'opendyslexic',
      highlightKeywords: true,
      extraTime: true,
      extraTimePercent: 30,
      simplifiedInstructions: true,
      textToSpeech: true,
      ttsSpeed: 0.9,
      readingRuler: true,
    }));
  };

  const applyL2Preset = (level: 'A1' | 'A2' | 'B1') => {
    setSettings((prev) => ({
      ...prev,
      l2Mode: true,
      l2Level: level,
      fontSize: 'large',
      lineHeight: 'relaxed',
      showTranslations: true,
      simplifiedInstructions: true,
      textToSpeech: true,
      ttsSpeed: 0.8,
      extraTime: true,
      extraTimePercent: level === 'A1' ? 50 : level === 'A2' ? 30 : 20,
    }));
  };

  const speak = (text: string) => {
    if (!speechSynthesis || !settings.textToSpeech) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.ttsSpeed;
    utterance.lang = 'it-IT';

    if (settings.ttsVoice) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name === settings.ttsVoice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        resetSettings,
        applyDSAPreset,
        applyL2Preset,
        speak,
        stopSpeaking,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// CSS to be added globally
export const accessibilityCSS = `
  :root {
    --a11y-font-size: 16px;
    --a11y-line-height: 1.5;
    --a11y-letter-spacing: 0;
    --a11y-font-family: system-ui, sans-serif;
  }

  /* Apply accessibility settings to body */
  body.a11y-active {
    font-size: var(--a11y-font-size);
    line-height: var(--a11y-line-height);
    letter-spacing: var(--a11y-letter-spacing);
    font-family: var(--a11y-font-family);
  }

  /* High contrast mode */
  .high-contrast {
    --primary-600: #0000FF;
    --text-primary: #000000;
    --text-secondary: #333333;
    --bg-primary: #FFFFFF;
    --bg-secondary: #F0F0F0;
  }

  .high-contrast body {
    background-color: #FFFFFF !important;
    color: #000000 !important;
  }

  .high-contrast a {
    color: #0000FF !important;
    text-decoration: underline !important;
  }

  .high-contrast button {
    border: 2px solid #000000 !important;
  }

  /* Dark mode */
  .dark-mode {
    color-scheme: dark;
  }

  .dark-mode body {
    background-color: #1a1a2e !important;
    color: #eaeaea !important;
  }

  /* Reduced motion */
  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* DSA mode - extra styles */
  .dsa-mode .keyword {
    background-color: #fff3cd;
    padding: 0 4px;
    border-radius: 2px;
    font-weight: 600;
  }

  .dsa-mode p {
    margin-bottom: 1.5em;
  }

  /* Reading ruler */
  .reading-ruler body {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='60'%3E%3Crect width='200' height='2' y='29' fill='%23FFD700' opacity='0.8'/%3E%3C/svg%3E") 100 30, auto;
  }

  /* Focus highlight */
  .focus-highlight *:focus {
    outline: 3px solid #FFD700 !important;
    outline-offset: 2px !important;
  }

  /* Hide clutter */
  .hide-clutter .decorative,
  .hide-clutter .ad,
  .hide-clutter .sidebar-widget {
    display: none !important;
  }

  /* OpenDyslexic font */
  @font-face {
    font-family: 'OpenDyslexic';
    src: url('/fonts/OpenDyslexic-Regular.woff2') format('woff2');
    font-weight: normal;
  }

  @font-face {
    font-family: 'OpenDyslexic';
    src: url('/fonts/OpenDyslexic-Bold.woff2') format('woff2');
    font-weight: bold;
  }

  /* Atkinson Hyperlegible font */
  @font-face {
    font-family: 'Atkinson Hyperlegible';
    src: url('/fonts/AtkinsonHyperlegible-Regular.woff2') format('woff2');
    font-weight: normal;
  }

  @font-face {
    font-family: 'Atkinson Hyperlegible';
    src: url('/fonts/AtkinsonHyperlegible-Bold.woff2') format('woff2');
    font-weight: bold;
  }
`;
