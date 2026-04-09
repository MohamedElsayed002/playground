import {
  Injectable,
  BadRequestException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/register.dto';
import * as Sentry from "@sentry/nestjs"

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
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
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


    const passwordHash = await bcrypt.hash(dto.password, 10);


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

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`Login: ${user.email}`);
    Sentry.logger.info('User logged from database', {
      email: dto.email,
      provider: 'database',
    });
    return this.issueTokens(user, user.profile);
  }

  async signInWithGoogleOAuth(profile: {
    id: string;
    emails?: { value: string }[];
    displayName?: string;
    photos?: { value: string }[];
  }): Promise<AuthTokens> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    const avatarUrl = profile.photos?.[0]?.value ?? null;

    let user = await this.prisma.userData.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { profile: true },
    });

    if (user) {
      if (!user.profile) {
        const username = await this.generateUniqueUsernameFromEmail(email);
        await this.prisma.profile.create({
          data: {
            userId: user.id,
            username,
            avatarUrl,
          },
        });
        user = await this.prisma.userData.findUniqueOrThrow({
          where: { id: user.id },
          include: { profile: true },
        });
      }

      if (!user.googleId || (avatarUrl && user.profile && !user.profile.avatarUrl)) {
        user = await this.prisma.userData.update({
          where: { id: user.id },
          data: {
            ...(!user.googleId ? { googleId } : {}),
            ...(avatarUrl && user.profile && !user.profile.avatarUrl
              ? { profile: { update: { avatarUrl } } }
              : {}),
          },
          include: { profile: true },
        });
      }

      this.logger.log(`Google sign-in: ${user.email}`);
      return this.issueTokens(user, user.profile!);
    }

    const username = await this.generateUniqueUsernameFromEmail(email);
    const created = await this.prisma.userData.create({
      data: {
        email,
        googleId,
        passwordHash: null,
        profile: {
          create: {
            username,
            avatarUrl,
          },
        },
      },
      include: { profile: true },
    });

    Sentry.logger.info('User logged in with OAuth (GMAIL)', {
      email: profile.emails?.[0]?.value?.toLowerCase(),
      avatarUrl,
      provider: 'google',
    });
    this.logger.log(`Google register: ${created.email}`);
    return this.issueTokens(created, created.profile!);
  }


  // Helper function
  private async generateUniqueUsernameFromEmail(email: string): Promise<string> {
    const local = email.split('@')[0] ?? 'user';
    const base =
      local.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') ||
      'user';
    const trimmed = base.slice(0, 24);
    let candidate = trimmed;
    let n = 0;
    while (
      await this.prisma.profile.findUnique({ where: { username: candidate } })
    ) {
      n += 1;
      const suffix = `_${n}`;
      candidate = `${trimmed.slice(0, Math.max(1, 24 - suffix.length))}${suffix}`;
    }
    return candidate;
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
