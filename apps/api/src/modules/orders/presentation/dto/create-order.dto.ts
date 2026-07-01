import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsString, Min, ValidateNested } from 'class-validator';


export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  departmentId: string;

  @IsNotEmpty()
  @IsString()
  restaurantId: string;

  @IsString()
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