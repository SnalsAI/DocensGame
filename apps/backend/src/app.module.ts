import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ClassroomsModule } from './modules/classrooms/classrooms.module';
import { ContentModule } from './modules/content/content.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { GamesModule } from './modules/games/games.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),

    // Common modules
    PrismaModule,
    RedisModule,
    StorageModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    ClassroomsModule,
    ContentModule,
    LessonsModule,
    GamesModule,
  ],
})
export class AppModule {}
