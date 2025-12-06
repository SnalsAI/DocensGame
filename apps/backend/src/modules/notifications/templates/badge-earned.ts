import { baseTemplate } from './base';

export interface BadgeEarnedData {
  userName: string;
  badgeName: string;
  badgeDescription: string;
  badgeIconUrl: string;
  xpEarned: number;
  totalXP: number;
  level: number;
}

export const badgeEarnedTemplate = (data: BadgeEarnedData): string => {
  const content = `
    <div style="text-align: center;">
      <h2 style="color: #10b981; margin-top: 0;">Complimenti ${data.userName}! 🎉</h2>
      <p style="font-size: 18px;">Hai ottenuto un nuovo badge!</p>

      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; margin: 20px 0;">
        <img src="${data.badgeIconUrl}" alt="${data.badgeName}" class="badge-icon" style="width: 100px; height: 100px;">
        <h3 style="margin: 15px 0 5px; color: #92400e;">${data.badgeName}</h3>
        <p style="color: #78350f; margin: 0;">${data.badgeDescription}</p>
      </div>

      <div style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
        <div class="stat-box" style="flex: 1;">
          <div class="stat-value">+${data.xpEarned}</div>
          <div class="stat-label">XP Guadagnati</div>
        </div>
        <div class="stat-box" style="flex: 1;">
          <div class="stat-value">${data.totalXP.toLocaleString()}</div>
          <div class="stat-label">XP Totali</div>
        </div>
        <div class="stat-box" style="flex: 1;">
          <div class="stat-value">${data.level}</div>
          <div class="stat-label">Livello</div>
        </div>
      </div>

      <p>Continua così! Ogni badge ti avvicina al prossimo livello.</p>

      <a href="https://edu-atelier.it/dashboard/student/profile" class="button">
        Vedi i tuoi badge →
      </a>
    </div>
  `;

  return baseTemplate(content, `Hai ottenuto il badge "${data.badgeName}"!`);
};
