import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000'),
      useSSL: this.configService.get<string>('NODE_ENV') === 'production',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin123',
    });
    this.bucket = this.configService.get<string>('MINIO_BUCKET') || 'edu-atelier';
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  private async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      console.log(`✅ Created bucket: ${this.bucket}`);
    }
  }

  async uploadFile(
    path: string,
    data: Buffer | Readable,
    contentType: string,
  ): Promise<string> {
    const metadata = { 'Content-Type': contentType };

    if (Buffer.isBuffer(data)) {
      await this.client.putObject(this.bucket, path, data, data.length, metadata);
    } else {
      await this.client.putObject(this.bucket, path, data, undefined, metadata);
    }

    return this.getFileUrl(path);
  }

  async getFile(path: string): Promise<Readable> {
    return this.client.getObject(this.bucket, path);
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.removeObject(this.bucket, path);
  }

  getFileUrl(path: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<string>('MINIO_PORT');
    const protocol = this.configService.get<string>('NODE_ENV') === 'production' ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${path}`;
  }

  async getPresignedUrl(path: string, expiry = 3600): Promise<string> {
    return this.client.presignedGetObject(this.bucket, path, expiry);
  }

  async getPresignedUploadUrl(path: string, expiry = 3600): Promise<string> {
    return this.client.presignedPutObject(this.bucket, path, expiry);
  }
}
