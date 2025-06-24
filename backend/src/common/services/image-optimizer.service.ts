import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageOptimizerService {
  private readonly logger = new Logger(ImageOptimizerService.name);

  /**
   * Optimizes an image buffer according to the specified parameters
   * 
   * @param buffer - The image buffer to optimize
   * @param options - Optimization options
   * @returns Promise<Buffer> - The optimized image buffer
   */
  async optimizeImage(
    buffer: Buffer,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff' | 'svg';
    } = {}
  ): Promise<Buffer> {
    try {
      const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 80,
        format = 'jpeg'
      } = options;

      // Get image metadata
      const metadata = await sharp(buffer).metadata();
      
      // Calculate new dimensions maintaining aspect ratio
      let width = metadata.width;
      let height = metadata.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Process image
      const processedImage = sharp(buffer)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });

      // Apply format-specific optimizations
      switch (format) {
        case 'jpeg':
          return processedImage
            .jpeg({
              quality,
              mozjpeg: true, // Use mozjpeg for better compression
              chromaSubsampling: '4:4:4' // Better color quality
            })
            .toBuffer();

        case 'png':
          return processedImage
            .png({
              quality,
              compressionLevel: 9, // Maximum compression
              palette: true // Use palette for better compression
            })
            .toBuffer();

        case 'webp':
          return processedImage
            .webp({
              quality,
              effort: 6, // Higher effort for better compression
              lossless: false
            })
            .toBuffer();

        case 'gif':
          return processedImage
            .gif({
              effort: 6,
              dither: 1.0
            })
            .toBuffer();

        case 'avif':
          return processedImage
            .avif({
              quality,
              effort: 6,
              chromaSubsampling: '4:4:4'
            })
            .toBuffer();

        case 'tiff':
          return processedImage
            .tiff({
              quality,
              compression: 'lzw'
            })
            .toBuffer();

        case 'svg':
          // For SVG, we don't need to optimize as it's already vector-based
          return buffer;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      this.logger.error('Failed to optimize image:', error);
      throw error;
    }
  }

  /**
   * Determines the best format for an image based on its content
   * 
   * @param buffer - The image buffer to analyze
   * @returns Promise<'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff' | 'svg'> - The recommended format
   */
  async determineBestFormat(buffer: Buffer): Promise<'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff' | 'svg'> {
    try {
      const metadata = await sharp(buffer).metadata();
      
      // If image has transparency, use PNG
      if (metadata.hasAlpha) {
        return 'png';
      }

      // For animated images, use GIF
      if (metadata.pages && metadata.pages > 1) {
        return 'gif';
      }

      // For vector graphics, keep as SVG
      if (metadata.format === 'svg') {
        return 'svg';
      }

      // For photos and complex images, use WebP
      if (metadata.channels === 3) {
        return 'webp';
      }

      // Default to JPEG for other cases
      return 'jpeg';
    } catch (error) {
      this.logger.error('Failed to determine best format:', error);
      return 'jpeg'; // Fallback to JPEG
    }
  }

  /**
   * Converts HEIC/HEIF images to JPEG
   * This is a fallback for when the native HEIC support is not available
   */
  private async convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .jpeg({
          quality: 90,
          mozjpeg: true
        })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to convert HEIC to JPEG:', error);
      throw error;
    }
  }

  /**
   * Converts BMP images to PNG
   * This is a fallback for when the native BMP support is not available
   */
  private async convertBmpToPng(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .png({
          quality: 90,
          compressionLevel: 9
        })
        .toBuffer();
    } catch (error) {
      this.logger.error('Failed to convert BMP to PNG:', error);
      throw error;
    }
  }
} 