import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { OcrRequest } from './ocr-request.entity';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

@Module({
  // AuthModule aporta el JwtAuthGuard que protege POST /api/ocr.
  imports: [TypeOrmModule.forFeature([OcrRequest]), AuthModule],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
