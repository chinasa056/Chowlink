import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import { OrderRepository } from '../../domain/interfaces/order.repository';
import { DomainEventPublisher } from '../../../../common/events/domain-event.publisher';
import { CatalogueService } from '../../../catalogue/catalogue.service';
import { OrdersAggregatedEvent } from '../../../../common/events/order/order.event';

@Injectable()
export class AggregateOrdersUseCase {
  constructor(
    /**
     * Repository used for querying Orders.
     *
     * Remember:
     *
     * Repository answers the question:
     *
     * "How do I fetch Orders?"
     *
     * It NEVER decides business rules.
     */
    private readonly repository: OrderRepository,

    /**
     * Prisma transaction coordinator.
     *
     * Aggregation touches multiple tables:
     *
     * - Order
     * - OrderBatch
     * - OutboxEvent
     *
     * Therefore everything must happen
     * inside one transaction.
     */
    private readonly prisma: PrismaService,

    /**
     * Responsible for recording
     * business events into the
     * Outbox table.
     */
    private readonly publisher: DomainEventPublisher,

    /**
     * Service to fetch catalogue information
     * without direct DB queries.
     */
    private readonly catalogueService: CatalogueService,
  ) {}

  /**
   * Executes the daily order aggregation.
   *
   * This use case will eventually be called
   * by BullMQ every day at 11:30 AM.
   */
  async execute(): Promise<void> {
    /**
     * STEP 1
     *
     * Retrieve every Order still waiting
     * to be aggregated.
     */
    const pendingOrders = await this.repository.findPendingOrders();

    /**
     * Nothing to aggregate.
     */
    if (!pendingOrders.length) {
      return;
    }

    /**
     * STEP 2
     *
     * Group Orders by Restaurant.
     *
     * Why?
     *
     * Every Restaurant receives exactly
     * one Delivery Batch.
     */
    const groupedOrders = new Map<string, typeof pendingOrders>();

    const menuItemIds = pendingOrders.map((o) => o.items[0].menuItemId);
    
    // De-duplicate IDs for efficiency
    const uniqueMenuItemIds = [...new Set(menuItemIds)];
    
    // Use the CatalogueService to avoid direct DB queries in the orchestration layer
    const menuItems = await this.catalogueService.findMenuItemsById(uniqueMenuItemIds);
    const menuRestaurantMap = new Map(
      menuItems.map((m) => [m.id, m.restaurantId]),
    );

    for (const order of pendingOrders) {
      /**
       * Every OrderItem belongs to
       * one MenuItem.
       *
       * Every MenuItem belongs to
       * one Restaurant.
       *
       * Since all items inside one Order
       * are assumed to belong to the same
       * Restaurant, we simply inspect the
       * first item.
       */
      const restaurantId = menuRestaurantMap.get(order.items[0].menuItemId)!;

      if (!groupedOrders.has(restaurantId)) {
        groupedOrders.set(restaurantId, []);
      }

      groupedOrders.get(restaurantId)!.push(order);
    }

    /**
     * STEP 3
     *
     * Process each Restaurant independently.
     */
    for (const [restaurantId, orders] of groupedOrders) {
      /**
       * Every Restaurant gets its own
       * database transaction.
       */
      await this.prisma.$transaction(async (tx) => {
        /**
         * STEP 4
         *
         * Create today's Delivery Batch.
         */
        const batch = await tx.orderBatch.create({
          data: {
            restaurantId,

            dispatchDate: new Date(),
          },
        });

        /**
         * We'll collect every Order ID
         * so the Domain Event can describe
         * exactly what happened.
         */
        const orderIds: string[] = [];

        /**
         * STEP 5
         *
         * Process every Order inside
         * this Restaurant.
         */
        for (const order of orders) {
          /**
           * Apply business rule.
           *
           * If this Order isn't PENDING,
           * the Domain Entity will throw.
           */
          order.aggregate();

          /**
           * Persist the updated status.
           */
          await this.repository.aggregateOrder(order, batch.id, tx);

          /**
           * Remember this Order.
           */
          orderIds.push(order.id!);
        }

        /**
         * STEP 6
         *
         * Record the business event.
         *
         * Notice:
         *
         * We are NOT writing directly
         * to the Outbox table.
         *
         * We simply describe what happened.
         */
        await this.publisher.publish(
          new OrdersAggregatedEvent(
            batch.id,
            restaurantId,
            batch.dispatchDate,
            orderIds,
          ),
          tx,
        );
      });
    }
  }
}
