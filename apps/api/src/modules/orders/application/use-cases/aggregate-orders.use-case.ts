import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/database/prisma/prisma.service';
import { OrderRepository } from '../../domain/interfaces/order.repository';
import { DomainEventPublisher } from '../../../../common/events/domain-event.publisher';
import { CatalogueService } from '../../../catalogue/catalogue.service';
import { OrdersAggregatedEvent } from '../../../../common/events/order/order.event';

@Injectable()
export class AggregateOrdersUseCase {
  constructor(
    private readonly repository: OrderRepository,
    private readonly prisma: PrismaService,
    private readonly publisher: DomainEventPublisher,
    private readonly catalogueService: CatalogueService,
  ) {}

  async execute(): Promise<void> {
    // Retrieve every Order still waiting to be aggregated.
    const pendingOrders = await this.repository.findPendingOrders();
    if (!pendingOrders.length) {
      return;
    }

    // Group Orders by Restaurant.
    const groupedOrders = new Map<string, typeof pendingOrders>();

    const menuItemIds = pendingOrders.map((o) => o.items[0].menuItemId);

    // De-duplicate IDs for efficiency
    const uniqueMenuItemIds = [...new Set(menuItemIds)];

    const menuItems =
      await this.catalogueService.findMenuItemsById(uniqueMenuItemIds);

    const menuRestaurantMap = new Map(
      menuItems.map((m) => [m.id, m.restaurantId]),
    );

    for (const order of pendingOrders) {
      const restaurantId = menuRestaurantMap.get(order.items[0].menuItemId)!;

      if (!groupedOrders.has(restaurantId)) {
        groupedOrders.set(restaurantId, []);
      }

      groupedOrders.get(restaurantId)!.push(order);
    }

    // Process each Restaurant independently.
    for (const [restaurantId, orders] of groupedOrders) {
      // Every Restaurant gets its own database transaction.
      await this.prisma.$transaction(async (tx) => {
        // Create today's Delivery Batch.
        const batch = await tx.orderBatch.create({
          data: {
            restaurantId,

            dispatchDate: new Date(),
          },
        });

        //  collect every Order ID
        const orderIds: string[] = [];

        //  * Process every Order inside this Restaurant.
        for (const order of orders) {
          // Apply business rule. If this Order isn't PENDING, the Domain Entity will throw.
          order.aggregate();

          // Persist the updated status.
          await this.repository.aggregateOrder(order, batch.id);

          // Remember this Order.
          orderIds.push(order.id!);
        }

        // Record the business event.
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
