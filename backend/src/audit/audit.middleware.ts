import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

type RequestUser = {
  userId?: string;
  profileId?: string;
  email?: string;
};

type AuditContext = {
  action?: string;
  authMethod?: 'email_password' | 'google_oauth';
  userId?: string;
  profileId?: string;
  email?: string;
};

type AuditRequest = Request & {
  user?: RequestUser;
  auditContext?: AuditContext;
};

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'password_hash',
  'refreshToken',
  'refresh_token',
  'accessToken',
  'access_token',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
];

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditMiddleware.name);

  constructor(private readonly prisma: PrismaService) { }

  use(req: AuditRequest, res: Response, next: NextFunction) {

    const startedAt = Date.now();

    const userAgent = this.asSingleHeaderValue(req.headers['user-agent']);
    const forwardedFor = this.asSingleHeaderValue(
      req.headers['x-forwarded-for'],
    );

    const IPAddress = forwardedFor?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || null;

    const requestBody = this.sanitizeValue(req.body);
    const requestQuery = this.sanitizeValue(req.query);

    res.on('finish', () => {

      const statusCode = res.statusCode;
      const status = statusCode >= 400 ? 'failed' : 'success';
      const auditContext = this.resolveAuditContext(req);
      const userId = auditContext?.userId || req.user?.userId || null;

      const requestPath = req.originalUrl || req.url;

      const extra = JSON.stringify({
        method: req.method,
        path: requestPath,
        route: req.route?.path ?? null,
        statusCode,
        durationMs: Date.now() - startedAt,
        action: auditContext?.action ?? null,
        authMethod: auditContext?.authMethod ?? null,
        email: auditContext?.email || req.user?.email || null,
        query: requestQuery,
        body: requestBody,
      });

      const auditLogDelegate = this.getAuditLogDelegate();

      if (!auditLogDelegate) {
        this.logger.warn(
          'Skipping audit log.',
        );
        return;
      }

      let event = `${req.method} ${requestPath.split('?')[0]}`;

      if (auditContext?.action === 'login') {
        event = 'auth.login';
      } else if (auditContext?.action === 'logout') {
        event = 'auth.logout';
      } else if (auditContext?.action === 'register') {
        event = 'auth.register';
      }

      void auditLogDelegate
        .create({
          data: {
            event,
            user_id: userId,
            status,
            ip_address: IPAddress,
            user_agent: userAgent,
            extra,
            updated_at: new Date(),
          },
        })
        .catch((error: unknown) => {
          this.logger.error('Failed to write audit log', error instanceof Error ? error.stack : String(error),);
        });
    });

    next();
  }

  private resolveAuditContext(req: AuditRequest): AuditContext | null {
    if (req.auditContext) {
      return req.auditContext;
    }

    const path = (req.originalUrl || req.url || '').split('?')[0];

    if (req.method === 'POST' && path.endsWith('/auth/login')) {
      return {
        action: 'login',
        authMethod: 'email_password',
      };
    }

    if (req.method === 'GET' && path.endsWith('/auth/google/callback')) {
      return {
        action: 'login',
        authMethod: 'google_oauth',
      };
    }

    return null;
  }

  private sanitizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item));
    }

    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(
          ([key, nestedValue]) => [
            key,
            this.isSensitiveKey(key)
              ? '[REDACTED]'
              : this.sanitizeValue(nestedValue),
          ],
        ),
      );
    }

    if (typeof value === 'string' && value.length > 500) {
      return `${value.slice(0, 500)}...`;
    }

    return value;
  }

  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEYS.includes(key);
  }

  private asSingleHeaderValue(
    value: string | string[] | undefined,
  ): string | null {
    if (!value) {
      return null;
    }

    return Array.isArray(value) ? value[0] : value;
  }

  private getAuditLogDelegate(): {
    create: (args: {
      data: {
        event: string;
        user_id: string | null;
        status: string;
        ip_address: string | null;
        user_agent: string | null;
        extra: string;
        updated_at: Date;
      };
    }) => Promise<unknown>;
  } | null {
    return (
      (
        this.prisma as unknown as {
          audit_logs?: {
            create: (args: {
              data: {
                event: string;
                user_id: string | null;
                status: string;
                ip_address: string | null;
                user_agent: string | null;
                extra: string;
                updated_at: Date;
              };
            }) => Promise<unknown>;
          };
        }
      ).audit_logs ?? null
    );
  }
}
