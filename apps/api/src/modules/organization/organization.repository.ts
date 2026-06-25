import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma/prisma.service';

@Injectable()
export class OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createOrganization(data: {
    name: string;
    industry: string;
    orderingCutoffTime: string;
  }) {
    return this.prisma.organization.create({
      data,
    });
  }

  async createDepartment(data: {
    name: string;
    organizationId: string;
  }) {
    return this.prisma.department.create({
      data,
    });
  }

  async findOrganizationById(id: string) {
    return this.prisma.organization.findUnique({
      where: { id },

      include: {
        departments: true,
        users: true,
        wallet: true,
      },
    });
  }

  async getOrganizations() {
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}