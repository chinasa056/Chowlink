// 

import { Order, Prisma } from '@prisma/client';
import { OrderEntity } from '../entities/order.entities';

export interface OrderRepository {
  create(order: OrderEntity): Promise<OrderEntity>;

  save(order: OrderEntity): Promise<OrderEntity>;

  findById(id: string): Promise<OrderEntity | null>;

  findPendingOrders(): Promise<OrderEntity[]>;

  findAggregatedOrders(): Promise<OrderEntity[]>;

  /**
 * Returns every pending order
 * together with its items.
 */
// findPendingOrders(): Promise<Order[]>;

/**
 * Updates an existing order.
 */
// update(id: string, data: Partial<Order>): Promise<Order>;

/**
 * Creates a new Order Batch.
 */
createBatch(data: {restaurantId: string; dispatchDate: Date}): Promise<{id: string;}>;

/**
 * Assigns an Order to a Batch.
 */
assignOrderToBatch(orderId: string, batchId: string): Promise<void>;

aggregateOrder(order: OrderEntity, batchId: string, tx: Prisma.TransactionClient): Promise<void>;
}


// /**
//  * This interface represents everything
//  * the business layer expects from any
//  * Order repository.
//  *
//  * Notice that nothing here mentions:
//  *
//  * - Prisma
//  * - MySQL
//  * - MongoDB
//  *
//  * Tomorrow we could swap Prisma for
//  * another ORM without touching any
//  * use case.
//  */
// export interface OrderRepository {
//   /**
//    * Persist a newly created order.
//    */
//   create(data: Partial<Order>): Promise<Order>;

//   /**
//    * Find an order using its primary id.
//    */
//   findById(id: string): Promise<Order | null>;

//   /**
//    * Persist changes made to an order.
//    */
//   update(
//     id: string,
//     data: Partial<Order>,
//   ): Promise<Order>;

//   /**
//    * Find all orders currently waiting
//    * for aggregation.
//    */
//   findPendingOrders(): Promise<Order[]>;

//   /**
//    * Find all aggregated orders waiting
//    * to be dispatched.
//    */
//   findAggregatedOrders(): Promise<Order[]>;
// }