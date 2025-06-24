import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionService } from '../services/session.service';
import { User } from '../../auth/entities/user.entity';
import { LoggerService } from '../services/logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SessionService, LoggerService],
  exports: [SessionService],
})
export class SessionModule {} 