'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  BookOpen,
  Share2,
  Download,
  Edit,
  Users,
  Eye,
  Clock,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';

type InteractionType = 'QUIZ' | 'SUMMARY' | 'HOTSPOT' | 'REFLECTION';

type VideoInteraction = {
  id: string;
  type: InteractionType;
  timestamp: number;
  duration?: number;
  data: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
    text?: string;
    hint?: string;
  };
};

type VideoLesson = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  status: string;
  viewCount: number;
  avatarType: string;
  voiceType: string;
  interactions: VideoInteraction[];
  content?: { id: string; title: string };
  chapters?: { title: string; timestamp: number }[];
  createdAt: string;
};

export default function LessonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  // H5P interaction state
  const [activeInteraction, setActiveInteraction] = useState<VideoInteraction | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Editor mode
  const [isEditing, setIsEditing] = useState(false);
  const [newInteraction, setNewInteraction] = useState<Partial<VideoInteraction> | null>(null);

  // Fetch lesson
  const { data: lesson, isLoading } = useQuery<VideoLesson>({
    queryKey: ['lesson', params.id],
    queryFn: () => api.get(`/lessons/${params.id}`).then((res) => res.data),
  });

  // Add interaction mutation
  const addInteractionMutation = useMutation({
    mutationFn: (interaction: Partial<VideoInteraction>) =>
      api.post(`/lessons/${params.id}/interactions`, interaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', params.id] });
      setNewInteraction(null);
    },
  });

  // Delete interaction mutation
  const deleteInteractionMutation = useMutation({
    mutationFn: (interactionId: string) =>
      api.delete(`/lessons/${params.id}/interactions/${interactionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson', params.id] });
    },
  });

  // Check for interactions at current timestamp
  useEffect(() => {
    if (!lesson?.interactions || isEditing) return;

    const interaction = lesson.interactions.find(
      (i) =>
        currentTime >= i.timestamp &&
        currentTime < i.timestamp + (i.duration || 5) &&
        !activeInteraction
    );

    if (interaction) {
      setActiveInteraction(interaction);
      videoRef.current?.pause();
      setIsPlaying(false);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentTime, lesson?.interactions, isEditing, activeInteraction]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Interaction handlers
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null || !activeInteraction) return;

    const correct = selectedAnswer === activeInteraction.data.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handleContinue = () => {
    setActiveInteraction(null);
    setShowFeedback(false);
    setSelectedAnswer(null);
    videoRef.current?.play();
    setIsPlaying(true);
  };

  const handleAddInteraction = (type: InteractionType) => {
    setNewInteraction({
      type,
      timestamp: currentTime,
      data: {},
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Video lezione non trovata</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/teacher/lessons"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-white font-semibold">{lesson.title}</h1>
              <p className="text-sm text-gray-400">
                {lesson.content?.title || 'Video lezione'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 ${
                isEditing
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Edit className="h-4 w-4" />
              {isEditing ? 'Modifica attiva' : 'Modifica H5P'}
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {/* Video element */}
              {lesson.videoUrl ? (
                <video
                  ref={videoRef}
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Video in elaborazione...</p>
                  </div>
                </div>
              )}

              {/* H5P Interaction Overlay */}
              {activeInteraction && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-8">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
                    {activeInteraction.type === 'QUIZ' && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-primary-100 rounded-lg">
                            <HelpCircle className="h-6 w-6 text-primary-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Domanda Quiz
                          </h3>
                        </div>

                        <p className="text-gray-700 mb-4">
                          {activeInteraction.data.question}
                        </p>

                        {!showFeedback ? (
                          <>
                            <div className="space-y-2 mb-6">
                              {activeInteraction.data.options?.map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedAnswer(idx)}
                                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                                    selectedAnswer === idx
                                      ? 'border-primary-500 bg-primary-50'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <span className="font-medium mr-2">
                                    {String.fromCharCode(65 + idx)}.
                                  </span>
                                  {option}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={handleAnswerSubmit}
                              disabled={selectedAnswer === null}
                              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Conferma Risposta
                            </button>
                          </>
                        ) : (
                          <>
                            <div
                              className={`p-4 rounded-lg mb-4 ${
                                isCorrect ? 'bg-green-100' : 'bg-red-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                {isCorrect ? (
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                  <HelpCircle className="h-5 w-5 text-red-600" />
                                )}
                                <span
                                  className={`font-semibold ${
                                    isCorrect ? 'text-green-700' : 'text-red-700'
                                  }`}
                                >
                                  {isCorrect ? 'Corretto!' : 'Non corretto'}
                                </span>
                              </div>
                              {!isCorrect && activeInteraction.data.hint && (
                                <p className="text-sm text-gray-600">
                                  {activeInteraction.data.hint}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={handleContinue}
                              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                            >
                              Continua
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {activeInteraction.type === 'SUMMARY' && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Riepilogo
                          </h3>
                        </div>

                        <p className="text-gray-700 mb-6">
                          {activeInteraction.data.text}
                        </p>

                        <button
                          onClick={handleContinue}
                          className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                        >
                          Continua
                        </button>
                      </>
                    )}

                    {activeInteraction.type === 'REFLECTION' && (
                      <>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Riflessione
                          </h3>
                        </div>

                        <p className="text-gray-700 mb-4">
                          {activeInteraction.data.question}
                        </p>

                        <textarea
                          placeholder="Scrivi la tua riflessione..."
                          className="w-full p-3 border rounded-lg mb-4 resize-none"
                          rows={4}
                        />

                        <button
                          onClick={handleContinue}
                          className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700"
                        >
                          Continua
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Interaction markers on timeline */}
              {isEditing && lesson.interactions && (
                <div className="absolute bottom-20 left-0 right-0 px-4">
                  {lesson.interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="absolute w-3 h-3 bg-yellow-400 rounded-full cursor-pointer transform -translate-x-1/2"
                      style={{
                        left: `${(interaction.timestamp / duration) * 100}%`,
                      }}
                      title={`${interaction.type} @ ${formatTime(interaction.timestamp)}`}
                    />
                  ))}
                </div>
              )}

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress bar */}
                <div className="relative mb-3">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                  />

                  {/* Interaction markers */}
                  {lesson.interactions?.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="absolute top-0 w-1 h-1 bg-yellow-400 rounded-full transform -translate-y-0"
                      style={{
                        left: `${(interaction.timestamp / (duration || 1)) * 100}%`,
                      }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => skip(-10)}
                      className="text-white hover:text-primary-400"
                    >
                      <SkipBack className="h-5 w-5" />
                    </button>
                    <button
                      onClick={togglePlay}
                      className="p-2 bg-white rounded-full text-gray-900 hover:bg-gray-100"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => skip(10)}
                      className="text-white hover:text-primary-400"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>

                    <span className="text-white text-sm ml-2">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="text-white hover:text-primary-400"
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.1}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          setVolume(parseFloat(e.target.value));
                          setIsMuted(false);
                          if (videoRef.current) {
                            videoRef.current.volume = parseFloat(e.target.value);
                          }
                        }}
                        className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-white hover:text-primary-400"
                      >
                        <Settings className="h-5 w-5" />
                      </button>

                      {showSettings && (
                        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded-lg py-2 min-w-[120px]">
                          <p className="text-xs text-gray-400 px-3 mb-1">Velocità</p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setPlaybackRate(rate);
                                if (videoRef.current) {
                                  videoRef.current.playbackRate = rate;
                                }
                              }}
                              className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-700 ${
                                playbackRate === rate
                                  ? 'text-primary-400'
                                  : 'text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button className="text-white hover:text-primary-400">
                      <Maximize className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* H5P Editor Panel */}
            {isEditing && (
              <div className="mt-4 bg-gray-800 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">
                  Aggiungi Interazione H5P
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  Posiziona il video al punto desiderato e aggiungi un'interazione
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleAddInteraction('QUIZ')}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Quiz
                  </button>
                  <button
                    onClick={() => handleAddInteraction('SUMMARY')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Riepilogo
                  </button>
                  <button
                    onClick={() => handleAddInteraction('REFLECTION')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Riflessione
                  </button>
                </div>

                {/* New interaction form */}
                {newInteraction && (
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">
                        Nuova {newInteraction.type} @ {formatTime(newInteraction.timestamp || 0)}
                      </span>
                      <button
                        onClick={() => setNewInteraction(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {newInteraction.type === 'QUIZ' && (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Domanda..."
                          className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg"
                          onChange={(e) =>
                            setNewInteraction({
                              ...newInteraction,
                              data: { ...newInteraction.data, question: e.target.value },
                            })
                          }
                        />
                        {[0, 1, 2, 3].map((idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct"
                              onChange={() =>
                                setNewInteraction({
                                  ...newInteraction,
                                  data: { ...newInteraction.data, correctAnswer: idx },
                                })
                              }
                            />
                            <input
                              type="text"
                              placeholder={`Opzione ${idx + 1}...`}
                              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg"
                              onChange={(e) => {
                                const options = newInteraction.data?.options || ['', '', '', ''];
                                options[idx] = e.target.value;
                                setNewInteraction({
                                  ...newInteraction,
                                  data: { ...newInteraction.data, options },
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {(newInteraction.type === 'SUMMARY' || newInteraction.type === 'REFLECTION') && (
                      <textarea
                        placeholder={newInteraction.type === 'SUMMARY' ? 'Testo del riepilogo...' : 'Domanda per la riflessione...'}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg resize-none"
                        rows={3}
                        onChange={(e) =>
                          setNewInteraction({
                            ...newInteraction,
                            data: {
                              ...newInteraction.data,
                              [newInteraction.type === 'SUMMARY' ? 'text' : 'question']: e.target.value,
                            },
                          })
                        }
                      />
                    )}

                    <button
                      onClick={() => addInteractionMutation.mutate(newInteraction)}
                      disabled={addInteractionMutation.isPending}
                      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      {addInteractionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Salva Interazione
                    </button>
                  </div>
                )}

                {/* Existing interactions list */}
                {lesson.interactions && lesson.interactions.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-gray-400 text-sm mb-2">Interazioni esistenti</h4>
                    <div className="space-y-2">
                      {lesson.interactions.map((interaction) => (
                        <div
                          key={interaction.id}
                          className="flex items-center justify-between p-2 bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">
                              {formatTime(interaction.timestamp)}
                            </span>
                            <span className="text-white text-sm">
                              {interaction.type}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm('Eliminare questa interazione?')) {
                                deleteInteractionMutation.mutate(interaction.id);
                              }
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Video Info */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">Informazioni</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>Durata: {formatTime(lesson.duration || 0)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Eye className="h-4 w-4" />
                  <span>{lesson.viewCount} visualizzazioni</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>Avatar: {lesson.avatarType}</span>
                </div>
              </div>
            </div>

            {/* Chapters */}
            {lesson.chapters && lesson.chapters.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-3">Capitoli</h3>
                <div className="space-y-2">
                  {lesson.chapters.map((chapter, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = chapter.timestamp;
                        }
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 text-left"
                    >
                      <span className="text-xs text-gray-500">
                        {formatTime(chapter.timestamp)}
                      </span>
                      <span className="text-white text-sm flex-1">
                        {chapter.title}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactions Summary */}
            <div className="bg-gray-800 rounded-xl p-4">
              <h3 className="text-white font-semibold mb-3">
                Interazioni H5P ({lesson.interactions?.length || 0})
              </h3>
              {lesson.interactions && lesson.interactions.length > 0 ? (
                <div className="space-y-2">
                  {lesson.interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg"
                    >
                      <div
                        className={`p-1.5 rounded ${
                          interaction.type === 'QUIZ'
                            ? 'bg-primary-500/20'
                            : interaction.type === 'SUMMARY'
                            ? 'bg-blue-500/20'
                            : 'bg-purple-500/20'
                        }`}
                      >
                        {interaction.type === 'QUIZ' ? (
                          <HelpCircle className="h-4 w-4 text-primary-400" />
                        ) : interaction.type === 'SUMMARY' ? (
                          <BookOpen className="h-4 w-4 text-blue-400" />
                        ) : (
                          <MessageSquare className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{interaction.type}</p>
                        <p className="text-xs text-gray-500">
                          @ {formatTime(interaction.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  Nessuna interazione. Attiva la modalità modifica per aggiungerne.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
