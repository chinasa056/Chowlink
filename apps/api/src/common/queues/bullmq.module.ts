import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ORDER_QUEUE } from './bullmq.cnstants';

/**
 * Global BullMQ configuration.
 *
 * Every queue in the application shares
 * this Redis connection.
 */
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),

    /**
     * Register the Orders queue.
     */
    BullModule.registerQueue({
      name: ORDER_QUEUE,
    }),
  ],

  exports: [BullModule],
})
export class AppBullMQModule {}