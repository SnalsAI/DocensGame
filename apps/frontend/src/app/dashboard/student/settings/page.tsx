'use client';

import { useState, useEffect } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import {
  Settings,
  Eye,
  Type,
  Volume2,
  Clock,
  Palette,
  Sparkles,
  Globe,
  BookOpen,
  Gamepad2,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Zap,
  HelpCircle,
  Play,
  Square,
  Loader2,
} from 'lucide-react';

export default function AccessibilitySettingsPage() {
  const {
    settings,
    updateSettings,
    resetSettings,
    applyDSAPreset,
    applyL2Preset,
    speak,
    stopSpeaking,
    isSpeaking,
  } = useAccessibility();

  const [expandedSection, setExpandedSection] = useState<string | null>('visual');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [testText] = useState(
    'Questo è un esempio di testo per testare le impostazioni di lettura.'
  );

  // Load available voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices.filter((v) => v.lang.startsWith('it')));
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({
    id,
    icon: Icon,
    title,
    description,
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 rounded-lg">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {expandedSection === id ? (
        <ChevronUp className="h-5 w-5 text-gray-400" />
      ) : (
        <ChevronDown className="h-5 w-5 text-gray-400" />
      )}
    </button>
  );

  const Toggle = ({
    checked,
    onChange,
    label,
    description,
  }: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label: string;
    description?: string;
  }) => (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );

  const Select = ({
    value,
    onChange,
    options,
    label,
  }: {
    value: string;
    onChange: (val: string) => void;
    options: { value: string; label: string }[];
    label: string;
  }) => (
    <div className="py-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const Slider = ({
    value,
    onChange,
    min,
    max,
    step,
    label,
    unit,
  }: {
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step: number;
    label: string;
    unit?: string;
  }) => (
    <div className="py-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-primary-600 font-medium">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-600"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary-600" />
            Impostazioni Accessibilità
          </h1>
          <p className="text-gray-600 mt-2">
            Personalizza l'esperienza di apprendimento in base alle tue esigenze
          </p>
        </div>

        {/* Quick Presets */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-6 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Profili Rapidi
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={applyDSAPreset}
              className="p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-left"
            >
              <BookOpen className="h-6 w-6 mb-2" />
              <p className="font-semibold">Profilo DSA</p>
              <p className="text-sm text-white/80">
                Font leggibile, più tempo, sintesi vocale
              </p>
            </button>
            <button
              onClick={() => applyL2Preset('A1')}
              className="p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-left"
            >
              <Globe className="h-6 w-6 mb-2" />
              <p className="font-semibold">Italiano L2 - A1</p>
              <p className="text-sm text-white/80">
                Testi semplificati, traduzioni, +50% tempo
              </p>
            </button>
            <button
              onClick={() => applyL2Preset('B1')}
              className="p-4 bg-white/20 rounded-xl hover:bg-white/30 transition-colors text-left"
            >
              <Globe className="h-6 w-6 mb-2" />
              <p className="font-semibold">Italiano L2 - B1</p>
              <p className="text-sm text-white/80">
                Supporto intermedio, +20% tempo
              </p>
            </button>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Visual Settings */}
          <div>
            <SectionHeader
              id="visual"
              icon={Eye}
              title="Impostazioni Visive"
              description="Dimensione testo, font, spaziatura"
            />
            {expandedSection === 'visual' && (
              <div className="mt-2 bg-white rounded-xl shadow-sm p-6">
                <Select
                  label="Dimensione Testo"
                  value={settings.fontSize}
                  onChange={(val) => updateSettings({ fontSize: val as any })}
                  options={[
                    { value: 'normal', label: 'Normale (16px)' },
                    { value: 'large', label: 'Grande (18px)' },
                    { value: 'x-large', label: 'Molto Grande (20px)' },
                  ]}
                />

                <Select
                  label="Font"
                  value={settings.fontFamily}
                  onChange={(val) => updateSettings({ fontFamily: val as any })}
                  options={[
                    { value: 'default', label: 'Predefinito' },
                    { value: 'opendyslexic', label: 'OpenDyslexic (per dislessia)' },
                    { value: 'atkinson', label: 'Atkinson Hyperlegible' },
                    { value: 'lexie', label: 'Lexie Readable' },
                  ]}
                />

                <Select
                  label="Interlinea"
                  value={settings.lineHeight}
                  onChange={(val) => updateSettings({ lineHeight: val as any })}
                  options={[
                    { value: 'normal', label: 'Normale' },
                    { value: 'relaxed', label: 'Ampia' },
                    { value: 'loose', label: 'Molto Ampia' },
                  ]}
                />

                <Select
                  label="Spaziatura Lettere"
                  value={settings.letterSpacing}
                  onChange={(val) => updateSettings({ letterSpacing: val as any })}
                  options={[
                    { value: 'normal', label: 'Normale' },
                    { value: 'wide', label: 'Ampia' },
                    { value: 'wider', label: 'Molto Ampia' },
                  ]}
                />

                <div className="border-t pt-4 mt-4">
                  <Toggle
                    label="Alto Contrasto"
                    description="Aumenta il contrasto per una migliore leggibilità"
                    checked={settings.highContrast}
                    onChange={(val) => updateSettings({ highContrast: val })}
                  />

                  <Toggle
                    label="Modalità Scura"
                    checked={settings.darkMode}
                    onChange={(val) => updateSettings({ darkMode: val })}
                  />

                  <Toggle
                    label="Riduci Animazioni"
                    description="Disabilita animazioni e transizioni"
                    checked={settings.reducedMotion}
                    onChange={(val) => updateSettings({ reducedMotion: val })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reading Aids */}
          <div>
            <SectionHeader
              id="reading"
              icon={BookOpen}
              title="Supporto Lettura"
              description="Evidenziazione, righello di lettura, DSA"
            />
            {expandedSection === 'reading' && (
              <div className="mt-2 bg-white rounded-xl shadow-sm p-6">
                <Toggle
                  label="Modalità DSA"
                  description="Attiva tutte le funzionalità per DSA"
                  checked={settings.dsaMode}
                  onChange={(val) => updateSettings({ dsaMode: val })}
                />

                <Toggle
                  label="Evidenzia Parole Chiave"
                  description="Mette in risalto i concetti importanti"
                  checked={settings.highlightKeywords}
                  onChange={(val) => updateSettings({ highlightKeywords: val })}
                />

                <Toggle
                  label="Righello di Lettura"
                  description="Linea guida per seguire il testo"
                  checked={settings.readingRuler}
                  onChange={(val) => updateSettings({ readingRuler: val })}
                />

                <Toggle
                  label="Evidenzia Focus"
                  description="Bordo visibile sull'elemento selezionato"
                  checked={settings.focusHighlight}
                  onChange={(val) => updateSettings({ focusHighlight: val })}
                />

                <Toggle
                  label="Nascondi Distrazioni"
                  description="Rimuove elementi decorativi non essenziali"
                  checked={settings.hideClutter}
                  onChange={(val) => updateSettings({ hideClutter: val })}
                />
              </div>
            )}
          </div>

          {/* L2 Support */}
          <div>
            <SectionHeader
              id="l2"
              icon={Globe}
              title="Supporto Italiano L2"
              description="Traduzioni, semplificazione testi"
            />
            {expandedSection === 'l2' && (
              <div className="mt-2 bg-white rounded-xl shadow-sm p-6">
                <Toggle
                  label="Modalità L2"
                  description="Attiva supporto per italiano come seconda lingua"
                  checked={settings.l2Mode}
                  onChange={(val) => updateSettings({ l2Mode: val })}
                />

                {settings.l2Mode && (
                  <>
                    <Select
                      label="Livello"
                      value={settings.l2Level}
                      onChange={(val) => updateSettings({ l2Level: val as any })}
                      options={[
                        { value: 'none', label: 'Nessuno' },
                        { value: 'A1', label: 'A1 - Principiante' },
                        { value: 'A2', label: 'A2 - Elementare' },
                        { value: 'B1', label: 'B1 - Intermedio' },
                      ]}
                    />

                    <Toggle
                      label="Mostra Traduzioni"
                      description="Visualizza traduzioni delle parole difficili"
                      checked={settings.showTranslations}
                      onChange={(val) => updateSettings({ showTranslations: val })}
                    />

                    {settings.showTranslations && (
                      <Select
                        label="Lingua Traduzioni"
                        value={settings.translationLanguage}
                        onChange={(val) => updateSettings({ translationLanguage: val })}
                        options={[
                          { value: 'en', label: 'English' },
                          { value: 'fr', label: 'Français' },
                          { value: 'es', label: 'Español' },
                          { value: 'de', label: 'Deutsch' },
                          { value: 'zh', label: '中文' },
                          { value: 'ar', label: 'العربية' },
                          { value: 'ro', label: 'Română' },
                          { value: 'uk', label: 'Українська' },
                        ]}
                      />
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Text to Speech */}
          <div>
            <SectionHeader
              id="tts"
              icon={Volume2}
              title="Sintesi Vocale"
              description="Lettura automatica dei contenuti"
            />
            {expandedSection === 'tts' && (
              <div className="mt-2 bg-white rounded-xl shadow-sm p-6">
                <Toggle
                  label="Attiva Sintesi Vocale"
                  description="Leggi i contenuti ad alta voce"
                  checked={settings.textToSpeech}
                  onChange={(val) => updateSettings({ textToSpeech: val })}
                />

                {settings.textToSpeech && (
                  <>
                    <Slider
                      label="Velocità Lettura"
                      value={settings.ttsSpeed}
                      onChange={(val) => updateSettings({ ttsSpeed: val })}
                      min={0.5}
                      max={2}
                      step={0.1}
                      unit="x"
                    />

                    <Select
                      label="Voce"
                      value={settings.ttsVoice}
                      onChange={(val) => updateSettings({ ttsVoice: val })}
                      options={[
                        { value: '', label: 'Predefinita' },
                        ...availableVoices.map((v) => ({
                          value: v.name,
                          label: v.name,
                        })),
                      ]}
                    />

                    <Toggle
                      label="Lettura Automatica"
                      description="Leggi automaticamente quando apri una pagina"
                      checked={settings.autoRead}
                      onChange={(val) => updateSettings({ autoRead: val })}
                    />

                    {/* Test TTS */}
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-3">{testText}</p>
                      <button
                        onClick={() => (isSpeaking ? stopSpeaking() : speak(testText))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                          isSpeaking
                            ? 'bg-red-100 text-red-700'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <Square className="h-4 w-4" />
                            Ferma
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Prova Lettura
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Game Settings */}
          <div>
            <SectionHeader
              id="games"
              icon={Gamepad2}
              title="Impostazioni Giochi"
              description="Tempo extra, feedback, istruzioni"
            />
            {expandedSection === 'games' && (
              <div className="mt-2 bg-white rounded-xl shadow-sm p-6">
                <Toggle
                  label="Tempo Extra"
                  description="Aggiungi tempo extra durante i giochi"
                  checked={settings.extraTime}
                  onChange={(val) => updateSettings({ extraTime: val })}
                />

                {settings.extraTime && (
                  <Slider
                    label="Percentuale Tempo Extra"
                    value={settings.extraTimePercent}
                    onChange={(val) => updateSettings({ extraTimePercent: val })}
                    min={10}
                    max={100}
                    step={10}
                    unit="%"
                  />
                )}

                <Toggle
                  label="Istruzioni Semplificate"
                  description="Mostra istruzioni più semplici e chiare"
                  checked={settings.simplifiedInstructions}
                  onChange={(val) => updateSettings({ simplifiedInstructions: val })}
                />

                <Toggle
                  label="Feedback Audio"
                  description="Suoni per risposte corrette/sbagliate"
                  checked={settings.audioFeedback}
                  onChange={(val) => updateSettings({ audioFeedback: val })}
                />

                <Toggle
                  label="Feedback Visivo"
                  description="Animazioni per risposte corrette/sbagliate"
                  checked={settings.visualFeedback}
                  onChange={(val) => updateSettings({ visualFeedback: val })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => {
              if (confirm('Sei sicuro di voler ripristinare tutte le impostazioni?')) {
                resetSettings();
              }
            }}
            className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            Ripristina Impostazioni
          </button>
        </div>

        {/* Preview Box */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary-600" />
            Anteprima Testo
          </h3>
          <div
            className="p-4 bg-gray-50 rounded-lg"
            style={{
              fontSize:
                settings.fontSize === 'normal'
                  ? '16px'
                  : settings.fontSize === 'large'
                  ? '18px'
                  : '20px',
              lineHeight:
                settings.lineHeight === 'normal'
                  ? 1.5
                  : settings.lineHeight === 'relaxed'
                  ? 1.75
                  : 2,
              letterSpacing:
                settings.letterSpacing === 'normal'
                  ? 0
                  : settings.letterSpacing === 'wide'
                  ? '0.05em'
                  : '0.1em',
            }}
          >
            <p className="mb-4">
              La <span className={settings.highlightKeywords ? 'bg-yellow-200 px-1 rounded font-semibold' : ''}>Rivoluzione Francese</span> fu un periodo di grande trasformazione politica e sociale in Francia.
              Iniziò nel <span className={settings.highlightKeywords ? 'bg-yellow-200 px-1 rounded font-semibold' : ''}>1789</span> con la presa della Bastiglia.
            </p>
            <p>
              Il motto "<span className={settings.highlightKeywords ? 'bg-yellow-200 px-1 rounded font-semibold' : ''}>Libertà, Uguaglianza, Fraternità</span>" divenne il simbolo di questa epoca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
