import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './common/database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organization/organizations.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { RedisModule } from './common/cache/redis.module';
import { WalletModule } from './modules/wallets/wallet.module';
import { BullModule } from '@nestjs/bullmq';
import { AppBullMQModule } from './common/queues/bullmq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  AppBullMQModule,

    PrismaModule,
    AuthModule,
    OrganizationsModule,
    CatalogueModule,
    RedisModule,
    WalletModule,
  ],
})
export class AppModule {}
