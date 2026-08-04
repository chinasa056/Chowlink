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
  ) { }

  async execute(orderId: string, reason: string): Promise<void> {
    //Load the Order
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    //Load the Delivery
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery for order ${orderId} not found`);
    }

    // Validate Inputs and Business Rules
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

    //  Call Chowdeck SDK
    await this.relayClient.cancelDelivery(delivery.providerReference!, reason);

    // Transition Domain State
    order.cancel();

    // Save Transaction and Outbox Event in a transaction
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
