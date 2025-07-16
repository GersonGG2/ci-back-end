import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita la validación global
  app.useGlobalPipes(new ValidationPipe());
  
  // Habilita CORS para desarrollo
  app.enableCors();
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();