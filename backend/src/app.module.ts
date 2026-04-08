import { Module } from '@nestjs/common';

import { GraphQLModule } from '@nestjs/graphql';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MongooseModule.forRoot(process.env.MONGO_URL!),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      context: ({ req }: { req: any }) => ({ req }),
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
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
