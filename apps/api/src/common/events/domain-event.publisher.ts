import { Prisma } from '@prisma/client';

import { DomainEvent } from './domain-event';

export abstract class DomainEventPublisher {
  abstract publish(
    event: DomainEvent,
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}
