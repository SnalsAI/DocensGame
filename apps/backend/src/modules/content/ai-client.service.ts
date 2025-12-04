import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { QuizType, SummaryType } from '@prisma/client';

interface ParsedContent {
  concepts: string[];
  keyPoints: string[];
  entities: Record<string, string[]>;
}

interface ConceptMapData {
  nodes: Array<{ id: string; label: string; type: string }>;
  edges: Array<{ source: string; target: string; label: string }>;
}

interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

@Injectable()
export class AIClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('AI_SERVICE_URL') || 'http://localhost:8001';
  }

  async parseContent(text: string, fileUrl?: string): Promise<ParsedContent> {
    try {
      const response = await firstValueFrom(
        this.http.post<ParsedContent>(`${this.baseUrl}/api/v1/parse`, {
          text,
          file_url: fileUrl,
        }),
      );
      return response.data;
    } catch {
      // Return mock data in development
      return {
        concepts: ['Concetto 1', 'Concetto 2', 'Concetto 3'],
        keyPoints: ['Punto chiave 1', 'Punto chiave 2'],
        entities: {
          persone: ['Persona 1'],
          luoghi: ['Luogo 1'],
          date: ['Data 1'],
        },
      };
    }
  }

  async summarize(text: string, type: SummaryType): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ summary: string }>(`${this.baseUrl}/api/v1/summarize`, {
          text,
          type: type.toLowerCase(),
        }),
      );
      return response.data.summary;
    } catch {
      return `Riassunto ${type.toLowerCase()} del contenuto fornito.`;
    }
  }

  async generateConceptMap(text: string): Promise<ConceptMapData> {
    try {
      const response = await firstValueFrom(
        this.http.post<ConceptMapData>(`${this.baseUrl}/api/v1/concept-map`, {
          text,
        }),
      );
      return response.data;
    } catch {
      return {
        nodes: [
          { id: '1', label: 'Concetto principale', type: 'main' },
          { id: '2', label: 'Sotto-concetto 1', type: 'sub' },
          { id: '3', label: 'Sotto-concetto 2', type: 'sub' },
        ],
        edges: [
          { source: '1', target: '2', label: 'include' },
          { source: '1', target: '3', label: 'include' },
        ],
      };
    }
  }

  async generateQuiz(
    text: string,
    type: QuizType,
    numQuestions: number = 5,
  ): Promise<QuizQuestion[]> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ questions: QuizQuestion[] }>(`${this.baseUrl}/api/v1/generate-quiz`, {
          text,
          quiz_type: type.toLowerCase(),
          num_questions: numQuestions,
        }),
      );
      return response.data.questions;
    } catch {
      // Return mock questions
      return Array.from({ length: numQuestions }, (_, i) => ({
        id: `q${i + 1}`,
        question: `Domanda ${i + 1} sul contenuto`,
        type: type === QuizType.TRUE_FALSE ? 'true_false' : 'multiple_choice',
        options: type === QuizType.TRUE_FALSE
          ? ['Vero', 'Falso']
          : ['Opzione A', 'Opzione B', 'Opzione C', 'Opzione D'],
        correctAnswer: type === QuizType.TRUE_FALSE ? 'Vero' : 'Opzione A',
        explanation: 'Spiegazione della risposta corretta.',
      }));
    }
  }

  async simplifyText(text: string, level: 'dsa' | 'l2'): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ simplified: string }>(`${this.baseUrl}/api/v1/simplify`, {
          text,
          level,
        }),
      );
      return response.data.simplified;
    } catch {
      return text;
    }
  }

  async generateScript(text: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ script: string }>(`${this.baseUrl}/api/v1/generate-script`, {
          text,
        }),
      );
      return response.data.script;
    } catch {
      return text;
    }
  }
}
