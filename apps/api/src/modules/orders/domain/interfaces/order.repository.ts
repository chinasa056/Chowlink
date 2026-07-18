import { OrderEntity } from '../entities/order.entities';
import { OrderDispatchDetails } from './order-dispatch-details';

export abstract class OrderRepository {
  abstract create(order: OrderEntity): Promise<OrderEntity>;

  abstract save(order: OrderEntity): Promise<OrderEntity>;

  abstract findById(id: string): Promise<OrderEntity | null>;

  abstract findPendingOrders(): Promise<OrderEntity[]>;

  abstract findAggregatedOrders(): Promise<OrderEntity[]>;

  //Creates a new Order Batch.
  abstract createBatch(data: {
    restaurantId: string;
    dispatchDate: Date;
  }): Promise<{ id: string }>;

  //Assigns an Order to a Batch.
  abstract assignOrderToBatch(orderId: string, batchId: string): Promise<void>;

  abstract aggregateOrder(
    order: OrderEntity,
    batchId: string
  ): Promise<void>;

  abstract hasDeliveryForOrder(orderId: string): Promise<boolean>;

    abstract findDispatchDetails(
    orderId: string,
  ): Promise<OrderDispatchDetails | null>;

  abstract saveDispatchTransaction(
    order: OrderEntity,
    deliveryData: {
      providerReference: string;
      providerDeliveryId: string;
      trackingUrl?: string;
      deliveryFee?: number;
      provider: 'CHOWDECK';
      status:
        | 'PENDING'
        | 'DISPATCHED'
        | 'IN_TRANSIT'
        | 'DELIVERED'
        | 'FAILED'
        | 'CANCELLED';
    },
    outboxEventData: {
      aggregateId: string;
      aggregateType: string;
      eventType: string;
      payload: any;
    },
  ): Promise<void>;

  /**
   * Atomic Transaction for cancelling an Order.
   *
   * Persists the Order status as CANCELLED, the Delivery status as CANCELLED,
   * stores the cancellation reason and timestamp, and writes an OutboxEvent.
   *
   * @param order - The Order domain entity in its cancelled state.
   * @param cancelReason - The reason for cancelling the delivery.
   * @param outboxEventData - Payload for creating the outbox event.
   */
  abstract saveCancelTransaction(
    order: OrderEntity,
    cancelReason: string,
    outboxEventData: {
      aggregateId: string;
      aggregateType: string;
      eventType: string;
      payload: any;
    },
  ): Promise<void>;
}
