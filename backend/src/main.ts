import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Starting application...');
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS
    // app.enableCors({
    //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    //   credentials: true,
    //   allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    //   exposedHeaders: ['Content-Range', 'X-Content-Range'],
    //   maxAge: 3600
    // });
    
    // Set global prefix in case of SSL configuration with nginx
    // app.setGlobalPrefix('backend');
    
    // Initialize database only if DatabaseModule is available
    try {
      logger.log('Initializing database...');
      const { DatabaseService } = await import('./database/database.service');
      const databaseService = app.get(DatabaseService);
      await databaseService.initializeDatabase();
      logger.log('Database initialized successfully');
    } catch (dbError) {
      logger.warn('Database initialization skipped:', dbError.message);
    }
    
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();
