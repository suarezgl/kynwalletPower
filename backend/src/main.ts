import { NestFactory } from '@nestjs/core';
import { configureApp } from './bootstrap/configure-app.js';
import { validateEnv } from './config/env.validation.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const config = validateEnv(process.env);
  const app = await NestFactory.create(AppModule.register(config));
  configureApp(app);
  await app.listen(config.port);
}

void bootstrap();
