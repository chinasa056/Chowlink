import { Wallet } from '@prisma/client';

export interface WalletTransactionResponse {
  message: string;
  data: Wallet;
}