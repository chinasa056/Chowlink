import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { CreateOrderDto } from '../dto/create-order.dto';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { AggregateOrdersUseCase } from '../../application/use-cases/aggregate-orders.use-case';
import { DispatchOrderUseCase } from '../../application/use-cases/dispatch-order.use-case';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly agregateOrderUseCase: AggregateOrdersUseCase,
    private readonly dispatchOrderUseCase: DispatchOrderUseCase,
  ) {}

@Post('agregate')
async aggregeteOrder(){
  await this.agregateOrderUseCase.execute();
}

@Post('dispatch/:id')
async dispatchOrder(@Param('id') id: string){
  await this.dispatchOrderUseCase.execute(id);
}


  @Post(':userId/:organizationId')
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Param('userId') userId: string,
    @Param('organizationId') organizationId: string,
  ) {
    await this.placeOrderUseCase.execute(dto, userId, organizationId);
  }

  // @Post()

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    await this.cancelOrderUseCase.execute(id, dto.reason);
    
    return {
      success: true,
    };
  }
}

