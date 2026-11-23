import { Module } from '@nestjs/common';
import { HealthController } from '../health.controller';

// Process APIs (Contas e acessos, Inventário, Rotas, Relatórios) + System APIs.
@Module({ controllers: [HealthController] })
export class CoreModule {}
