import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcrRequest } from './ocr-request.entity';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';

@Module({
  imports: [TypeOrmModule.forFeature([OcrRequest])],
  controllers: [OcrController],
  providers: [OcrService],
})
export class OcrModule {}
