import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import {
  DebitWalletDto,
  FundWalletDto,
  RefundWalletDto,
} from './dto/wallet.dto';

import { WalletService } from './wallet.service';
import { WalletTransactionResponse } from './interfaces/wallet.interface';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':organizationId')
  getWallet(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.walletService.getWallet(organizationId);
  }

  @Post(':organizationId/fund')
  fundWallet(
    @Param('organizationId')
    organizationId: string,
    @Body()
    dto: FundWalletDto,
  ): Promise<WalletTransactionResponse> {
    return this.walletService.fundWallet(organizationId, dto);
  }

  @Post(':organizationId/debit')
  debitWallet(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: DebitWalletDto,
  ) {
    return this.walletService.debitWallet(organizationId, dto);
  }

  @Post(':organizationId/refund')
  refundWallet(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: RefundWalletDto,
  ) {
    return this.walletService.refundWallet(organizationId, dto);
  }

  @Get(':organizationId/transactions')
  getTransactions(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.walletService.getTransactions(organizationId);
  }
}
