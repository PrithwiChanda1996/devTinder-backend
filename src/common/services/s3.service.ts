import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION');
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET_NAME');

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Upload profile photo to S3 with optimization
   * Expects frontend to send pre-cropped images (400x400)
   * Backend ensures max dimensions and optimizes compression as a safeguard
   */
  async uploadProfilePhoto(file: Express.Multer.File, userId: string): Promise<string> {
    try {
      // Optimize and ensure max 400x400 (safeguard for frontend-cropped images)
      // If image is already 400x400 from frontend, this won't crop it
      // If larger, it will scale down proportionally without cropping
      const optimizedBuffer = await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'inside', // Scale down to fit within 400x400, maintaining aspect ratio
          withoutEnlargement: true, // Don't upscale smaller images
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      const key = `profile-photos/${userId}-${Date.now()}.jpg`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: optimizedBuffer,
        ContentType: 'image/jpeg',
        CacheControl: 'max-age=31536000', // 1 year cache
      });

      await this.s3Client.send(command);

      const photoUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
      this.logger.log(`Uploaded profile photo: ${photoUrl}`);

      return photoUrl;
    } catch (error) {
      this.logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload image to S3');
    }
  }

  /**
   * Delete profile photo from S3
   */
  async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract key from URL
      // Format: https://bucket-name.s3.region.amazonaws.com/key
      const urlParts = photoUrl.split('.amazonaws.com/');

      if (urlParts.length < 2) {
        this.logger.warn(`Invalid S3 URL format: ${photoUrl}`);
        return;
      }

      const key = urlParts[1];

      if (!key || !key.startsWith('profile-photos/')) {
        this.logger.warn(`Key does not match expected pattern: ${key}`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted profile photo: ${key}`);
    } catch (error) {
      this.logger.error('Error deleting from S3:', error);
      // Don't throw error - deletion is non-critical
    }
  }
}
