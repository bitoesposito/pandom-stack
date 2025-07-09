import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './common/services/logger.service';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { CookieAuthInterceptor } from './auth/interceptors/cookie-auth.interceptor';
import * as cookieParser from 'cookie-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
    
    // Enable cookie parser
    app.use(cookieParser());
    
    // Get FE_URL from config
    const configService = app.get(ConfigService);
    const feUrl = configService.get<string>('FE_URL') || 'http://localhost:4200';
    logger.log(`CORS allowed origin: ${feUrl}`, 'Bootstrap');

    // Enable CORS with cookie support and allowed origin
    app.enableCors({
      origin: feUrl,
      credentials: true,
    });
    
    // Trust proxy for correct IP detection behind reverse proxy/Docker
    app.getHttpAdapter().getInstance().set('trust proxy', true);
    
    // Apply global interceptors
    const metricsInterceptor = app.get(MetricsInterceptor);
    const cookieAuthInterceptor = app.get(CookieAuthInterceptor);
    app.useGlobalInterceptors(metricsInterceptor, cookieAuthInterceptor);
    
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
