import { baseTemplate } from './base';

export interface WeeklyReportData {
  userName: string;
  weekStartDate: string;
  weekEndDate: string;
  xpEarned: number;
  quizzesCompleted: number;
  gamesPlayed: number;
  averageScore: number;
  newBadges: string[];
  topContent: { title: string; score: number }[];
  classroomRank?: number;
  totalStudents?: number;
}

export const weeklyReportTemplate = (data: WeeklyReportData): string => {
  const badgesHtml = data.newBadges.length > 0
    ? `
      <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 15px 0;">
        <strong>🏆 Nuovi badge ottenuti:</strong>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          ${data.newBadges.map(badge => `<li>${badge}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const topContentHtml = data.topContent.length > 0
    ? `
      <h3 style="color: #10b981;">📚 Migliori risultati</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.topContent.map(content => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0;">${content.title}</td>
            <td style="padding: 10px 0; text-align: right; color: #10b981; font-weight: bold;">
              ${content.score}%
            </td>
          </tr>
        `).join('')}
      </table>
    `
    : '';

  const rankHtml = data.classroomRank
    ? `
      <div class="stat-box">
        <div class="stat-value">#${data.classroomRank}</div>
        <div class="stat-label">Classifica classe (su ${data.totalStudents})</div>
      </div>
    `
    : '';

  const content = `
    <h2 style="color: #10b981; margin-top: 0;">Il tuo report settimanale 📊</h2>
    <p>Ciao ${data.userName}, ecco un riepilogo della tua settimana su EDU-ATELIER!</p>
    <p style="color: #666; font-size: 14px;">${data.weekStartDate} - ${data.weekEndDate}</p>

    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 25px 0;">
      <div class="stat-box">
        <div class="stat-value">+${data.xpEarned}</div>
        <div class="stat-label">XP Guadagnati</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.quizzesCompleted}</div>
        <div class="stat-label">Quiz Completati</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.gamesPlayed}</div>
        <div class="stat-label">Giochi Giocati</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${data.averageScore}%</div>
        <div class="stat-label">Media Punteggi</div>
      </div>
    </div>

    ${rankHtml}
    ${badgesHtml}
    ${topContentHtml}

    <div style="text-align: center; margin-top: 30px;">
      <p>Continua così! Ogni settimana è un'opportunità per migliorare.</p>
      <a href="https://edu-atelier.it/dashboard" class="button">
        Vai alla dashboard →
      </a>
    </div>
  `;

  return baseTemplate(content, `Report settimanale: ${data.xpEarned} XP guadagnati!`);
};
