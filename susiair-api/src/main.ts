import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadProjectEnv } from './env.js';

async function bootstrap() {
  loadProjectEnv();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:7000', 'http://127.0.0.1:7000'],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
