import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { Bot, BotSchema } from './schema/bot.schema';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: Bot.name, schema: BotSchema }]),
    CacheModule.register(),
  ],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
