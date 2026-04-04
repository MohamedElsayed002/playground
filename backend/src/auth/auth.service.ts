import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/register.dto';

export interface JwtPayload {
  sub: string;
  profileId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  profile: {
    id: string;
    userId: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    // private readonly config: ConfigService
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    // 1. Uniqueness checks — give specific errors so the user knows what to fix
    const existingEmail = await this.prisma.userData.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new BadRequestException(
        'An account with this email already exists',
      );
    }

    const existingUsername = await this.prisma.profile.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('This username is already taken');
    }

    // 2. Hash password
    // bcrypt.hash(plain, saltRounds=10) — 2^10 = 1024 iterations
    // Standard for web apps: slow enough to resist brute-force, fast enough for UX
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Create User + Profile atomically with Prisma nested create
    // If the Profile insert fails the User is also rolled back — no orphan rows
    const user = await this.prisma.userData.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        profile: {
          create: { username: dto.username },
        },
      },
      include: { profile: true },
    });

    this.logger.log(`Registered: ${user.email}`);
    return this.issueTokens(user, user.profile!);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.userData.findUnique({
      where: {
        email: dto.email.toLocaleLowerCase(),
      },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login: ${user.email}`);
    return this.issueTokens(user, user.profile);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const dotIndex = rawRefreshToken.indexOf('.');

    if (dotIndex === -1) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const userId = rawRefreshToken.substring(0, dotIndex);

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      include: { user: { include: { profile: true } } },
    });

    if (storedTokens.length === 0) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    // Find which stored hash matches the raw token
    let matched: (typeof storedTokens)[0] | null = null;

    for (const t of storedTokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        matched = t;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Refresh token is invalid or expired');
    }

    await this.prisma.refreshToken.delete({ where: { id: matched.id } });

    return this.issueTokens(matched.user, matched.user.profile!);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const dotIndex = rawRefreshToken.indexOf('.');
    if (dotIndex === -1) return;
    const userId = rawRefreshToken.substring(0, dotIndex);

    const tokens = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    for (const t of tokens) {
      if (await bcrypt.compare(rawRefreshToken, t.tokenHash)) {
        await this.prisma.refreshToken.delete({ where: { id: t.id } });
        return;
      }
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    this.logger.log(`All sessions cleared for user ${userId}`);
  }

  private async issueTokens(user: any, profile: any): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      profileId: profile.id,
      email: user.email,
    };
    const accessToken = this.jwt.sign(payload);

    // ── 2. Refresh token (opaque random string — stored hashed) ──
    // Format: <userId>.<64 random bytes hex>
    // userId prefix makes lookups efficient without a full table scan
    const rawRefreshToken = `${user.id}.${crypto.randomBytes(64).toString('hex')}`;
    const tokenHash = await bcrypt.hash(rawRefreshToken, 10);

    const ttlDays = parseInt('7', 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      profile: {
        id: profile.id,
        userId: user.id,
        username: profile.username,
        email: user.email,
        avatarUrl: profile.avatarUrl ?? null,
      },
    };
  }
}
