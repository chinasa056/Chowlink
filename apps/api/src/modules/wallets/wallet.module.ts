import { Module } from '@nestjs/common';

import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletRepository } from './repositories/prisma.wallet.repository';

@Module({
  controllers: [WalletController],

  providers: [WalletService, WalletRepository],

  exports: [WalletService, WalletRepository],
})
export class WalletModule {}
