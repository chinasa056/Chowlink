import { Processor, WorkerHost } from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { ORDER_QUEUE } from '../../../../common/queues/bullmq.cnstants';

import { AggregateOrdersUseCase } from '../../application/use-cases/aggregate-orders.use-case';

@Processor(ORDER_QUEUE)
export class AggregationProcessor extends WorkerHost {
  constructor(private readonly aggregateOrdersUseCase: AggregateOrdersUseCase) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'aggregate-orders') {
      return;
    }

    await this.aggregateOrdersUseCase.execute();
  }
}
