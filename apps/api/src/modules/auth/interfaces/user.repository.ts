import { User } from '@prisma/client';

export abstract class UserRepository {
  abstract findByEmail(email: string): Promise<User | null>;

  abstract create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: any;
    organizationId: string;
  }): Promise<User>;

  abstract updateRefreshToken(userId: string, token: string): Promise<void>;

  abstract findById(id: string): Promise<any>;
}