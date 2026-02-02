import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const imageUploadOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(
        new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)'),
        false,
      );
    }
    callback(null, true);
  },
};
