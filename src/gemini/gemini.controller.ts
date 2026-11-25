import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';

import { BasicPromptDto } from './dtos/basic-prompt';
import { PlanearActividadDto } from './dtos/planear-actividad';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get()
  estado() {
    return { estado: 'Disponible' };
  }

  @Post('basic-prompt')
  basicPrompt(@Body() dto: BasicPromptDto) {
    return this.geminiService.basicPrompt(dto);
  }

  @Post('planear-actividad')
  planearActividad(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: PlanearActividadDto,
  ) {
    return this.geminiService.planearActividad(dto);
  }
}