import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './common/database/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organization/organizations.module';
import { CatalogueModule } from './modules/catalogue/catalogue.module';
import { RedisModule } from './common/cache/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    OrganizationsModule,
    CatalogueModule,
    RedisModule
  ],
})
export class AppModule {}