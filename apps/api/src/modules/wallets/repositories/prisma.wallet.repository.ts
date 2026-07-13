import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/database/prisma/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findWalletByOrganizationId(organizationId: string) {
    return this.prisma.wallet.findUnique({
      where: {
        organizationId,
      },
    });
  }

  async fundOrganizationWallet(
    organizationId: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.wallet.update({
      where: {
        organizationId,
      },
      data: {
        balance: {
          increment: amount,
        },
      },
    });
  }

  async debitOrganizationWallet(
    organizationId: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.wallet.update({
      where: {
        organizationId,
      },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });
  }

  async refundOrganizationWallet(
    organizationId: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.wallet.update({
      where: {
        organizationId,
      },
      data: {
        balance: {
          increment: amount,
        },
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
