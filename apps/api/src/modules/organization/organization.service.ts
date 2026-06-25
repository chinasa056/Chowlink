import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../common/database/prisma/prisma.service';

import { OrganizationRepository } from './organization.repository';

import {
  CreateDepartmentDto,
  CreateOrganizationDto,
} from './organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly organizationRepository:
      OrganizationRepository,
  ) {}

  async createOrganization(
    dto: CreateOrganizationDto,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const organization =
          await tx.organization.create({
            data: {
              name: dto.name,
              industry: dto.industry,
              orderingCutoffTime:
                dto.orderingCutoffTime,
            },
          });

        await tx.wallet.create({
          data: {
            organizationId:
              organization.id,

            balance: 0,
          },
        });

        return organization;
      },
    );
  }

  async createDepartment(
    organizationId: string,
    dto: CreateDepartmentDto,
  ) {
    const organization =
      await this.organizationRepository.findOrganizationById(
        organizationId,
      );

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return this.organizationRepository.createDepartment(
      {
        name: dto.name,
        organizationId,
      },
    );
  }

  async getOrganization(id: string) {
    const organization =
      await this.organizationRepository.findOrganizationById(
        id,
      );

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    return organization;
  }

  async getOrganizations() {
    return this.organizationRepository.getOrganizations();
  }
}