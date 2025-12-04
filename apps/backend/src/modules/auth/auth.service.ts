import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { KeycloakService } from './keycloak.service';
import { LoginDto, RegisterDto, TokenResponseDto } from './dto/auth.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly keycloak: KeycloakService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Keycloak
    const keycloakUser = await this.keycloak.createUser({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      password: registerDto.password,
    });

    // Create user in database
    const user = await this.prisma.user.create({
      data: {
        keycloakId: keycloakUser.id,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || UserRole.STUDENT,
      },
    });

    // Create student or teacher profile
    if (user.role === UserRole.STUDENT) {
      await this.prisma.studentProfile.create({
        data: { userId: user.id },
      });
    } else if (user.role === UserRole.TEACHER) {
      await this.prisma.teacherProfile.create({
        data: { userId: user.id },
      });
    }

    // Generate tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    // Authenticate with Keycloak
    const keycloakToken = await this.keycloak.authenticate(
      loginDto.email,
      loginDto.password,
    );

    if (!keycloakToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Find user in database
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate tokens
    return this.generateTokens(user.id, user.email, user.role);
  }

  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { ...userData } = user;
    return userData;
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Invalidate tokens in Redis
    await this.redis.del(`user:${userId}:token`);
    return { message: 'Logged out successfully' };
  }

  private generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): TokenResponseDto {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }
}
