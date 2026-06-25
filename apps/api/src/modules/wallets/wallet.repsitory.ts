import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findByOrganizationId(
    organizationId: string,
  ) {
    return this.prisma.wallet.findUnique({
      where: {
        organizationId,
      },
    });
  }

  async createTransaction(data: any) {
    return this.prisma.walletTransaction.create({
      data,
    });
  }

  async getTransactions(walletId: string) {
    return this.prisma.walletTransaction.findMany({
      where: {
        walletId,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}