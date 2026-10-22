import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SyncParagraphDto {
  @IsString()
  id: string;

  @IsNumber()
  orderKey: number;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  localeOverride?: string | null;

  @IsNumber()
  textRevision: number;
}

export class SyncPageDto {
  @IsString()
  id: string;

  @IsNumber()
  orderKey: number;

  @IsString()
  status: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncParagraphDto)
  paragraphs: SyncParagraphDto[];

  @IsOptional()
  @IsString()
  createdAt?: string | null;
}

export class SyncBookDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  homeLocale: string;

  @IsString()
  learningLocale: string;

  @IsOptional()
  @IsString()
  voiceId?: string | null;

  @IsNumber()
  speechRate: number;

  @IsNumber()
  lastParagraph: number;

  @IsNumber()
  lastOffset: number;

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;

  @IsNumber()
  contentRevision: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncPageDto)
  pages: SyncPageDto[];

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

export class SyncPushRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncBookDto)
  books: SyncBookDto[];

  @IsArray()
  @IsString({ each: true })
  deletedBookIds: string[];
}
