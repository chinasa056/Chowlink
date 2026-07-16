import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../common/database/prisma/prisma.service';

import { OrderRepository } from '../../domain/interfaces/order.repository';

import { CatalogueService } from '../../../catalogue/catalogue.service';

import { WalletService } from '../../../wallets/wallet.service';
import { CreateOrderDto } from '../../presentation/dto/create-order.dto';
import { OrderItemEntity } from '../../domain/entities/order-item.entity';
import { OrderEntity } from '../../domain/entities/order.entities';
import { DomainEventPublisher } from '../../../../common/events/domain-event.publisher';
import { OrderCreatedEvent } from '../../../../common/events/order/order.event';

@Injectable()
export class PlaceOrderUseCase {
  constructor(
    /**
     * Repository responsible only
     * for persisting Orders.
     */
    private readonly orderRepository: OrderRepository,

    /**
     * Wallet business logic belongs
     * inside the Wallet module.
     */
    private readonly walletService: WalletService,

    /**
     * Catalogue business logic belongs
     * inside Catalogue.
     */
    private readonly catalogueService: CatalogueService,

    /**
     * We inject Prisma because this
     * use case coordinates one database
     * transaction across multiple tables.
     */
    private readonly prisma: PrismaService,

    private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(dto: CreateOrderDto, userId: string, organizationId: string) {
    /**
     * STEP 1
     *
     * Load every menu item the employee
     * selected.
     *
     * We do this before opening a database
     * transaction because this operation
     * is read-only.
     */
    const menuItems = await this.catalogueService.findMenuItemsById(
      dto.items.map((item) => item.menuItemId),
    );

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('One or more menu items do not exist.');
    }

    /**
     * STEP 2
     *
     * Construct Domain Entities.
     */

    const items = menuItems.map((menu) => {
      const dtoItem = dto.items.find((item) => item.menuItemId === menu.id)!;

      return new OrderItemEntity(menu.id, dtoItem.quantity, menu.price.toNumber());
    });

    const order = OrderEntity.create({
      userId,

      organizationId,

      items,

      notes: dto.notes,
    });

    /**
     * STEP 3
     *
     * Verify the organization can
     * actually afford this order.
     */
    await this.walletService.ensureSufficientBalance(
      organizationId,
      order.totalAmount,
    );

    /**
     * STEP 4
     *
     * Begin transaction.
     *
     * Every write operation below
     * must either succeed together
     * or fail together.
     */
    return this.prisma.$transaction(async (tx) => {
      /**
       * Create Order
       */
      const createdOrder = await tx.order.create({
        data: {
          organizationId: order.organizationId,

          userId: order.userId,

          notes: order.notes,

          totalAmount: order.totalAmount,

          status: order.status,
        },
      });

      /**
       * Create Order Items.
       *
       * Every item references
       * the Order we just created.
       */
      await tx.orderItem.createMany({
        data: order.items.map((item) => ({
          orderId: createdOrder.id,

          menuItemId: item.menuItemId,

          quantity: item.quantity,

          price: item.unitPrice,
        })),
      });

      /**
       * Create Outbox Event.
       *
       * Notice this happens INSIDE
       * the same transaction.
       *
       * This guarantees that if
       * Order exists,
       * Event exists.
       */
      // await tx.outboxEvent.create({
      //   data: {
      //     aggregateId: createdOrder.id,

      //     aggregateType: 'ORDER',

      //     eventType: 'ORDER_CREATED',

      //     payload: {
      //       orderId: createdOrder.id,
      //     },

      //     status: 'PENDING',
      //   },
      // });

      /**
       * Publish a business event.
       *
       * The publisher is responsible for
       * converting this event into an
       * Outbox record.
       *
       * The Use Case only describes
       * what happened.
       */

      const persistedOrder = OrderEntity.fromPersistence({
        id: createdOrder.id,
        userId: order.userId,
        organizationId: order.organizationId,
        status: order.status,
        items: order.items,
        notes: order.notes,
        aggregatedAt: order.aggregatedAt,
        dispatchedAt: order.dispatchedAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
      });

      await this.publisher.publish(new OrderCreatedEvent(persistedOrder), tx);
      //   order.id = createdOrder.id;

      //   await this.publisher.publish(new OrderCreatedEvent(order), tx);

      /**
       * Return a response model,
       * not the raw Prisma object.
       */
      return {
        orderId: createdOrder.id,

        status: createdOrder.status,

        totalAmount: Number(createdOrder.totalAmount),

        message: 'Order placed successfully.',
      };
    });
  }
}
