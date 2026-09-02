import status from 'http-status';
import { config } from '../../config/index.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { AuthService } from './auth.service.js';

const setRefreshTokenCookie = (res: import('express').Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    secure: config.env === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
};

const register = catchAsync(async (req, res) => {
  const result = await AuthService.register(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: 'User registered successfully',
    data: result,
  });
});

const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Logged in successfully',
    data: result,
  });
});

const googleLogin = catchAsync(async (req, res) => {
  const result = await AuthService.googleLogin(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Logged in with Google successfully',
    data: result,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Access token retrieved successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  await AuthService.changePassword(req.user!.id, oldPassword, newPassword);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Password changed successfully',
    data: null,
  });
});

const getMe = catchAsync(async (req, res) => {
  const result = await AuthService.getMe(req.user!.id, req.user!.role);

  sendResponse(res, {
    statusCode: status.OK,
    message: 'Profile retrieved successfully',
    data: result,
  });
});

const logout = catchAsync(async (_req, res) => {
  res.clearCookie('refreshToken');
  sendResponse(res, {
    statusCode: status.OK,
    message: 'Logged out successfully',
    data: null,
  });
});

export const AuthController = {
  register,
  login,
  googleLogin,
  refreshToken,
  changePassword,
  getMe,
  logout,
};
