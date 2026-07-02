import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { ORDER_QUEUE } from '../../../../common/queues/bullmq.cnstants';

import { AggregateOrdersUseCase } from '../../application/use-cases/aggregate-orders.use-case';

/**
 * AggregationProcessor
 *
 * BullMQ calls this whenever an
 * aggregation job arrives.
 *
 * Unlike the Scheduler,
 * this class actually executes work.
 */
@Processor(ORDER_QUEUE)
export class AggregationProcessor extends WorkerHost {
  constructor(
    private readonly aggregateOrdersUseCase: AggregateOrdersUseCase,
  ) {
    super();
  }

  async process(job: Job) {
    /**
     * Ignore unrelated jobs.
     */
    if (job.name !== 'aggregate-orders') {
      return;
    }

    /**
     * Execute business logic.
     */
    await this.aggregateOrdersUseCase.execute();
  }
}