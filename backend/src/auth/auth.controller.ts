import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import type { AuthTokens } from './auth.service';

type AuthAuditRequest = {
  auditContext?: {
    action?: string;
    authMethod?: 'email_password' | 'google_oauth';
    userId?: string;
    profileId?: string;
    email?: string;
  };
  user?: AuthTokens;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req: AuthAuditRequest, @Res() res: Response) {
    const profile = req.user?.profile;
    req.auditContext = {
      action: 'login',
      authMethod: 'google_oauth',
      userId: profile?.userId,
      profileId: profile?.id,
      email: profile?.email,
    };

    const payload = Buffer.from(JSON.stringify(req.user)).toString('base64url');
    const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/oauth/google#data=${payload}`;
    return res.redirect(302, url);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: AuthAuditRequest) {
    const tokens = await this.authService.register(dto);
    req.auditContext = {
      action: 'register',
      authMethod: 'email_password',
      userId: tokens.profile.userId,
      profileId: tokens.profile.id,
      email: tokens.profile.email,
    };
    return tokens;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: AuthAuditRequest) {
    const tokens = await this.authService.login(dto);

    req.auditContext = {
      action: 'login',
      authMethod: 'email_password',
      userId: tokens.profile.userId,
      profileId: tokens.profile.id,
      email: tokens.profile.email,
    };

    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshDto, @Req() req: AuthAuditRequest) {
    const dotIndex = dto.refreshToken?.indexOf('.') ?? -1;
    const userId =
      dotIndex !== -1 ? dto.refreshToken.substring(0, dotIndex) : null;

    await this.authService.logout(dto.refreshToken);

    req.auditContext = {
      action: 'logout',
      userId: userId || undefined,
    };

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Request() req: any) {
    await this.authService.logoutAll(req.user.userId);

    // Explicitly set audit context for the middleware
    if (req.auditContext) {
      req.auditContext.action = 'logout';
      req.auditContext.userId = req.user.userId;
    } else {
      req.auditContext = {
        action: 'logout',
        userId: req.user.userId,
      };
    }

    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return req.user;
  }
}
