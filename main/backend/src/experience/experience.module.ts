import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { HealthController } from '../health.controller';

// Web Experience API + WebSocket gateway; also serves the React build (copied to /app/public in the image).
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      exclude: ['/api/{*path}', '/ws/{*path}'],
    }),
  ],
  controllers: [HealthController],
})
export class ExperienceModule {}
