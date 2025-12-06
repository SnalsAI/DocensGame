import { baseTemplate } from './base';

export interface GameInviteData {
  inviterName: string;
  gameName: string;
  gameType: string;
  roomCode: string;
  joinUrl: string;
  expiresAt: string;
}

export const gameInviteTemplate = (data: GameInviteData): string => {
  const gameEmoji = {
    'RAPID_QUIZ': '⚡',
    'BOSS_FIGHT': '👹',
    'DUNGEON': '🏰',
    'SQUAD_PUZZLE': '🧩',
    'TOURNAMENT': '🏆',
  }[data.gameType] || '🎮';

  const content = `
    <div style="text-align: center;">
      <h2 style="color: #10b981; margin-top: 0;">Sei stato invitato a giocare! ${gameEmoji}</h2>

      <p style="font-size: 18px;">
        <strong>${data.inviterName}</strong> ti ha invitato a una partita di
      </p>

      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 25px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px; color: #1e40af; font-size: 24px;">${data.gameName}</h3>
        <p style="margin: 0; color: #1e3a8a;">Modalità: ${data.gameType.replace('_', ' ')}</p>
      </div>

      <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p style="margin: 0 0 10px; color: #666;">Codice stanza:</p>
        <p style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 5px; margin: 0;">
          ${data.roomCode}
        </p>
      </div>

      <a href="${data.joinUrl}" class="button" style="font-size: 18px; padding: 15px 40px;">
        Unisciti ora! →
      </a>

      <p style="color: #ef4444; margin-top: 20px;">
        ⏰ L'invito scade: ${data.expiresAt}
      </p>

      <p style="color: #666; font-size: 14px; margin-top: 20px;">
        Non riesci a usare il link? Vai su <a href="https://edu-atelier.it/game/join" style="color: #10b981;">edu-atelier.it/game/join</a>
        e inserisci il codice <strong>${data.roomCode}</strong>.
      </p>
    </div>
  `;

  return baseTemplate(content, `${data.inviterName} ti ha invitato a giocare a ${data.gameName}!`);
};
