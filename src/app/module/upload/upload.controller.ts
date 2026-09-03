import { fileTypeFromBuffer } from 'file-type';
import status from 'http-status';
import { uploadBufferToCloudinary } from '../../lib/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_FOLDERS = new Set(['listings', 'avatars', 'general']);

const uploadImages = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    throw new AppError(status.BAD_REQUEST, 'At least one image file is required');
  }

  const requestedFolder = req.query.folder as string | undefined;
  const folder = requestedFolder && ALLOWED_FOLDERS.has(requestedFolder) ? requestedFolder : 'general';

  for (const file of files) {
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      throw new AppError(
        status.BAD_REQUEST,
        `File "${file.originalname}" is not a valid image (jpeg, png, webp, gif only)`,
      );
    }
  }

  const results = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer, folder)),
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Images uploaded successfully',
    data: results.map((r) => r.url),
  });
});

export const UploadController = {
  uploadImages,
};
