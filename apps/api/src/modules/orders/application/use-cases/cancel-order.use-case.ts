import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { OrderRepository } from '../../domain/interfaces/order.repository';
import { ChowdeckRelayClient } from '../../../../infrastructure/integrations/chowdeck/chowdeck.relay.client';
import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import { OrderCancelledEvent } from '../../../../common/events/order/order.event';

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly repository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly relayClient: ChowdeckRelayClient,
  ) {}

  async execute(orderId: string, reason: string): Promise<void> {
    /**
     * STEP 1 — Load the Order
     *
     * We retrieve the OrderEntity from the repository using the orderId.
     * This will check that the order exists in our database.
     */
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    /**
     * STEP 2 — Load the Delivery
     *
     * We need the associated Delivery record to retrieve its reference
     * and status. If no delivery exists, the order cannot be cancelled after dispatch.
     */
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery for order ${orderId} not found`);
    }

    /**
     * STEP 3 — Validate Inputs and Business Rules
     *
     * Validate that a cancellation reason was provided.
     * Validate that the delivery is not in a terminal or picked-up state:
     * - Status != DELIVERED
     * - Status != CANCELLED
     * - Status != IN_TRANSIT (corresponds to PICKED_UP in business terms)
     */
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Cancellation reason is required');
    }

    if (delivery.status === 'DELIVERED') {
      throw new BadRequestException('Cannot cancel a delivery that has already been delivered');
    }

    if (delivery.status === 'CANCELLED') {
      throw new BadRequestException('Delivery has already been cancelled');
    }

    if (delivery.status === 'IN_TRANSIT') {
      throw new BadRequestException('Cannot cancel a delivery that has already been picked up');
    }

    /**
     * STEP 4 — Call Chowdeck SDK
     *
     * Issue the cancellation request synchronously to the Chowdeck Relay API.
     * If the API call fails or rejects, an exception (e.g. ChowdeckApiException / ChowdeckError)
     * is thrown, and we do not mutate our database.
     */
    await this.relayClient.cancelDelivery(delivery.providerReference!, reason);

    /**
     * STEP 5 — Transition Domain State
     *
     * Update the local OrderEntity status to CANCELLED and update timestamps.
     * If this is not a valid state transition, the domain entity will throw an error.
     */
    order.cancel();

    /**
     * STEP 6 — Save Transaction and Outbox Event
     *
     * Persist the database status updates for both the Order and the Delivery,
     * and log the OrderCancelledEvent to the Outbox. This is executed inside
     * a single transaction inside the repository to guarantee consistency.
     */
    const event = new OrderCancelledEvent(orderId, reason);

    await this.repository.saveCancelTransaction(
      order,
      reason,
      {
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload: event.payload,
      },
    );
  }
}

// Next in sequence: apps/api/src/modules/orders/domain/entities/order.entities.ts and apps/api/src/modules/orders/infrastructure/persistence/prisma-order.repository.ts
