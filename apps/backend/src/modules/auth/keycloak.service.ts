import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface KeycloakUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface KeycloakUser {
  id: string;
  email: string;
}

@Injectable()
export class KeycloakService {
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private adminToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('KEYCLOAK_URL') || 'http://localhost:8080';
    this.realm = this.configService.get<string>('KEYCLOAK_REALM') || 'edu-atelier';
    this.clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID') || 'edu-atelier-backend';
    this.clientSecret = this.configService.get<string>('KEYCLOAK_CLIENT_SECRET') || '';
  }

  private async getAdminToken(): Promise<string> {
    if (this.adminToken && Date.now() < this.tokenExpiry) {
      return this.adminToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: 'admin-cli',
          client_secret: this.configService.get<string>('KEYCLOAK_ADMIN_SECRET') || '',
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      this.adminToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.adminToken!;
    } catch {
      // In development, return a mock token
      if (process.env.NODE_ENV === 'development') {
        return 'mock-admin-token';
      }
      throw new Error('Failed to get Keycloak admin token');
    }
  }

  async createUser(userData: KeycloakUserData): Promise<KeycloakUser> {
    try {
      const token = await this.getAdminToken();

      const response = await axios.post(
        `${this.baseUrl}/admin/realms/${this.realm}/users`,
        {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          enabled: true,
          emailVerified: true,
          credentials: [
            {
              type: 'password',
              value: userData.password,
              temporary: false,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Get user ID from Location header
      const locationHeader = response.headers['location'];
      const userId = locationHeader?.split('/').pop();

      return {
        id: userId || `mock-${Date.now()}`,
        email: userData.email,
      };
    } catch {
      // In development, return a mock user
      if (process.env.NODE_ENV === 'development') {
        return {
          id: `mock-${Date.now()}`,
          email: userData.email,
        };
      }
      throw new Error('Failed to create user in Keycloak');
    }
  }

  async authenticate(email: string, password: string): Promise<{ accessToken: string } | null> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          username: email,
          password: password,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      return { accessToken: response.data.access_token };
    } catch {
      // In development, allow mock authentication
      if (process.env.NODE_ENV === 'development') {
        return { accessToken: 'mock-access-token' };
      }
      return null;
    }
  }

  async deleteUser(keycloakId: string): Promise<void> {
    try {
      const token = await this.getAdminToken();
      await axios.delete(
        `${this.baseUrl}/admin/realms/${this.realm}/users/${keycloakId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch {
      console.error('Failed to delete user from Keycloak');
    }
  }
}
