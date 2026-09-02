import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

export const signToken = (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: SignOptions['expiresIn'],
): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};
