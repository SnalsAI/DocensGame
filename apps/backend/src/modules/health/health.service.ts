import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as os from 'os';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  message?: string;
}

interface SystemMetrics {
  uptime: number;
  memory: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
  };
  process: {
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // Basic liveness check
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'edu-atelier-backend',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  // Detailed readiness check
  async ready() {
    const checks: Record<string, HealthCheck> = {};
    const startTime = Date.now();

    // Database check
    checks.database = await this.checkDatabase();

    // Redis check (if configured)
    checks.redis = await this.checkRedis();

    // AI Service check
    checks.aiService = await this.checkAIService();

    // Video Service check
    checks.videoService = await this.checkVideoService();

    // Calculate overall status
    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');
    const anyUnhealthy = Object.values(checks).some((c) => c.status === 'unhealthy');

    return {
      status: anyUnhealthy ? 'unhealthy' : allHealthy ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks,
    };
  }

  // Detailed health with metrics
  async detailed() {
    const [readiness, metrics] = await Promise.all([
      this.ready(),
      this.getSystemMetrics(),
    ]);

    return {
      ...readiness,
      metrics,
      build: {
        version: process.env.npm_package_version || '0.1.0',
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  // Database health check
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Redis health check
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      // Redis check would go here if Redis is configured
      // For now, return healthy if no Redis configured
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
        message: 'Redis not configured - skipped',
      };
    } catch (error) {
      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // AI Service health check
  private async checkAIService(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const response = await fetch(
        `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/health`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        return {
          status: 'healthy',
          latency: Date.now() - startTime,
        };
      }

      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Service unreachable',
      };
    }
  }

  // Video Service health check
  private async checkVideoService(): Promise<HealthCheck> {
    const startTime = Date.now();
    try {
      const response = await fetch(
        `${process.env.VIDEO_SERVICE_URL || 'http://localhost:8001'}/health`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        return {
          status: 'healthy',
          latency: Date.now() - startTime,
        };
      }

      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        message: `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'degraded',
        latency: Date.now() - startTime,
        message: error instanceof Error ? error.message : 'Service unreachable',
      };
    }
  }

  // System metrics
  private async getSystemMetrics(): Promise<SystemMetrics> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      uptime: os.uptime(),
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        percentUsed: Math.round((usedMemory / totalMemory) * 100),
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
      },
    };
  }

  // Get application stats
  async getStats() {
    try {
      const [userCount, classroomCount, contentCount, gameCount] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.classroom.count(),
        this.prisma.content.count(),
        this.prisma.gameSession.count(),
      ]);

      return {
        users: userCount,
        classrooms: classroomCount,
        contents: contentCount,
        games: gameCount,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get stats:', error);
      return null;
    }
  }
}
