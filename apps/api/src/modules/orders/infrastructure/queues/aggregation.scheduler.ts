import { Injectable, OnModuleInit } from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Queue } from 'bullmq';

import {
  ORDER_QUEUE,
  ORDER_AGGREGATION_JOB,
} from '../../../../common/queues/bullmq.cnstants';

@Injectable()
export class AggregationScheduler implements OnModuleInit {
  constructor(
    @InjectQueue(ORDER_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    
    // Every weekday 11:30 AM
    await this.queue.upsertJobScheduler(
      'daily-order-aggregation',
      {
        pattern: '0 30 11 * * 1-5',
      },
      {
        name: ORDER_AGGREGATION_JOB,
        data: {},
      },
    );
  }
}
