import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { loadProjectEnv } from './env.js';

async function bootstrap() {
  loadProjectEnv();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      process.env.APP_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
