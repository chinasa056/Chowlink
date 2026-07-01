import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma/prisma.service';

import { WalletTransactionType } from '@prisma/client';

import { WalletRepository } from './wallet.repsitory';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletRepository: WalletRepository,
  ) {}

  async getWallet(
    organizationId: string,
  ) {
    return this.walletRepository.findByOrganizationId(
      organizationId,
    );
  }

  async fundWallet(
    organizationId: string,
    amount: number,
    reference: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const wallet =
          await tx.wallet.findUnique({
            where: {
              organizationId,
            },
          });

        if (!wallet) {
          throw new BadRequestException(
            'Wallet not found',
          );
        }

        const updatedWallet =
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },

            data: {
              balance: {
                increment: amount,
              },
            },
          });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: WalletTransactionType.CREDIT,
            reference,
            description:
              'Wallet funding',
          },
        });

        return updatedWallet;
      },
    );
  }

  async debitWallet(
    organizationId: string,
    amount: number,
    reference: string,
    description: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const wallet =
          await tx.wallet.findUnique({
            where: {
              organizationId,
            },
          });

        if (!wallet) {
          throw new BadRequestException(
            'Wallet not found',
          );
        }

        if (
          Number(wallet.balance) <
          amount
        ) {
          throw new BadRequestException(
            'Insufficient balance',
          );
        }

        const updatedWallet =
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },

            data: {
              balance: {
                decrement: amount,
              },
            },
          });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: WalletTransactionType.DEBIT,
            reference,
            description,
          },
        });

        return updatedWallet;
      },
    );
  }

  async refundWallet(
    organizationId: string,
    amount: number,
    reference: string,
    description: string,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const wallet =
          await tx.wallet.findUnique({
            where: {
              organizationId,
            },
          });

        if (!wallet) {
          throw new BadRequestException(
            'Wallet not found',
          );
        }

        const updatedWallet =
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },

            data: {
              balance: {
                increment: amount,
              },
            },
          });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount,
            type: WalletTransactionType.REFUND,
            reference,
            description,
          },
        });

        return updatedWallet;
      },
    );
  }

  async getTransactions(
    organizationId: string,
  ) {
    const wallet =
      await this.walletRepository.findByOrganizationId(
        organizationId,
      );

    if (!wallet) {
      throw new BadRequestException(
        'Wallet not found',
      );
    }

    return this.walletRepository.getTransactions(
      wallet.id,
    );
  }

  async ensureWalletExists(organizationId: string) {
    const wallet =
      await this.walletRepository.findByOrganizationId(
        organizationId,
      );

    if (!wallet) {
      throw new BadRequestException(
        'Wallet not found',
      );
    }

    return wallet;
  } 

  async ensureSufficientBalance(
    organizationId: string,
    amount: number,
  ) {
    const wallet =
      await this.walletRepository.findByOrganizationId(
        organizationId,
      );

    if (!wallet) {
      throw new BadRequestException(
        'Wallet not found',
      );
    }

    if (
      Number(wallet.balance) <
      amount
    ) {
      throw new BadRequestException(
        'Insufficient balance',
      );
    }

    return wallet;
  } 
}