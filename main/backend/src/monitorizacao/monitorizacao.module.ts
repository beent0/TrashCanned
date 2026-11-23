import { Module } from '@nestjs/common';
import { HealthController } from '../health.controller';

// Monitorização e Alertas: leituras MQTT, limiares, alertas, sensores sem comunicação.
@Module({ controllers: [HealthController] })
export class MonitorizacaoModule {}
