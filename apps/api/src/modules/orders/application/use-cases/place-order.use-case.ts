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
    private readonly orderRepository: OrderRepository,
    private readonly walletService: WalletService,
    private readonly catalogueService: CatalogueService,
    private readonly prisma: PrismaService,

    private readonly publisher: DomainEventPublisher,
  ) {}

  async execute(dto: CreateOrderDto, userId: string, organizationId: string) {
    //Load every menu item the employee selected.
    const menuItems = await this.catalogueService.findMenuItemsById(
      dto.items.map((item) => item.menuItemId),
    );

    if (menuItems.length !== dto.items.length) {
      throw new BadRequestException('One or more menu items do not exist.');
    }

    // Construct Domain Entities.
    const items = menuItems.map((menu) => {
      const dtoItem = dto.items.find((item) => item.menuItemId === menu.id)!;

      return new OrderItemEntity(
        menu.id,
        dtoItem.quantity,
        menu.price.toNumber(),
      );
    });

    const order = OrderEntity.create({
      userId,
      organizationId,
      items,
      notes: dto.notes,
    });

    //Verify the organization can actually afford this order.
    await this.walletService.ensureSufficientBalance(
      organizationId,
      order.totalAmount,
    );

    // Begin transaction.
    return this.prisma.$transaction(async (tx) => {
      //  * Create Order
      const createdOrder = await tx.order.create({
        data: {
          organizationId: order.organizationId,
          userId: order.userId,
          notes: order.notes,
          totalAmount: order.totalAmount,
          status: order.status,
        },
      });

      // Create Order Items.Every item references the Order we just created.
      await tx.orderItem.createMany({
        data: order.items.map((item) => ({
          orderId: createdOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
      });

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

      return {
        orderId: createdOrder.id,

        status: createdOrder.status,

        totalAmount: Number(createdOrder.totalAmount),

        message: 'Order placed successfully.',
      };
    });
  }
}
