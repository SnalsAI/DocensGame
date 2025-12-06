import { baseTemplate } from './base';

export interface ClassroomJoinData {
  studentName: string;
  classroomName: string;
  teacherName: string;
  subject: string;
  dashboardUrl: string;
}

export const classroomJoinTemplate = (data: ClassroomJoinData): string => {
  const content = `
    <h2 style="color: #10b981; margin-top: 0;">Ciao ${data.studentName}! 👋</h2>

    <p style="font-size: 18px;">
      Sei stato aggiunto a una nuova classe!
    </p>

    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 15px; color: #047857;">${data.classroomName}</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 5px 0; color: #666;">Docente:</td>
          <td style="padding: 5px 0; font-weight: bold;">${data.teacherName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: #666;">Materia:</td>
          <td style="padding: 5px 0; font-weight: bold;">${data.subject}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: #374151;">Cosa puoi fare ora:</h3>
    <ul style="padding-left: 20px; color: #4b5563;">
      <li>📚 Accedi alle lezioni e ai materiali della classe</li>
      <li>📝 Completa i quiz assegnati dal docente</li>
      <li>🎮 Partecipa ai giochi di classe quando disponibili</li>
      <li>📊 Visualizza i tuoi progressi nella dashboard</li>
    </ul>

    <div style="text-align: center; margin-top: 30px;">
      <a href="${data.dashboardUrl}" class="button">
        Vai alla classe →
      </a>
    </div>

    <p style="color: #666; font-size: 14px; margin-top: 20px; text-align: center;">
      Buono studio! 📖
    </p>
  `;

  return baseTemplate(content, `Sei stato aggiunto alla classe "${data.classroomName}"`);
};
