import { IsNotEmpty, IsString } from 'class-validator';

/**
 * CancelOrderDto
 *
 * Payload structure for order cancellation requests.
 * Validates that a reason is supplied as a non-empty string.
 */
export class CancelOrderDto {
  @IsNotEmpty({ message: 'Cancellation reason is required' })
  @IsString({ message: 'Cancellation reason must be a string' })
  reason: string;
}

// Next in sequence: apps/api/src/modules/orders/presentation/controllers/orders.controller.ts
