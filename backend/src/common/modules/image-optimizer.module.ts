import { Module } from '@nestjs/common';
import { ImageOptimizerService } from '../services/image-optimizer.service';

@Module({
  providers: [ImageOptimizerService],
  exports: [ImageOptimizerService],
})
export class ImageOptimizerModule {} 