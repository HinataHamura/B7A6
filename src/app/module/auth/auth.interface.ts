import type { Role } from '../../../generated/prisma/index.js';

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Extract<Role, 'LANDLORD' | 'TENANT'>;
  phone?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
  role?: Extract<Role, 'LANDLORD' | 'TENANT'>;
}

export interface IJwtPayload {
  userId: string;
  email: string;
  role: Role;
}
