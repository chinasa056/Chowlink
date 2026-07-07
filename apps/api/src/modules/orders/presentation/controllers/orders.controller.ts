import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CancelOrderUseCase } from '../../application/use-cases/cancel-order.use-case';
import { CancelOrderDto } from '../dto/cancel-order.dto';

/**
 * OrdersController
 *
 * REST Controller mapping HTTP requests to order-related business use cases.
 */
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  /**
   * POST /orders/:id/cancel
   *
   * Endpoint to cancel an aggregated order after it has been dispatched.
   * Calls the CancelOrderUseCase to process validations, sync with Chowdeck, and commit database updates.
   *
   * @param id - The unique identifier of the order to cancel.
   * @param dto - Request payload containing the cancellation reason.
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    /**
     * Delegate the execution to the CancelOrderUseCase.
     * UseCase handles all domain validation, external client communication, and database updates.
     */
    await this.cancelOrderUseCase.execute(id, dto.reason);

    /**
     * Return success confirmation as requested.
     */
    return {
      success: true,
    };
  }
}

// Next in sequence: apps/api/src/modules/orders/application/use-cases/cancel-order.use-case.ts
