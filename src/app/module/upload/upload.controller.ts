import status from 'http-status';
import { uploadBufferToCloudinary } from '../../lib/cloudinary.js';
import { AppError } from '../../utils/AppError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';

const uploadImages = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    throw new AppError(status.BAD_REQUEST, 'At least one image file is required');
  }

  const folder = (req.query.folder as string) || 'general';

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
