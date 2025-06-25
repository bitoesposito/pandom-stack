import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { UserProfile } from '../users/entities/user-profile.entity';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

/**
 * Authentication module configuration
 * Handles user authentication, JWT token generation, and role-based access control
 */
@Module({
    imports: [
        // Database configuration for User and UserProfile entities
        TypeOrmModule.forFeature([User, UserProfile]),
        
        // JWT configuration with async options
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
                },
            }),
        }),
        PassportModule,
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        RolesGuard,
        JwtStrategy,
    ],
    exports: [AuthService, RolesGuard],
})
export class AuthModule {}