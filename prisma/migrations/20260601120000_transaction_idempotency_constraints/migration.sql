-- Prevent duplicate wallets, duplicate currency rows, and retried transaction references.
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

CREATE UNIQUE INDEX "Transaction_userId_reference_key" ON "Transaction"("userId", "reference");

CREATE UNIQUE INDEX "WalletBalance_walletId_currency_key" ON "WalletBalance"("walletId", "currency");
