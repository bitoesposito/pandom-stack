import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SecurityModule } from './security/security.module';
import { ResilienceModule } from './resilience/resilience.module';
import { AdminModule } from './admin/admin.module';
import { User } from './auth/entities/user.entity';
import { UserProfile } from './users/entities/user-profile.entity';
import { CommonModule } from './common/modules/common.module';
// import { MinioModule } from './common/modules/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [User, UserProfile],
        synchronize: true, // Solo per sviluppo! In produzione usa migration
        logging: true, // Abilita logging per debug
        ssl: false,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    SecurityModule,
    ResilienceModule,
    AdminModule,
    // MinioModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
