import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { GeminiConfig } from 'config/gemini-config';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class FileAnalysisService {
    private readonly logger = new Logger(FileAnalysisService.name)

    constructor(
        private readonly geminiService: GeminiService
    ) { }

    async analyzeFile(
        file: Express.Multer.File,
        request: any
    ) {
        if (!file) {
            throw new BadRequestException("No file provided")
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
            throw new BadRequestException("Invalid file type. Allowed: PDF, JPEG, PNG, WebP")
        }

        this.logger.log(`Analyzing file: ${file.originalname} ${file.mimetype}`)

        const fileDataPayload: { data: Buffer | string, mimeType: string, isPath?: boolean } =
            (file.path) ? { data: file.path, mimeType: file.mimetype, isPath: true }
                : { data: file.buffer as Buffer, mimeType: file.mimetype };

        const prompt = request.prompt || 
            `Analyze this ${file.mimetype.includes("pdf") ? "PDF document" : "image"} and provide a comprehensive summary with key insights`
        
        const response = await this.geminiService.generateContent(prompt,{
            model: GeminiConfig.models.vision,
            fileData: {
                ...fileDataPayload,
                isPath: fileDataPayload.isPath ? String(fileDataPayload.isPath) : undefined
            },
            thinkingBudget: 4096
        })

        return {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            analysis: response.text,
            sources: response.sources,
            usage: response.usage,
            cost: this.geminiService.calculateCost(response.usage),
            timestamp: new Date()    
        }

    }
} 
