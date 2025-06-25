import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  // Puoi aggiungere qui metodi di health check o utility se servono
} 