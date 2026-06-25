import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import {
  DebitWalletDto,
  FundWalletDto,
  RefundWalletDto,
} from './wallet.dto';

import { WalletService } from './wallet.service';

@Controller('wallets')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
  ) {}

  @Get(':organizationId')
  getWallet(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.walletService.getWallet(
      organizationId,
    );
  }

  @Post(':organizationId/fund')
  fundWallet(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: FundWalletDto,
  ) {
    return this.walletService.fundWallet(
      organizationId,
      dto.amount,
      dto.reference,
    );
  }

  @Post(':organizationId/debit')
  debitWallet(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: DebitWalletDto,
  ) {
    return this.walletService.debitWallet(
      organizationId,
      dto.amount,
      dto.reference,
      dto.description,
    );
  }

  @Post(':organizationId/refund')
  refundWallet(
    @Param('organizationId')
    organizationId: string,

    @Body()
    dto: RefundWalletDto,
  ) {
    return this.walletService.refundWallet(
      organizationId,
      dto.amount,
      dto.reference,
      dto.description,
    );
  }

  @Get(':organizationId/transactions')
  getTransactions(
    @Param('organizationId')
    organizationId: string,
  ) {
    return this.walletService.getTransactions(
      organizationId,
    );
  }
}