import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ORDER_QUEUE, OUTBOX_QUEUE } from './bullmq.cnstants';
import { OutboxScheduler } from './outbox.scheduler';
import { OutboxProcessor } from './outbox.processor';

/**
 * AppBullMQModule
 *
 * Global BullMQ configuration.
 *
 * Every queue in the application shares this Redis connection.
 *
 * The Outbox Processor and Scheduler also live here because
 * the Outbox is a cross-cutting infrastructure concern —
 * it doesn't belong to any single feature module.
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),

    BullModule.registerQueue(
      { name: ORDER_QUEUE },
      { name: OUTBOX_QUEUE },
    ),
  ],

  providers: [
    OutboxScheduler,
    OutboxProcessor,
  ],

  exports: [BullModule],
})
export class AppBullMQModule {}