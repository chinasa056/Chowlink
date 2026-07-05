import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { ORDER_QUEUE, ORDER_DISPATCH_JOB } from '../../../../common/queues/bullmq.cnstants';
import { DispatchOrderUseCase } from '../../application/use-cases/dispatch-order.use-case';

/**
 * DispatchProcessor
 *
 * This processor has exactly one responsibility:
 *
 * Receive a dispatch job from BullMQ
 * and delegate execution to DispatchOrderUseCase.
 *
 * Notice what this class does NOT contain:
 *
 * - No Prisma
 * - No Chowdeck calls
 * - No business rules
 * - No order loading
 *
 * It is a transport adapter.
 *
 * BullMQ → UseCase.
 *
 * Nothing more.
 */
@Processor(ORDER_QUEUE)
export class DispatchProcessor extends WorkerHost {
  constructor(
    private readonly dispatchOrderUseCase: DispatchOrderUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    /**
     * Ignore unrelated jobs that share the same queue.
     * (e.g. aggregate-orders)
     */
    if (job.name !== ORDER_DISPATCH_JOB) {
      return;
    }

    const { orderId } = job.data;

    /**
     * All business logic lives inside the use case.
     * This processor is intentionally this small.
     */
    await this.dispatchOrderUseCase.execute(orderId);
  }
}
