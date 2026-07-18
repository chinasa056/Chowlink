import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../../domain/interfaces/order.repository';
import { DomainEventPublisher } from '../../../../common/events/domain-event.publisher';
import { OrderDispatchedEvent } from '../../../../common/events/order/order.event';
import { ChowdeckRelayClient } from '../../../../infrastructure/integrations/chowdeck/chowdeck.relay.client';
import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import {
  ORDER_QUEUE,
  ORDER_DISPATCH_JOB,
} from '../../../../common/queues/bullmq.cnstants';
import { OrderStatus } from '../../domain/enums/order-status.enum';

@Injectable()
export class DispatchOrderUseCase {
  constructor(
    private readonly repository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly publisher: DomainEventPublisher,
    private readonly relayClient: ChowdeckRelayClient,
  ) {}

  async execute(orderId: string): Promise<void> {
    // Load the Order
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    //  Validate Order State
    if (order.status !== OrderStatus.AGGREGATED) {
      return;
    }

    //  Idempotency Check should BullMQ retry a job
    const deliveryExists = await this.repository.hasDeliveryForOrder(orderId);

    if (deliveryExists) {
      return;
    }

    // Build Payload and Call Chowdeck
    const dispatchDetails = await this.repository.findDispatchDetails(orderId);

    if (!dispatchDetails) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    //  Call Chowdeck via the SDK.
    const deliveryResult = await this.relayClient.createDelivery({
      pickup: {
        name: dispatchDetails.restaurant.name,

        phone: dispatchDetails.restaurant.phone,

        address: dispatchDetails.restaurantAddress
          ? `${dispatchDetails.restaurantAddress.latitude}, ${dispatchDetails.restaurantAddress.longitude}`
          : 'Lagos, Nigeria',

        latitude: dispatchDetails.restaurantAddress?.latitude ?? 6.601838,

        longitude: dispatchDetails.restaurantAddress?.longitude ?? 3.3514863,
      },

      destination: {
        name: dispatchDetails.organization.name,

        phone: dispatchDetails.organization.phone,

        address: dispatchDetails.organizationAddress
          ? `${dispatchDetails.organizationAddress.latitude}, ${dispatchDetails.organizationAddress.longitude}`
          : 'Lagos, Nigeria',

        latitude: dispatchDetails.organizationAddress?.latitude ?? 6.578997,

        longitude: dispatchDetails.organizationAddress?.longitude ?? 3.3494666,
      },

      estimatedOrderAmount: dispatchDetails.totalAmount,

      note: dispatchDetails.notes,
    });

    // Transition Domain State
    order.dispatch();

    /**
     * STEP 7, 8, 9 — Atomic Transaction

     *
     * 1. Create Delivery record
     * 2. Update Order status to DISPATCHED
     * 3. Insert OrderDispatchedEvent into Outbox
     *
     * If any step fails, they all roll back.
     * Chowdeck already has the delivery — but
     * our idempotency check (step 3) will catch
     * retries before reaching Chowdeck again.
     */

    await this.prisma.$transaction(async (tx) => {
      const event = new OrderDispatchedEvent(
        orderId,
        deliveryResult.id.toString(),
        dispatchDetails.orderBatchId ?? '',
        dispatchDetails.restaurant.id ?? '',
      );

      await this.publisher.publish(event, tx);
      await this.repository.saveDispatchTransaction(
        order,
        {
          providerReference: deliveryResult.reference,
          providerDeliveryId: deliveryResult.id.toString(),
          trackingUrl: deliveryResult.trackingUrl,
          deliveryFee: deliveryResult.deliveryFee,
          provider: 'CHOWDECK',
          status: 'DISPATCHED',
        },
        {
          aggregateId: event.aggregateId,
          aggregateType: event.aggregateType,
          eventType: event.eventType,
          payload: event.payload,
        },
      );
    });
  }
}
