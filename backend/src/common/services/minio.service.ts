import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand, PutBucketPolicyCommand } from '@aws-sdk/client-s3';
import * as https from 'https';

@Injectable()
export class MinioService implements OnModuleInit {
  private s3Client: S3Client;
  private bucket: string;
  private publicEndpoint: string;
  private internalEndpoint: string;
  private readonly logger = new Logger(MinioService.name);

  constructor(private configService: ConfigService) {
    const minioEndpoint = this.configService.getOrThrow<string>('MINIO_ENDPOINT');
    const minioPort = this.configService.getOrThrow<string>('MINIO_PORT');
    const minioUser = this.configService.getOrThrow<string>('MINIO_ROOT_USER');
    const minioPassword = this.configService.getOrThrow<string>('MINIO_ROOT_PASSWORD');
    this.bucket = this.configService.getOrThrow<string>('MINIO_BUCKET_NAME');

    // For internal communication, use the Docker service name
    this.internalEndpoint = `http://minio:${minioPort}`;
    
    // For public URLs, use the main domain with /minio path
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const protocol = useSSL ? 'https' : 'http';
    
    // Remove any existing protocol and port from the endpoint
    const cleanEndpoint = minioEndpoint.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
    this.publicEndpoint = `${protocol}://${cleanEndpoint}/minio`;

    this.logger.debug('MinIO service initialized with endpoints:', {
      internalEndpoint: this.internalEndpoint,
      publicEndpoint: this.publicEndpoint,
      bucket: this.bucket
    });

    // Create S3 client with specific configuration
    this.s3Client = new S3Client({
      endpoint: this.internalEndpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: minioUser,
        secretAccessKey: minioPassword,
      },
      forcePathStyle: true,
      // Disable SSL verification for local development
      requestHandler: {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      }
    });
  }

  async onModuleInit() {
    this.logger.debug('Initializing MinIO service...');
    this.logger.debug(`Using bucket: ${this.bucket}`);
    this.logger.debug(`Internal endpoint: ${this.internalEndpoint}`);
    this.logger.debug(`Public endpoint: ${this.publicEndpoint}`);

    await this.createBucketIfNotExists();
    await this.setBucketPolicy();

    // Verify bucket access
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.s3Client.send(command);
      this.logger.debug('Successfully verified bucket access');
    } catch (error) {
      this.logger.error(`Failed to access bucket: ${error.message}`);
      throw error;
    }
  }

  private async createBucketIfNotExists() {
    try {
      const command = new HeadBucketCommand({ Bucket: this.bucket });
      await this.s3Client.send(command);
      this.logger.debug(`Bucket ${this.bucket} already exists`);
    } catch (error) {
      if (error.name === 'NotFound') {
        const createCommand = new CreateBucketCommand({
          Bucket: this.bucket,
        });
        await this.s3Client.send(createCommand);
        this.logger.debug(`Created bucket ${this.bucket}`);
      } else {
        throw error;
      }
    }
  }

  private async setBucketPolicy() {
    try {
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${this.bucket}/*`]
          }
        ]
      };

      const command = new PutBucketPolicyCommand({
        Bucket: this.bucket,
        Policy: JSON.stringify(policy)
      });

      await this.s3Client.send(command);
      this.logger.debug('Successfully set bucket policy for public read access');
    } catch (error) {
      this.logger.error('Failed to set bucket policy:', error);
      throw error;
    }
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    this.logger.debug('Starting file upload to MinIO', {
      bucket: this.bucket,
      key,
      fileSize: file.buffer.length,
      contentType: file.mimetype
    });

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      this.logger.debug('Sending PutObjectCommand to MinIO', {
        endpoint: this.internalEndpoint,
        bucket: this.bucket,
        key
      });

      await this.s3Client.send(command);
      this.logger.debug('File uploaded successfully to MinIO');

      const fileUrl = await this.getFileUrl(key);
      this.logger.debug('Generated signed URL for file', { fileUrl });
      
      return fileUrl;
    } catch (error) {
      this.logger.error('Failed to upload file to MinIO:', {
        error: error.message,
        stack: error.stack,
        bucket: this.bucket,
        key
      });
      throw error;
    }
  }

  async getFileUrl(key: string): Promise<string> {
    try {
      this.logger.debug('Generating URL for file', {
        bucket: this.bucket,
        key,
        publicEndpoint: this.publicEndpoint
      });

      // Return a clean URL without AWS signature parameters
      const fileUrl = `${this.publicEndpoint}/${this.bucket}/${key}`;
      this.logger.debug('Generated clean URL for file', { fileUrl });
      return fileUrl;
    } catch (error) {
      this.logger.error('Error generating file URL:', {
        error: error.message,
        stack: error.stack,
        bucket: this.bucket,
        key,
        endpoint: this.publicEndpoint
      });
      throw new Error(`Failed to generate file URL: ${error.message}`);
    }
  }
}
