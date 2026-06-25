import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { OrganizationService } from './organization.service';

import {
  CreateDepartmentDto,
  CreateOrganizationDto,
} from './organization.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService:
      OrganizationService,
  ) {}

  @Post()
  createOrganization(
    @Body()
    dto: CreateOrganizationDto,
  ) {
    return this.organizationService.createOrganization(
      dto,
    );
  }

  @Post(':id/departments')
  createDepartment(
    @Param('id')
    organizationId: string,

    @Body()
    dto: CreateDepartmentDto,
  ) {
    return this.organizationService.createDepartment(
      organizationId,
      dto,
    );
  }

  @Get()
  getOrganizations() {
    return this.organizationService.getOrganizations();
  }

  @Get(':id')
  getOrganization(
    @Param('id')
    id: string,
  ) {
    return this.organizationService.getOrganization(
      id,
    );
  }
}