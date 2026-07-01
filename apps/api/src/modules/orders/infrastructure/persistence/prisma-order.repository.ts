import { Injectable } from '@nestjs/common';

import {
  Order,
  OrderItem,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../common/database/prisma/prisma.service';

import { OrderRepository } from '../../domain/interfaces/order.repository';
import { OrderEntity } from '../../domain/entities/order.entities';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';

/**
 * PrismaOrderRepository
 *
 * This class is the Infrastructure implementation
 * of the OrderRepository interface.
 *
 * Think of the interface as the "what"
 * and this class as the "how".
 *
 * The business layer says:
 *
 * "I need someone capable of saving Orders."
 *
 * Prisma answers:
 *
 * "I'll do it using MySQL."
 *
 * Tomorrow this class could be replaced
 * by a Mongo repository without changing
 * a single line inside the Use Cases.
 */
@Injectable()
export class PrismaOrderRepository
  implements OrderRepository
{
  constructor(
    /**
     * PrismaService is our gateway
     * into the database.
     *
     * This repository is one of the
     * few places in the application
     * allowed to know Prisma exists.
     */
    private readonly prisma: PrismaService,
  ) {}

  /**
 * Converts a Domain Entity into
 * Prisma data.
 */
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

/**
 * Converts a Prisma model back into
 * our Domain Entity.
 */
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
          item.price,
        ),
    ),
  });
}
  /**
   * Creates a brand new Order.
   *
   * Notice that this method simply
   * persists data.
   *
   * It DOES NOT:
   *
   * - validate wallets
   * - aggregate orders
   * - call Chowdeck
   * - publish queues
   *
   * Those belong elsewhere.
   */
async create(order: OrderEntity): Promise<OrderEntity> {
  const created = await this.prisma.order.create({
    data: this.toPersistence(order),
    include: {
      orderItems: true,
    },
  });

  return this.toDomain(created);
}

  /**
   * Retrieves an Order using
   * its unique identifier.
   */
async findById(
  id: string,
): Promise<OrderEntity | null> {
  const order = await this.prisma.order.findUnique({
    where: { id },

    include: {
      orderItems: true,
    },
  });

  if (!order) {
    return null;
  }

  return this.toDomain(order);
}

  /**
   * Updates an existing Order.
   *
   * The repository doesn't care WHY
   * the order is changing.
   *
   * It simply persists the changes.
   */
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

  /**
   * Returns every Order waiting
   * for aggregation.
   *
   * The Aggregation BullMQ Worker
   * will use this method every day
   * at 11:30 AM.
   */
async findPendingOrders(): Promise<OrderEntity[]> {
  const orders = await this.prisma.order.findMany({
    where: {
      status: 'PENDING',
    },

    include: {
      orderItems: true,
    },
  });

  return orders.map(this.toDomain.bind(this));
}

  /**
   * Returns Orders already grouped
   * and waiting to be dispatched
   * through Chowdeck Relay.
   *
   * The Dispatch Worker will call
   * this method after aggregation
   * completes.
   */
 async findAggregatedOrders(): Promise<OrderEntity[]> {
  const orders = await this.prisma.order.findMany({
    where: {
      status: 'AGGREGATED',
    },

    include: {
      orderItems: true,
    },
  });

  return orders.map(this.toDomain.bind(this));
}

  /**
   * Creates every OrderItem belonging
   * to an Order.
   *
   * Why a separate method?
   *
   * Because during PlaceOrder we
   * create:
   *
   * Order
   *
   * ↓
   *
   * Order Items
   *
   * inside one transaction.
   */
  async createOrderItems(
    items: Prisma.OrderItemCreateManyInput[],
  ) {
    return this.prisma.orderItem.createMany({
      data: items,
    });
  }

  /**
   * Creates an Outbox Event.
   *
   * Notice something interesting.
   *
   * The Outbox table lives outside
   * the Orders module conceptually,
   * but creating the event happens
   * inside the same database transaction
   * as Order creation.
   *
   * That guarantees consistency.
   */
  async createOutboxEvent(
    data: Prisma.OutboxEventCreateInput,
  ) {
    return this.prisma.outboxEvent.create({
      data,
    });
  }
}