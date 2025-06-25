import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SecurityModule } from './security/security.module';
import { ResilienceModule } from './resilience/resilience.module';
import { AdminModule } from './admin/admin.module';
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
        autoLoadEntities: true,
        synchronize: true, // Solo per sviluppo! In produzione usa migration
        logging: false,
      }),
      inject: [ConfigService],
    }),
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
