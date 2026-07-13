import { WalletTransactionType } from '@prisma/client';
import { randomBytes } from 'crypto';

export function generateTransactionReference(
  type: WalletTransactionType,
): string {
  const random = randomBytes(3).toString('hex').toUpperCase();

  return `${type}-${Date.now()}-${random}`;
}