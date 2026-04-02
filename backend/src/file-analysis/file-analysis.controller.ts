import { Controller, Post, UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileAnalysisService } from './file-analysis.service';
import { FileAnalysisRequestDto, FileAnalysisResponseDto } from './dto/file-analysis.dto';

@ApiTags('File Analysis')
@Controller('file-analysis')
export class FileAnalysisController {

    constructor(
        private readonly FileAnalysisService: FileAnalysisService
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({
        summary: 'Analyze a file (PDF or image)',
        description: 'Upload a PDF, JPEG, PNG, or WebP file for AI analysis. The AI will analyze the content and provide insights. Optionally provide a custom prompt for specific analysis.'
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'File to analyze (PDF, JPEG, PNG, or WebP)',
                },
                prompt: {
                    type: 'string',
                    description: 'Optional custom prompt for analysis',
                    example: 'Extract all key points and summarize this document',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'File analyzed successfully',
        type: FileAnalysisResponseDto,
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - No file provided or invalid file type',
    })
    @ApiResponse({
        status: 500,
        description: 'Internal server error',
    })
    async FileAnalysis(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { prompt?: string }
    ): Promise<FileAnalysisResponseDto> {
        return this.FileAnalysisService.analyzeFile(file, body)
    }
}
