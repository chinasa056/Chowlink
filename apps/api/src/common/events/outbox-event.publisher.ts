import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DomainEvent } from './domain-event';
import { DomainEventPublisher } from './domain-event.publisher';

/**
 * Concrete implementation of the DomainEventPublisher.
 *
 * Rather than immediately sending events to a queue,
 * we persist them to the Outbox table.
 *
 * A background worker will later read these events
 * and safely publish them.
 */
@Injectable()
export class OutboxEventPublisher
  implements DomainEventPublisher
{
  async publish(
    event: DomainEvent,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        aggregateId: event.aggregateId,

        aggregateType: event.aggregateType,

        eventType: event.eventType,

        payload: event.payload,

        status: 'PENDING',
      },
    });
  }
}


// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../database/prisma/prisma.service';
// import { DomainEvent } from './domain-event';
// import { DomainEventPublisher } from './domain-event.publisher';

// /**
//  * Infrastructure implementation
//  * of our DomainEventPublisher.
//  *
//  * Instead of immediately sending
//  * events to BullMQ,
//  * Kafka,
//  * or RabbitMQ,
//  *
//  * we persist them into the
//  * Outbox table.
//  *
//  * Another worker will later
//  * process them.
//  */
// @Injectable()
// export class OutboxEventPublisher
//   implements DomainEventPublisher
// {
//   constructor(
//     private readonly prisma: PrismaService,
//   ) {}

//   async publish(
//     event: DomainEvent,
//   ): Promise<void> {
//     await this.prisma.outboxEvent.create({
//       data: {
//         aggregateId: event.aggregateId,

//         aggregateType:
//           event.aggregateType,

//         eventType: event.eventType,

//         payload: event.payload,
//       },
//     });
//   }
// }