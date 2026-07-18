import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { OUTBOX_QUEUE, OUTBOX_POLL_JOB } from './bullmq.cnstants';

// Registers a BullMQ repeatable job that fires every 10 seconds.
// tells BullMQ when to trigger the OutboxProcessor.

@Injectable()
export class OutboxScheduler implements OnModuleInit {
  private readonly logger = new Logger(OutboxScheduler.name);

  constructor(
    @InjectQueue(OUTBOX_QUEUE)
    private readonly outboxQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.outboxQueue.upsertJobScheduler(
      'outbox-polling',
      {
        every: 10_000,
      },
      {
        name: OUTBOX_POLL_JOB,
        data: {},
      },
    );

    this.logger.log('Outbox polling job registered (every 10 seconds)');
  }
}
