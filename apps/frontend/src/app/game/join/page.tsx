'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { BookOpen, Gamepad2 } from 'lucide-react';

export default function JoinGamePage() {
  const { user, isLoading, login } = useAuth();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!roomCode.trim()) {
      setError('Inserisci il codice della stanza');
      return;
    }

    if (!user && !nickname.trim()) {
      setError('Inserisci un nickname');
      return;
    }

    setIsJoining(true);

    try {
      // Verify room exists
      const response = await api.get(`/games/room/${roomCode.toUpperCase()}`);

      if (response.data) {
        // Navigate to game room
        router.push(
          `/game/play/${roomCode.toUpperCase()}?nickname=${encodeURIComponent(
            nickname || `${user?.firstName} ${user?.lastName}`
          )}`
        );
      }
    } catch {
      setError('Codice stanza non valido o gioco non attivo');
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">EDU-ATELIER</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Gamepad2 className="h-6 w-6" />
            <span className="text-lg">Unisciti al Gioco</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Codice Stanza
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-3 text-2xl text-center font-mono tracking-widest border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Il tuo Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Il tuo nome"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                maxLength={20}
              />
            </div>
          )}

          {user && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Entrerai come:</p>
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isJoining}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isJoining ? 'Connessione...' : 'Entra nel Gioco'}
          </button>
        </form>

        {!user && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm mb-2">Hai un account?</p>
            <button
              onClick={login}
              className="text-primary-600 font-medium hover:underline"
            >
              Accedi per salvare i tuoi progressi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
