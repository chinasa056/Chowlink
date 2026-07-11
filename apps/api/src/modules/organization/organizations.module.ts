import { Module } from '@nestjs/common';

import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './interfaces/oeganization.repository';
import { PrismaOrganizationRepository } from './repositories/prisma.organization.repository';

@Module({
  controllers: [OrganizationController],

  providers: [
    OrganizationService,
    {
      provide: OrganizationRepository,
      useClass: PrismaOrganizationRepository,
    },
  ],
  exports: [OrganizationService, OrganizationRepository],
})
export class OrganizationsModule {}
