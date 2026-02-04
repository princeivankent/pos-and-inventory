import { Request } from 'express';

export interface RequestUser {
  userId: string;
  email: string;
  storeId?: string;
  role?: string;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
