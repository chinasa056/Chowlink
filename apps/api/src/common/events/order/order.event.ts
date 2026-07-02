import { OrderEntity } from '../../../modules/orders/domain/entities/order.entities';
import { DomainEvent } from '../domain-event';


/**
 * Published whenever a brand new order
 * has been created.
 */
export class OrderCreatedEvent implements DomainEvent {
  aggregateId: string;

  aggregateType = 'ORDER';

  eventType = 'ORDER_CREATED';

  occurredAt = new Date();

  version = 1;

  payload: Record<string, any>;

  constructor(order: OrderEntity) {
    this.aggregateId = order.id!;

    this.payload = {
      orderId: order.id,
      organizationId: order.organizationId,
      totalAmount: order.totalAmount,
      createdAt: this.occurredAt,
    };
  }
}

/**
 * Published after pending orders have
 * been grouped into a delivery batch.
 */
export class OrdersAggregatedEvent implements DomainEvent {
  aggregateId: string;

  aggregateType = 'ORDER_BATCH';

  eventType = 'ORDERS_AGGREGATED';

  occurredAt = new Date();

  version = 1;

  payload: Record<string, any>;

  constructor(
    batchId: string,
    restaurantId: string,
    dispatchDate: Date,
    orderIds: string[],
  ) {
    this.aggregateId = batchId;

    this.payload = {
      batchId,
      restaurantId,
      dispatchDate,
      orderIds,
    };
  }
}

/**
 * Published after a delivery has been
 * created with Chowdeck Relay.
 */
export class OrderDispatchedEvent
  implements DomainEvent
{
  aggregateId: string;

  aggregateType = 'ORDER';

  eventType = 'ORDER_DISPATCHED';

  occurredAt = new Date();

  version = 1;

  payload: Record<string, any>;

  constructor(
    orderId: string,
    deliveryId: string,
    batchId: string,
    restaurantId: string,
  ) {
    this.aggregateId = orderId;

    this.payload = {
      orderId,
      deliveryId,
      batchId,
      restaurantId,
    };
  }
}

/**
 * Published after Chowdeck notifies
 * us that delivery completed.
 */
export class OrderCompletedEvent
  implements DomainEvent
{
  aggregateId: string;

  aggregateType = 'ORDER';

  eventType = 'ORDER_COMPLETED';

  occurredAt = new Date();

  version = 1;

  payload: Record<string, any>;

  constructor(
    orderId: string,
    deliveryId: string,
    deliveryDuration: number,
  ) {
    this.aggregateId = orderId;

    this.payload = {
      orderId,
      deliveryId,
      completedAt: this.occurredAt,
      deliveryDuration,
    };
  }
}