import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';

// Reindirizza console.log, console.error, ecc. verso il file
const logFilePath = path.join(process.cwd(), 'logs', 'log.txt');

// Crea la directory logs se non esiste
const logsDir = path.dirname(logFilePath);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Funzione per scrivere su file
const writeToLogFile = (level: string, args: any[]) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ')
  };
  
  const line = JSON.stringify(logEntry) + '\n';
  fs.appendFileSync(logFilePath, line, { encoding: 'utf8' });
};

// Override console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

console.log = function(...args: any[]) {
  originalConsoleLog.apply(console, args);
  writeToLogFile('LOG', args);
};

console.error = function(...args: any[]) {
  originalConsoleError.apply(console, args);
  writeToLogFile('ERROR', args);
};

console.warn = function(...args: any[]) {
  originalConsoleWarn.apply(console, args);
  writeToLogFile('WARN', args);
};

console.info = function(...args: any[]) {
  originalConsoleInfo.apply(console, args);
  writeToLogFile('INFO', args);
};

console.debug = function(...args: any[]) {
  originalConsoleDebug.apply(console, args);
  writeToLogFile('DEBUG', args);
};

async function bootstrap() {
  const logger = new Logger('AppLogger');
  
  try {
    logger.log('Starting application...', 'Bootstrap');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // Enable CORS
    app.enableCors({
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 3600
    });
    
    // Trust proxy for correct IP detection behind reverse proxy/Docker
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    
    // Apply global metrics interceptor
    const metricsInterceptor = app.get(MetricsInterceptor);
    app.useGlobalInterceptors(metricsInterceptor);
    
    // Set global prefix in case of SSL configuration with nginx
    // app.setGlobalPrefix('backend');
    
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    logger.log(`Application is running on port ${port}`, 'Bootstrap');
  } catch (error) {
    logger.error('Failed to start application:', 'Bootstrap', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}
bootstrap();
