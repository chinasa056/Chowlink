import { Injectable } from '@nestjs/common';

import { DeliveryStatus, Order, OrderItem, OrderStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../common/database/prisma/prisma.service';

import { OrderRepository } from '../../domain/interfaces/order.repository';
import { OrderEntity } from '../../domain/entities/order.entities';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import { OrderDispatchDetails } from '../../domain/interfaces/order-dispatch-details';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  //  Converts a Domain Entity into Prisma data.
  private toPersistence(order: OrderEntity) {
    return {
      userId: order.userId,

      organizationId: order.organizationId,

      status: order.status,

      totalAmount: order.totalAmount,

      notes: order.notes,

      aggregatedAt: order.aggregatedAt,

      dispatchedAt: order.dispatchedAt,

      completedAt: order.completedAt,

      cancelledAt: order.cancelledAt,
    };
  }

  // Converts a Prisma model back into our Domain Entity.
  private toDomain(
    order: Order & {
      orderItems: OrderItem[];
    },
  ): OrderEntity {
    return OrderEntity.fromPersistence({
      id: order.id,

      userId: order.userId,

      organizationId: order.organizationId,

      status: order.status as any,

      notes: order.notes ?? undefined,

      aggregatedAt: order.aggregatedAt ?? undefined,

      dispatchedAt: order.dispatchedAt ?? undefined,

      completedAt: order.completedAt ?? undefined,

      cancelledAt: order.cancelledAt ?? undefined,

      items: order.orderItems.map(
        (item) =>
          new OrderItemEntity(
            item.menuItemId,
            item.quantity,
            item.price.toNumber(),
          ),
      ),
    });
  }

  async create(order: OrderEntity): Promise<OrderEntity> {
    const created = await this.prisma.order.create({
      data: this.toPersistence(order),
      include: {
        orderItems: true,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },

      include: {
        orderItems: true,
        delivery: true,

        organization: true,

        user: true,
      },
    });

    if (!order) {
      return null;
    }

    return this.toDomain(order);
  }

  // updates an existing order
  async save(order: OrderEntity): Promise<OrderEntity> {
    const updated = await this.prisma.order.update({
      where: {
        id: order.id!,
      },

      data: this.toPersistence(order),

      include: {
        orderItems: true,
      },
    });

    return this.toDomain(updated);
  }

  // Returns every Order waiting
  // needed by the Aggregation worker
  async findPendingOrders(): Promise<OrderEntity[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
      },

      include: {
          // orderItems: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    return orders.map(this.toDomain.bind(this));
  }

  // Returns Orders already grouped and waiting to be dispatched
  // needed by the Dispatch worker
  async findAggregatedOrders(): Promise<OrderEntity[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.AGGREGATED,
      },

      include: {
        orderItems: true,
      },
    });

    return orders.map(this.toDomain.bind(this));
  }

  // Creates every OrderItem belonging to an Order.
  async createOrderItems(items: Prisma.OrderItemCreateManyInput[]) {
    return this.prisma.orderItem.createMany({
      data: items,
    });
  }

    // Creates an Outbox Event.
  async createOutboxEvent(data: Prisma.OutboxEventCreateInput) {
    return this.prisma.outboxEvent.create({
      data,
    });
  }

  // Creates an Order Batch.
  async createBatch(data: { restaurantId: string; dispatchDate: Date }) {
    return this.prisma.orderBatch.create({
      data,
    });
  }

  // Assigns an Order to a Batch.
  async assignOrderToBatch(orderId: string, batchId: string) {
    await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        orderBatchId: batchId,
      },
    });
  }

  // Aggregates an Order.
  async aggregateOrder(order: OrderEntity, batchId: string): Promise<void> {
    await this.prisma.order.update({
      where: {
        id: order.id!,
      },

      data: {
        status: order.status,

        aggregatedAt: order.aggregatedAt,

        orderBatchId: batchId,
      },
    });
  }

  // Checks if an Order has a Delivery.
  async hasDeliveryForOrder(orderId: string): Promise<boolean> {
    const delivery = await this.prisma.delivery.findUnique({
      where: { orderId },
      select: { id: true },
    });
    return !!delivery;
  }

  // Saves the dispatch transaction.
  async saveDispatchTransaction(
    order: OrderEntity,
    deliveryData: {
      providerReference: string;
      providerDeliveryId: string;
      trackingUrl?: string;
      deliveryFee?: number;
      provider: 'CHOWDECK';
      status: DeliveryStatus
    },
    outboxEventData: {
      aggregateId: string;
      aggregateType: string;
      eventType: string;
      payload: any;
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Create Delivery
      await tx.delivery.create({
        data: {
          orderId: order.id!,
          ...deliveryData,
        },
      });

      // Update Order
      await tx.order.update({
        where: { id: order.id! },
        data: {
          status: order.status,
          dispatchedAt: order.dispatchedAt,
        },
      });

      // Insert Outbox Event
      await tx.outboxEvent.create({
        data: {
          ...outboxEventData,
        },
      });
    });
  }

  async findDispatchDetails(
  orderId: string,
): Promise<OrderDispatchDetails | null> {

  const order = await this.prisma.order.findUnique({
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
    },
  });

  if (!order) {
    return null;
  }

  const organizationAddress =
    await this.prisma.address.findFirst({
      where: {
        organizationId: order.organizationId,
      },
    });

  const restaurantId =
    order.orderItems[0]?.menuItem?.restaurantId;

  const restaurantAddress =
    await this.prisma.address.findFirst({
      where: {
        restaurantId,
      },
    });

  const restaurant =
    order.orderItems[0]?.menuItem?.restaurant;

  return {
    orderId: order.id,

    orderBatchId: order.orderBatchId,

    organization: {
      name: order.organization.name,
      phone: order.organization.phone,
    },

    restaurant: {
      id: restaurant?.id ?? '',
      name: restaurant?.name ?? '',
      phone: restaurant?.phone ?? '',
    },

    restaurantAddress: restaurantAddress
      ? {
          latitude: restaurantAddress.latitude,
          longitude: restaurantAddress.longitude,
        }
      : null,

    organizationAddress: organizationAddress
      ? {
          latitude: organizationAddress.latitude,
          longitude: organizationAddress.longitude,
        }
      : null,

    totalAmount: Number(order.totalAmount),

    notes: order.notes ?? undefined,
  };
}

  /**
   * Performs an atomic database transaction to update Order and Delivery to CANCELLED,
   * write the cancel reason and cancel timestamp, and log the OrderCancelledEvent to the Outbox.
   */
  async saveCancelTransaction(
    order: OrderEntity,
    cancelReason: string,
    outboxEventData: {
      aggregateId: string;
      aggregateType: string;
      eventType: string;
      payload: any;
    },
  ): Promise<void> {
    /**
     * STEP 1 — Begin database transaction.
     * All operations inside must either succeed together or roll back.
     */
    await this.prisma.$transaction(async (tx) => {
      /**
       * STEP 2 — Update Delivery status, cancelledAt, and cancelReason.
       */
      await tx.delivery.update({
        where: { orderId: order.id! },
        data: {
          status: DeliveryStatus.CANCELLED,
          cancelledAt: new Date(),
          cancelReason: cancelReason,
        },
      });

      /**
       * STEP 3 — Update Order status and cancelledAt.
       */
      await tx.order.update({
        where: { id: order.id! },
        data: {
          status: order.status,
          cancelledAt: order.cancelledAt,
        },
      });

      /**
       * STEP 4 — Log OrderCancelledEvent into the Outbox.
       */
      await tx.outboxEvent.create({
        data: {
          ...outboxEventData,
        },
      });
    });
  }
}

// Next in sequence: apps/api/src/common/queues/outbox.processor.ts
