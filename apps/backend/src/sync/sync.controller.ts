import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { User } from '../users/user.entity';
import { SyncPushRequestDto } from './sync.dto';
import { SyncService } from './sync.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post(['v1/sync/push', 'sync/push'])
  @HttpCode(HttpStatus.OK)
  async push(
    @Req() req: FastifyRequest & { user: User },
    @Body() dto: SyncPushRequestDto,
  ) {
    return this.syncService.push(req.user.id, dto);
  }

  @Get(['v1/sync/pull', 'sync/pull'])
  async pull(
    @Req() req: FastifyRequest & { user: User },
    @Query('since') since?: string,
  ) {
    return this.syncService.pull(req.user.id, since);
  }

  @Delete(['v1/user/data', 'user/data'])
  @HttpCode(HttpStatus.OK)
  async deleteUserData(@Req() req: FastifyRequest & { user: User }) {
    return this.syncService.deleteAllUserData(req.user.id);
  }
}
