import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { DomainEvent } from './domain-event';
import { DomainEventPublisher } from './domain-event.publisher';

//  * Rather than immediately sending events to a queue,
//  * we persist them to the Outbox table.

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
