import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import status from 'http-status';
import { config } from '../../config/index.js';
import { welcomeEmailTemplate } from '../../lib/emailTemplates.js';
import { sendEmail } from '../../lib/mailer.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/AppError.js';
import { signToken, verifyToken } from '../../utils/jwt.js';
import type {
  IGoogleLoginPayload,
  IJwtPayload,
  ILoginPayload,
  IRegisterPayload,
} from './auth.interface.js';

const googleClient = new OAuth2Client(config.google.clientId);

const generateTokens = (payload: IJwtPayload) => {
  const accessToken = signToken(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn as any,
  );
  const refreshToken = signToken(
    { userId: payload.userId, email: payload.email, role: payload.role },
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn as any,
  );
  return { accessToken, refreshToken };
};

const createProfileForRole = async (
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string,
  role: 'LANDLORD' | 'TENANT',
  name: string,
  phone?: string,
) => {
  if (role === 'LANDLORD') {
    return tx.landlordProfile.create({ data: { userId, name, phone } });
  }
  return tx.tenantProfile.create({ data: { userId, name, phone } });
};

const register = async (payload: IRegisterPayload) => {
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingUser) {
    throw new AppError(status.CONFLICT, 'An account with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(payload.password, config.bcryptSaltRounds);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
        role: payload.role,
        isVerified: true,
      },
    });

    await createProfileForRole(tx, user.id, payload.role, payload.name, payload.phone);

    return user;
  });

  const tokens = generateTokens({ userId: result.id, email: result.email, role: result.role });

  void sendEmail({
    to: result.email,
    subject: 'Welcome to Roomly',
    html: welcomeEmailTemplate(payload.name, payload.role),
  });

  return { user: { id: result.id, email: result.email, role: result.role }, ...tokens };
};

const login = async (payload: ILoginPayload) => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user || !user.password) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password');
  }

  if (user.status === 'BLOCKED') {
    throw new AppError(status.FORBIDDEN, 'Your account has been blocked');
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid email or password');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

  return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: payload.idToken,
    audience: config.google.clientId,
  });

  const googlePayload = ticket.getPayload();
  if (!googlePayload?.email) {
    throw new AppError(status.UNAUTHORIZED, 'Invalid Google token');
  }

  let user = await prisma.user.findUnique({ where: { email: googlePayload.email } });

  if (!user) {
    const role = payload.role ?? 'TENANT';
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: googlePayload.email as string,
          role,
          provider: 'GOOGLE',
          googleId: googlePayload.sub,
          isVerified: true,
        },
      });
      await createProfileForRole(
        tx,
        newUser.id,
        role,
        googlePayload.name || googlePayload.email!.split('@')[0],
      );
      return newUser;
    });
  }

  if (user.status === 'BLOCKED') {
    throw new AppError(status.FORBIDDEN, 'Your account has been blocked');
  }

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role });

  return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
};

const refreshToken = async (token: string) => {
  const decoded = verifyToken(token, config.jwt.refreshSecret) as IJwtPayload;

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, 'User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(status.FORBIDDEN, 'Your account is not active');
  }

  const accessToken = signToken(
    { userId: user.id, email: user.email, role: user.role },
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn as any,
  );

  return { accessToken };
};

const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new AppError(status.NOT_FOUND, 'User not found');
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
  if (!isPasswordValid) {
    throw new AppError(status.UNAUTHORIZED, 'Old password is incorrect');
  }

  const hashedPassword = await bcrypt.hash(newPassword, config.bcryptSaltRounds);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, needsPasswordChange: false },
  });

  return null;
};

const getMe = async (userId: string, role: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      landlordProfile: role === 'LANDLORD',
      tenantProfile: role === 'TENANT',
      admin: role === 'ADMIN',
    },
  });

  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const AuthService = {
  register,
  login,
  googleLogin,
  refreshToken,
  changePassword,
  getMe,
};
