import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { OUTBOX_QUEUE, OUTBOX_POLL_JOB } from './bullmq.cnstants';

/**
 * OutboxScheduler
 *
 * Registers a BullMQ repeatable job that fires every 10 seconds.
 *
 * Its only job: tell BullMQ when to trigger the OutboxProcessor.
 *
 * It never reads the Outbox table.
 * It never queues dispatch jobs.
 * It never knows business events exist.
 *
 * WHEN something should happen lives here.
 * WHAT should happen lives in the OutboxProcessor.
 */
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
        /**
         * Poll every 10 seconds.
         *
         * In production this can be tuned to
         * a higher frequency (e.g. every 5s)
         * or a lower one during off-peak hours.
         */
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
