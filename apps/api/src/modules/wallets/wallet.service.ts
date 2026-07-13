import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma/prisma.service';

import { WalletTransactionType } from '@prisma/client';

import { WalletRepository } from './repositories/prisma.wallet.repository';
import { WalletTransactionResponse } from './interfaces/wallet.interface';
import { DebitWalletDto, FundWalletDto, RefundWalletDto } from './dto/wallet.dto';
import { generateTransactionReference } from './wallet-reference.util';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletRepository: WalletRepository,
  ) {}

  async getWallet(organizationId: string) {
    return this.walletRepository.findWalletByOrganizationId(organizationId);
  }

  async fundWallet(
    organizationId: string, data: FundWalletDto
  ): Promise<WalletTransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          organizationId,
        },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: {
            increment: data.amount,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: data.amount,
          type: WalletTransactionType.CREDIT,
          reference: generateTransactionReference(WalletTransactionType.CREDIT),
          description: 'Wallet funding',
        },
      });

      return {
        message: 'Wallet funded successfully',
        data: updatedWallet,
      };
    });
  }

  async debitWallet(
    organizationId: string,
   data: DebitWalletDto
  ): Promise<WalletTransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          organizationId,
        },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      if (Number(wallet.balance) < data.amount) {
        throw new BadRequestException('Insufficient balance');
      }

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: {
            decrement: data.amount,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: data.amount,
          type: WalletTransactionType.DEBIT,
          reference: generateTransactionReference(WalletTransactionType.DEBIT),
          description: data.description,
        },
      });

      return {
        message: 'Wallet debited successfully',
        data: updatedWallet,
      };
    });
  }

  async refundWallet(
    organizationId: string,
  data: RefundWalletDto
  ): Promise<WalletTransactionResponse> {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: {
          organizationId,
        },
      });

      if (!wallet) {
        throw new BadRequestException('Wallet not found');
      }

      const updatedWallet = await tx.wallet.update({
        where: {
          id: wallet.id,
        },

        data: {
          balance: {
            increment: data.amount,
          },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: data.amount,
          type: WalletTransactionType.REFUND,
          reference: generateTransactionReference(WalletTransactionType.REFUND),
          description: data.description,
        },
      });

      return {
        message: 'Wallet refunded successfully',
        data: updatedWallet,
      };
    });
  }

  async getTransactions(organizationId: string) {
    const wallet =
      await this.walletRepository.findWalletByOrganizationId(organizationId);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return this.walletRepository.getTransactions(wallet.id);
  }

  async ensureWalletExists(organizationId: string) {
    const wallet =
      await this.walletRepository.findWalletByOrganizationId(organizationId);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    return wallet;
  }

  async ensureSufficientBalance(organizationId: string, amount: number) {
    const wallet =
      await this.walletRepository.findWalletByOrganizationId(organizationId);

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (Number(wallet.balance) < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    return wallet;
  }
}
