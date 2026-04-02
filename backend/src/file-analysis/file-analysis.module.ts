import { Module } from '@nestjs/common';
import { FileAnalysisService } from './file-analysis.service';
import { FileAnalysisController } from './file-analysis.controller';
import { GeminiModule } from 'src/gemini/gemini.module';

@Module({
  imports: [GeminiModule],
  controllers: [FileAnalysisController],
  providers: [FileAnalysisService],
})
export class FileAnalysisModule {}
