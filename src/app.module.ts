import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClimaController } from './clima/clima.controller';
import { GeminiModule } from './gemini/gemini.module';

@Module({
  imports: [ConfigModule.forRoot(), GeminiModule],
  controllers: [ClimaController],
})
export class AppModule {}