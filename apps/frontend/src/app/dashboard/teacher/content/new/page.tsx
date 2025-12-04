'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  File,
  Wand2,
  Loader2,
} from 'lucide-react';

type ContentType = 'TEXT' | 'PDF' | 'IMAGE';

export default function NewContentPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<ContentType>('TEXT');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [classroomId, setClassroomId] = useState<string>('');

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      type: ContentType;
      rawContent?: string;
      classroomId?: string;
    }) => {
      const response = await api.post('/content', data);
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/dashboard/teacher/content/${data.id}`);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/content/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (data) => {
      router.push(`/dashboard/teacher/content/${data.id}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Inserisci un titolo');
      return;
    }

    if (contentType === 'TEXT') {
      if (!textContent.trim()) {
        alert('Inserisci il contenuto testuale');
        return;
      }

      createMutation.mutate({
        title,
        description,
        type: contentType,
        rawContent: textContent,
        classroomId: classroomId || undefined,
      });
    } else {
      if (!selectedFile) {
        alert('Seleziona un file');
        return;
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', contentType);
      if (classroomId) {
        formData.append('classroomId', classroomId);
      }

      uploadMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || uploadMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/teacher/content"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Torna ai contenuti
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Contenuto</h1>
          <p className="text-gray-600 mt-1">
            Carica materiale didattico da trasformare con l'AI
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Informazioni Base
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titolo *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es: La Rivoluzione Francese"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrizione del contenuto..."
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe (opzionale)
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Nessuna classe specifica</option>
                  {/* Classrooms would be loaded here */}
                </select>
              </div>
            </div>
          </div>

          {/* Content Type Selection */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tipo di Contenuto
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <ContentTypeCard
                type="TEXT"
                icon={<FileText className="h-8 w-8" />}
                label="Testo"
                description="Inserisci o incolla testo"
                selected={contentType === 'TEXT'}
                onClick={() => setContentType('TEXT')}
              />
              <ContentTypeCard
                type="PDF"
                icon={<File className="h-8 w-8" />}
                label="PDF"
                description="Carica un documento PDF"
                selected={contentType === 'PDF'}
                onClick={() => setContentType('PDF')}
              />
              <ContentTypeCard
                type="IMAGE"
                icon={<Image className="h-8 w-8" />}
                label="Immagine"
                description="Carica un'immagine"
                selected={contentType === 'IMAGE'}
                onClick={() => setContentType('IMAGE')}
              />
            </div>
          </div>

          {/* Content Input */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {contentType === 'TEXT' ? 'Contenuto Testuale' : 'Carica File'}
            </h2>

            {contentType === 'TEXT' ? (
              <div>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Inserisci o incolla qui il tuo contenuto didattico...

Puoi inserire:
- Appunti di lezione
- Testi da libri
- Articoli
- Qualsiasi contenuto testuale

L'AI lo analizzerà e genererà materiale didattico!"
                  rows={15}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                />
                <p className="text-sm text-gray-500 mt-2">
                  {textContent.length} caratteri • ~{Math.ceil(textContent.split(/\s+/).length)} parole
                </p>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Clicca per caricare</span> o
                          trascina qui
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {contentType === 'PDF'
                            ? 'PDF (max 10MB)'
                            : 'PNG, JPG, GIF (max 5MB)'}
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept={contentType === 'PDF' ? '.pdf' : 'image/*'}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* AI Features Preview */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Wand2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Cosa farà l'AI con il tuo contenuto
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>✓ Estrarrà concetti chiave e punti salienti</li>
                  <li>✓ Genererà riassunti (anche versione DSA/L2)</li>
                  <li>✓ Creerà mappe concettuali interattive</li>
                  <li>✓ Preparerà quiz e domande di verifica</li>
                  <li>✓ Permetterà di creare video-lezioni con avatar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/teacher/content"
              className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creazione...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Crea Contenuto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContentTypeCard({
  type,
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  type: ContentType;
  icon: React.ReactNode;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className={selected ? 'text-primary-600' : 'text-gray-400'}>
        {icon}
      </div>
      <p className="font-medium text-gray-900 mt-2">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}
