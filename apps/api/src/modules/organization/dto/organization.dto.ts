import { IsString } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  orderingCutoffTime: string;

  @IsString()
  industry: string;

  @IsString()
  phone: string;
}

export class CreateDepartmentDto {
  @IsString()
  name: string;
}