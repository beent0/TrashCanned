import { NestFactory } from '@nestjs/core';
import { Type } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { ExperienceModule } from './experience/experience.module';
import { MonitorizacaoModule } from './monitorizacao/monitorizacao.module';

// One codebase, three deployments (Fase 3, decisão 2): SERVICE picks the root module.
const modules: Record<string, Type> = {
  core: CoreModule,
  experience: ExperienceModule,
  monitorizacao: MonitorizacaoModule,
};

async function bootstrap() {
  const service = process.env.SERVICE ?? 'core';
  const root = modules[service];
  if (!root) throw new Error(`Unknown SERVICE "${service}"`);
  const app = await NestFactory.create(root);
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
