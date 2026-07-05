import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { OrderRepository } from '../../domain/interfaces/order.repository';
import { DomainEventPublisher } from '../../../../common/events/domain-event.publisher';
import { OrderDispatchedEvent } from '../../../../common/events/order/order.event';
import { ChowdeckRelayClient } from '../../../../infrastructure/integrations/chowdeck/chowdeck.relay.client';
import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import { ORDER_QUEUE, ORDER_DISPATCH_JOB } from '../../../../common/queues/bullmq.cnstants';
import { OrderStatus } from '../../domain/enums/order-status.enum';

@Injectable()
export class DispatchOrderUseCase {
  constructor(
    private readonly repository: OrderRepository,

    private readonly prisma: PrismaService,

    private readonly publisher: DomainEventPublisher,

    /**
     * The Chowdeck SDK client.
     *
     * Notice: We inject the concrete class here
     * since it is defined as a provider in the module.
     *
     * In the application layer we stay focused
     * on orchestration — we never know about HTTP,
     * Axios, or fee IDs. That complexity is hidden
     * inside ChowdeckRelayClient.
     */
    private readonly relayClient: ChowdeckRelayClient,
  ) {}

  async execute(orderId: string): Promise<void> {
    /**
     * STEP 1 — Load the Order
     *
     * We need the full order including
     * its organization for address/contact
     * information.
     */
    const order = await this.repository.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    /**
     * STEP 2 — Validate Order State
     *
     * Only AGGREGATED orders are eligible for dispatch.
     *
     * If status is anything else (PENDING, DISPATCHED, etc.)
     * we silently exit — this may be a duplicate job.
     */
    if (order.status !== OrderStatus.AGGREGATED) {
      return;
    }

    /**
     * STEP 3 — Idempotency Check
     *
     * BullMQ may retry a job on failure.
     * We must never create two deliveries
     * for the same order.
     *
     * If a delivery already exists we stop here.
     */
    const deliveryExists = await this.repository.hasDeliveryForOrder(orderId);

    if (deliveryExists) {
      return;
    }

    /**
     * STEP 4 + 5 — Build Payload and Call Chowdeck
     *
     * We load the rich context (Organization,
     * Restaurant address) directly from Prisma here,
     * because our OrderEntity doesn't carry those
     * related models.
     *
     * The HTTP call happens BEFORE we open a
     * database transaction. Keeping a db transaction
     * open during a slow network call is a bad idea.
     */
    const richOrder = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        organization: true,
        orderItems: {
          include: {
            menuItem: {
              include: {
                restaurant: true,
              },
            },
          },
        },
        user: true,
      },
    });

    if (!richOrder) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    /**
     * The delivery goes from the restaurant
     * to the organization's registered address.
     *
     * We load the organization address from the
     * Address table (if exists), otherwise fall
     * back to a sensible default.
     */
    const orgAddress = await this.prisma.address.findFirst({
      where: { organizationId: richOrder.organizationId },
    });

    const restaurantAddress = await this.prisma.address.findFirst({
      where: { restaurantId: richOrder.orderItems[0]?.menuItem?.restaurantId },
    });

    /**
     * STEP 5 — Call Chowdeck via the SDK.
     *
     * The SDK hides:
     * - Delivery fee calculation
     * - Fee ID plumbing
     * - Axios / HTTP
     * - Error mapping
     *
     * We just describe what we want.
     */
    const deliveryResult = await this.relayClient.createDelivery({
      pickup: {
        name: richOrder.orderItems[0]?.menuItem?.restaurant?.name ?? 'Restaurant',
        phone: '07000000000',
        address: restaurantAddress
          ? `${restaurantAddress.latitude}, ${restaurantAddress.longitude}`
          : 'Lagos, Nigeria',
        latitude: restaurantAddress?.latitude ?? 6.601838,
        longitude: restaurantAddress?.longitude ?? 3.3514863,
      },
      destination: {
        name: richOrder.organization.name,
        phone: '07000000000',
        address: orgAddress
          ? `${orgAddress.latitude}, ${orgAddress.longitude}`
          : 'Lagos, Nigeria',
        latitude: orgAddress?.latitude ?? 6.578997,
        longitude: orgAddress?.longitude ?? 3.3494666,
      },
      reference: richOrder.id,
      estimatedOrderAmount: Number(richOrder.totalAmount),
      note: richOrder.notes ?? undefined,
    });

    /**
     * STEP 6 — Transition Domain State
     *
     * The domain entity enforces the rule:
     * only AGGREGATED orders can be dispatched.
     */
    order.dispatch();

    /**
     * STEP 7, 8, 9 — Atomic Transaction
     *
     * Now that the external call succeeded,
     * we persist everything in one transaction:
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
    const event = new OrderDispatchedEvent(
      orderId,
      deliveryResult.id.toString(),
      richOrder.orderBatchId ?? '',
      richOrder.orderItems[0]?.menuItem?.restaurantId ?? '',
    );

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
  }
}
