import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadBuffer } from '../services/cloudinary.service.js';

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) throw ApiError.badRequest('No files uploaded');
  const assets = await Promise.all(files.map((f) => uploadBuffer(f, 'connectx/messages')));
  res.status(201).json({ attachments: assets });
});
