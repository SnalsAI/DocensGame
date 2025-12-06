import { baseTemplate } from './base';

export interface WelcomeEmailData {
  userName: string;
  userRole: 'student' | 'teacher';
  loginUrl: string;
}

export const welcomeTemplate = (data: WelcomeEmailData): string => {
  const roleText = data.userRole === 'teacher'
    ? 'Come docente, potrai creare contenuti educativi, quiz interattivi e giochi multiplayer per i tuoi studenti.'
    : 'Come studente, potrai accedere a video lezioni, quiz interattivi e giochi educativi per imparare divertendoti.';

  const content = `
    <h2 style="color: #10b981; margin-top: 0;">Ciao ${data.userName}! 👋</h2>

    <p>Benvenuto su <strong>EDU-ATELIER</strong>, la piattaforma didattica che rende l'apprendimento un'avventura!</p>

    <p>${roleText}</p>

    <h3>Cosa puoi fare su EDU-ATELIER:</h3>
    <ul style="padding-left: 20px;">
      ${data.userRole === 'teacher' ? `
        <li>📚 Crea lezioni video con avatar parlanti</li>
        <li>🤖 Genera quiz automaticamente con l'AI</li>
        <li>🎮 Organizza giochi multiplayer in classe</li>
        <li>📊 Monitora i progressi degli studenti</li>
        <li>♿ Supporta studenti DSA e L2</li>
      ` : `
        <li>🎬 Guarda video lezioni interattive</li>
        <li>📝 Completa quiz e guadagna XP</li>
        <li>🎮 Gioca con i compagni in tempo reale</li>
        <li>🏆 Colleziona badge e scala le classifiche</li>
        <li>📈 Traccia i tuoi progressi</li>
      `}
    </ul>

    <div style="text-align: center;">
      <a href="${data.loginUrl}" class="button">Inizia ora →</a>
    </div>

    <p style="color: #666; font-size: 14px;">
      Se hai bisogno di aiuto, consulta la nostra <a href="https://edu-atelier.it/guida" style="color: #10b981;">guida introduttiva</a>
      o contattaci a <a href="mailto:support@edu-atelier.it" style="color: #10b981;">support@edu-atelier.it</a>.
    </p>
  `;

  return baseTemplate(content, `Benvenuto su EDU-ATELIER, ${data.userName}!`);
};
