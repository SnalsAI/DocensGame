'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BookOpen, Users, Video, Gamepad2, Brain, Shield } from 'lucide-react';

export default function HomePage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        router.push('/dashboard/teacher');
      } else {
        router.push('/dashboard/student');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">EDU-ATELIER</span>
          </div>
          <button
            onClick={login}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Accedi
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            La piattaforma didattica
            <span className="text-primary-600"> intelligente</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Crea lezioni interattive con AI, genera video-lezioni automaticamente
            e coinvolgi i tuoi studenti con giochi educativi. Inclusiva per DSA e BES.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={login}
              className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-primary-700 transition-colors"
            >
              Inizia Gratis
            </button>
            <a
              href="#features"
              className="bg-white text-gray-700 px-8 py-3 rounded-lg text-lg border hover:bg-gray-50 transition-colors"
            >
              Scopri di più
            </a>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Brain className="h-10 w-10 text-primary-600" />}
            title="AI Content Engine"
            description="Genera riassunti, mappe concettuali, quiz ed esercizi automaticamente dai tuoi contenuti."
          />
          <FeatureCard
            icon={<Video className="h-10 w-10 text-secondary-600" />}
            title="Video-Lezioni AI"
            description="Trasforma i tuoi testi in video-lezioni con avatar parlanti e voce sintetizzata."
          />
          <FeatureCard
            icon={<Gamepad2 className="h-10 w-10 text-purple-600" />}
            title="Gamology Engine"
            description="Quiz multiplayer in tempo reale, boss fight, tornei e molto altro per coinvolgere la classe."
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-orange-600" />}
            title="Gestione Classi"
            description="Dashboard completa per docenti con monitoraggio progressi e reportistica."
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-green-600" />}
            title="Inclusività DSA/BES"
            description="Contenuti adattati, tempi extra, font ad alta leggibilità e modalità audio."
          />
          <FeatureCard
            icon={<BookOpen className="h-10 w-10 text-red-600" />}
            title="H5P Interattivo"
            description="Aggiungi quiz, note e punti interattivi direttamente nei video."
          />
        </div>

        {/* CTA */}
        <div className="bg-primary-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Pronto a rivoluzionare la tua didattica?</h2>
          <p className="text-primary-100 mb-8 text-lg">
            Unisciti a migliaia di docenti che usano EDU-ATELIER ogni giorno.
          </p>
          <button
            onClick={login}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            Registrati Gratuitamente
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 EDU-ATELIER. Tutti i diritti riservati.</p>
          <p className="mt-2 text-sm">
            Privacy by Design - GDPR Compliant
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
