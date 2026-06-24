import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import { UserRepository } from '../../domain/interfaces/user.repository';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: any;
    organizationId: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }

  async findById(id: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}