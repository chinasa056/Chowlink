import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';


export class CreateOrderDto {
  @IsOptional()
  @IsString()
  departmentId: string;

  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsString()
  @IsOptional()
  notes: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}