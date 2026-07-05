import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { ORDER_QUEUE } from '../../common/queues/bullmq.cnstants';
import { AggregateOrdersUseCase } from './application/use-cases/aggregate-orders.use-case';
import { DispatchOrderUseCase } from './application/use-cases/dispatch-order.use-case';
import { AggregationScheduler } from './infrastructure/queues/aggregation.scheduler';
import { AggregationProcessor } from './infrastructure/queues/aggregation.processor';
import { DispatchProcessor } from './infrastructure/queues/dispatch.processor';
import { ChowdeckRelayClient } from '../../infrastructure/integrations/chowdeck/chowdeck.relay.client';

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE,
    }),
  ],

  providers: [
    /**
     * Use Cases
     */
    AggregateOrdersUseCase,

    DispatchOrderUseCase,

    /**
     * Queue Scheduler (registers repeatable jobs)
     */
    AggregationScheduler,

    /**
     * Queue Processors (execute use cases when jobs fire)
     */
    AggregationProcessor,

    DispatchProcessor,

    /**
     * Chowdeck Relay SDK client.
     *
     * Injected into DispatchOrderUseCase.
     * The API key is read from environment variables.
     */
    {
      provide: ChowdeckRelayClient,
      useFactory: () => {
        const apiKey = process.env.CHOWDECK_API_KEY;
        if (!apiKey) {
          throw new Error('CHOWDECK_API_KEY environment variable is not set');
        }
        return new ChowdeckRelayClient(apiKey);
      },
    },
  ],
})
export class OrdersModule {}