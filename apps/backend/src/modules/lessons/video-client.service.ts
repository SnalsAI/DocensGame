import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface VideoGenerationResult {
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
}

@Injectable()
export class VideoClientService {
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('VIDEO_SERVICE_URL') || 'http://localhost:8002';
  }

  async generateAudio(script: string, voiceId?: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ audio_url: string }>(`${this.baseUrl}/api/v1/tts`, {
          text: script,
          voice_id: voiceId || 'default',
        }),
      );
      return response.data.audio_url;
    } catch {
      // Return mock URL in development
      return `${this.baseUrl}/mock/audio/${Date.now()}.mp3`;
    }
  }

  async generateVideo(
    audioUrl: string,
    avatarId?: string,
  ): Promise<VideoGenerationResult> {
    try {
      const response = await firstValueFrom(
        this.http.post<VideoGenerationResult>(`${this.baseUrl}/api/v1/generate-video`, {
          audio_url: audioUrl,
          avatar_id: avatarId || 'default',
        }),
      );
      return response.data;
    } catch {
      // Return mock data in development
      return {
        videoUrl: `${this.baseUrl}/mock/video/${Date.now()}.mp4`,
        thumbnailUrl: `${this.baseUrl}/mock/thumbnail/${Date.now()}.jpg`,
        duration: 60,
      };
    }
  }

  async getAvailableAvatars() {
    try {
      const response = await firstValueFrom(
        this.http.get<{ avatars: Array<{ id: string; name: string; imageUrl: string }> }>(
          `${this.baseUrl}/api/v1/avatars`,
        ),
      );
      return response.data.avatars;
    } catch {
      return [
        { id: 'default', name: 'Avatar Default', imageUrl: '/avatars/default.png' },
        { id: 'teacher-1', name: 'Professore', imageUrl: '/avatars/teacher-1.png' },
        { id: 'teacher-2', name: 'Professoressa', imageUrl: '/avatars/teacher-2.png' },
      ];
    }
  }

  async getAvailableVoices() {
    try {
      const response = await firstValueFrom(
        this.http.get<{ voices: Array<{ id: string; name: string; language: string }> }>(
          `${this.baseUrl}/api/v1/voices`,
        ),
      );
      return response.data.voices;
    } catch {
      return [
        { id: 'default', name: 'Voce Standard', language: 'it-IT' },
        { id: 'male-1', name: 'Voce Maschile', language: 'it-IT' },
        { id: 'female-1', name: 'Voce Femminile', language: 'it-IT' },
      ];
    }
  }
}
