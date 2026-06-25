import { IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  orderingCutoffTime: string;

  @IsString()
  industry: string;
}

export class CreateDepartmentDto {
  @IsString()
  name: string;
}