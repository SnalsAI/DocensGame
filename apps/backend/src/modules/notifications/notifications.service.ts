import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { welcomeTemplate } from './templates/welcome';
import { badgeEarnedTemplate } from './templates/badge-earned';
import { weeklyReportTemplate } from './templates/weekly-report';
import { gameInviteTemplate } from './templates/game-invite';
import { classroomJoinTemplate } from './templates/classroom-join';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface WelcomeEmailData {
  userName: string;
  userRole: 'student' | 'teacher';
  loginUrl: string;
}

export interface BadgeEarnedData {
  userName: string;
  badgeName: string;
  badgeDescription: string;
  badgeIconUrl: string;
  xpEarned: number;
  totalXP: number;
  level: number;
}

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

export interface GameInviteData {
  inviterName: string;
  gameName: string;
  gameType: string;
  roomCode: string;
  joinUrl: string;
  expiresAt: string;
}

export interface ClassroomJoinData {
  studentName: string;
  classroomName: string;
  teacherName: string;
  subject: string;
  dashboardUrl: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    // Configure based on environment
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Use ethereal for development
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'testpass',
        },
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"EDU-ATELIER" <noreply@edu-atelier.it>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: 'Benvenuto su EDU-ATELIER!',
      html: welcomeTemplate(data),
    });
  }

  async sendBadgeEarnedEmail(to: string, data: BadgeEarnedData): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Hai ottenuto un nuovo badge: ${data.badgeName}!`,
      html: badgeEarnedTemplate(data),
    });
  }

  async sendWeeklyReportEmail(to: string, data: WeeklyReportData): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Il tuo report settimanale - ${data.weekStartDate}`,
      html: weeklyReportTemplate(data),
    });
  }

  async sendGameInviteEmail(to: string, data: GameInviteData): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `${data.inviterName} ti ha invitato a giocare!`,
      html: gameInviteTemplate(data),
    });
  }

  async sendClassroomJoinEmail(to: string, data: ClassroomJoinData): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: `Sei stato aggiunto alla classe: ${data.classroomName}`,
      html: classroomJoinTemplate(data),
    });
  }
}
