import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let configured = false;

function ensureConfigured() {
  if (configured) return true;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    return false;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
  configured = true;
  return true;
}

function resourceType(mime) {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'video';
  return 'raw';
}

async function compressImage(buffer, mime) {
  if (!mime.startsWith('image/') || mime === 'image/gif') return buffer;
  try {
    return await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (err) {
    logger.warn({ err }, 'Image compression failed, using original');
    return buffer;
  }
}

export async function uploadBuffer(file, folder = 'connectx') {
  if (!ensureConfigured()) {
    throw new Error('Cloudinary is not configured');
  }
  const buffer = await compressImage(file.buffer, file.mimetype);
  const type = resourceType(file.mimetype);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: type },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          type,
          name: file.originalname,
          size: file.size,
          mime: file.mimetype,
        });
      },
    );
    stream.end(buffer);
  });
}

export async function deleteAsset(publicId, type = 'image') {
  if (!ensureConfigured() || !publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: type });
}
