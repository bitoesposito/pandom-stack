import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Extends Passport's AuthGuard to protect routes requiring JWT authentication
 * Uses the 'jwt' strategy defined in JwtStrategy
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    private readonly logger = new Logger(JwtAuthGuard.name);

    /**
     * Determines if the request can be activated
     * Delegates to the parent class's canActivate method
     * 
     * @param context - Execution context containing request information
     * @returns Promise<boolean> - True if request is authorized
     */
    canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        this.logger.debug('JWT Guard - Checking request', {
            path: request.path,
            method: request.method,
            hasAuthHeader: !!request.headers.authorization
        });

        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any) {
        if (err || !user) {
            this.logger.error('JWT Guard - Authentication failed', {
                error: err?.message,
                info: info?.message,
                hasUser: !!user
            });
            throw err || new Error('Authentication failed');
        }

        this.logger.debug('JWT Guard - Authentication successful', {
            userId: user.uuid,
            role: user.role
        });

        return user;
    }
}