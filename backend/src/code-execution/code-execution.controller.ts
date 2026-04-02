import { 
  Controller,
  Body,
  Post,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody
} from "@nestjs/swagger"
import { CodeExecutionService } from './code-execution.service';
import {
  CodeExecutionRequestDto,
  CodeExecutionResponseDto
} from "./dto/code-execution.dto"

@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Execute code for a give problem",
    description: "Uses AI to generate and execute code to solve a given problem. Supports code execution tools for runnning python and other languages"
  })
  @ApiBody({type: CodeExecutionRequestDto})
  @ApiResponse({
    status: 200,
    description: "Code execution completed successfully",
    type: CodeExecutionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid input"
  })
  @ApiResponse({
    status: 500,
    description: "Internal server error"
  })
  async codeExecution(@Body() body: CodeExecutionRequestDto): Promise<CodeExecutionResponseDto> {
    return this.codeExecutionService.codeExecution(body.problem)
  }
}
