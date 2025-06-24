import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailModule } from 'src/common/modules/mail.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserProfile } from './entities/user-profile.entity';
import { MinioModule } from '../common/modules/minio.module';
import { ImageOptimizerModule } from '../common/modules/image-optimizer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    MailModule,
    MinioModule,
    ImageOptimizerModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {} 