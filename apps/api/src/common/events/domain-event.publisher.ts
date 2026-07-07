import { Prisma } from '@prisma/client';

import { DomainEvent } from './domain-event';

/**
 * Contract for publishing domain events.
 *
 * The application layer knows only this interface.
 *
 * It has no knowledge of:
 *
 * - Outbox tables
 * - Kafka
 * - RabbitMQ
 * - BullMQ
 *
 * Any implementation that satisfies this contract
 * can be swapped in without changing business logic.
 */
export abstract class DomainEventPublisher {
  /**
   * Publish a domain event.
   *
   * The transaction client is passed in so the event
   * can be written to the Outbox table inside the
   * same database transaction as the business data.
   */
  abstract publish(
    event: DomainEvent,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}


// import { DomainEvent } from './domain-event';

// /**
//  * Contract implemented by
//  * any event publishing mechanism.
//  *
//  * The Application Layer
//  * depends ONLY on this interface.
//  */
// export abstract class DomainEventPublisher {
//   abstract publish(
//     event: DomainEvent,
//   ): Promise<void>;
// }