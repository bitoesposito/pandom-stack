import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SecurityModule } from './security/security.module';
import { ResilienceModule } from './resilience/resilience.module';
import { AdminModule } from './admin/admin.module';
import { MinioModule } from './common/modules/minio.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    SecurityModule,
    ResilienceModule,
    AdminModule,
    MinioModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
