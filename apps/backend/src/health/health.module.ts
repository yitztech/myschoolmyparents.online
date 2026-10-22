import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ReleasesController } from './releases.controller';

@Module({ controllers: [HealthController, ReleasesController] })
export class HealthModule {}
