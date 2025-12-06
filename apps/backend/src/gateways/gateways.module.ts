import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-jwt-secret',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GatewaysModule {}
