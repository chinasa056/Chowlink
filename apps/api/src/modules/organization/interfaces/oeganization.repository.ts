import { Department, Organization } from "@prisma/client";

export abstract class OrganizationRepository {
  abstract createOrganization(data: {
    name: string;
    industry: string;
    orderingCutoffTime: string;
  }): Promise<Organization>;

  abstract createDepartment(data: {
    name: string;
    organizationId: string;
  }): Promise<Department>;

  abstract findOrganizationById(id: string): Promise<Organization | null>;

  abstract getOrganizations(): Promise<Organization[]>;
}
