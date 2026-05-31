import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Injectable,
  ExecutionContext,
} from '@nestjs/common';

import { GraphQLModule, GqlExecutionContext } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';
import { BotModule } from './bot/bot.module';
import { MongooseModule } from '@nestjs/mongoose';
import { GeminiModule } from './gemini/gemini.module';
import { CodeExecutionModule } from './code-execution/code-execution.module';
import { FileAnalysisModule } from './file-analysis/file-analysis.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AuditMiddleware } from './audit/audit.middleware';
import { AuditModule } from './audit/audit.module';

// Rate Limiter
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
class ThrottlerGqlGuard extends ThrottlerGuard {
  protected getRequestResponse(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req ?? ctx.getContext();
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const request = req ?? {};
    const ip =
      request.ip ||
      request.headers?.['x-forwarded-for']?.split(',')?.[0]?.trim() ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.req?.ip ||
      request.req?.connection?.remoteAddress ||
      // graphql context shape
      request.context?.req?.ip ||
      request.context?.req?.connection?.remoteAddress;

    return (ip as string) ?? 'unknown';
  }
}

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MongooseModule.forRoot(process.env.MONGO_URL!),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      autoSchemaFile: true,
      sortSchema: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      context: ({ req }: { req: any }) => ({ req }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 3600,
          limit: 20,
        },
      ],
    }),
    PrismaModule,
    UserModule,
    AiAgentModule,
    ChatModule,
    AuthModule,
    BotModule,
    GeminiModule,
    CodeExecutionModule,
    FileAnalysisModule,
    AuditModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGqlGuard,
    },
    PrismaService,
    AuditMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuditMiddleware)
      .forRoutes(
        // Apply audit middleware to all routes 
        { path: 'auth/*path', method: RequestMethod.ALL },
        { path: 'chat', method: RequestMethod.POST },
        { path: 'ai-agent', method: RequestMethod.POST },
        { path: 'bot/create', method: RequestMethod.POST },
        { path: 'gemini', method: RequestMethod.POST },
        { path: 'gemini/stream-text', method: RequestMethod.POST },
        { path: 'gemini/generate-object', method: RequestMethod.POST },
        { path: 'code-execution', method: RequestMethod.POST },
        { path: 'file-analysis', method: RequestMethod.POST },
      );
  }
}
