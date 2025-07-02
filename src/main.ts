import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for all requests
  app.enableCors({
    origin: true, // Allow requests from any origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT ?? 3003);
  console.log(`Server is running on port ${process.env.PORT ?? 3003}`);
}
bootstrap();
