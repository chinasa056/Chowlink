import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

import { PrismaService } from '../database/prisma/prisma.service';
import {
  OUTBOX_QUEUE,
  ORDER_QUEUE,
  ORDER_DISPATCH_JOB,
  OUTBOX_POLL_JOB,
} from './bullmq.cnstants';

/**
 * OutboxProcessor
 *
 * This is the event router of the system.
 *
 * Its only responsibility:
 *
 * Read PENDING events from the Outbox table
 * and translate them into BullMQ jobs.
 *
 * It does NOT:
 *
 * - Aggregate orders
 * - Dispatch deliveries
 * - Send notifications
 * - Call Chowdeck
 *
 * It simply asks:
 *
 * "Because this event happened... what jobs should exist?"
 *
 * This design means adding a new downstream action
 * (e.g. Slack notification) requires only adding a
 * new case here — without touching any Use Case.
 */
@Processor(OUTBOX_QUEUE)
export class OutboxProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxProcessor.name);

  constructor(
    private readonly prisma: PrismaService,

    /**
     * Inject the Orders queue so we can
     * create dispatch jobs.
     */
    @InjectQueue(ORDER_QUEUE)
    private readonly orderQueue: Queue,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== OUTBOX_POLL_JOB) {
      return;
    }

    await this.processOutboxEvents();
  }

  private async processOutboxEvents(): Promise<void> {
    /**
     * Fetch a batch of PENDING outbox events.
     * Process in small chunks to avoid overwhelming
     * the system on startup.
     */
    const events = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (!events.length) {
      return;
    }

    for (const event of events) {
      try {
        /**
         * Mark as PROCESSING to prevent
         * other workers picking it up concurrently.
         */
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'PROCESSING' },
        });

        /**
         * Route the event to the appropriate job(s).
         *
         * This switch statement is the heart of the router.
         *
         * Each event type maps to one or more BullMQ jobs.
         */
        await this.routeEvent(event);

        /**
         * Mark as SENT after successful routing.
         */
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: 'SENT',
            processedAt: new Date(),
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to process outbox event ${event.id} (${event.eventType})`,
          error,
        );

        /**
         * Mark as FAILED so it can be inspected.
         * A separate remediation job could
         * reset FAILED events to PENDING for retry.
         */
        await this.prisma.outboxEvent.update({
          where: { id: event.id },
          data: { status: 'FAILED' },
        });
      }
    }
  }

  private async routeEvent(event: {
    id: string;
    eventType: string;
    payload: any;
  }): Promise<void> {
    switch (event.eventType) {
      /**
       * OrderCreatedEvent
       *
       * Currently no immediate downstream job needed.
       * Could later trigger a confirmation email job.
       */
      case 'ORDER_CREATED':
        this.logger.log(
          `[Outbox] ORDER_CREATED for order ${event.payload?.orderId} — no downstream jobs configured yet`,
        );
        break;

      /**
       * OrdersAggregatedEvent
       *
       * An order batch has been formed.
       * Queue a dispatch job for each individual order.
       *
       * Why per-order (not per-batch)?
       *
       * Each Chowdeck delivery maps to one Order.
       * Dispatching individually allows partial failure
       * handling — if one delivery fails, the others proceed.
       */
      case 'ORDERS_AGGREGATED': {
        const orderIds: string[] = event.payload?.orderIds ?? [];

        this.logger.log(
          `[Outbox] ORDERS_AGGREGATED — queuing ${orderIds.length} dispatch jobs`,
        );

        for (const orderId of orderIds) {
          await this.orderQueue.add(
            ORDER_DISPATCH_JOB,
            { orderId },
            {
              attempts: 3,
              backoff: {
                type: 'exponential',
                delay: 5000,
              },
              removeOnComplete: true,
              removeOnFail: false,
            },
          );
        }
        break;
      }

      /**
       * OrderDispatchedEvent
       *
       * A delivery has been created in Chowdeck.
       * Future jobs: Notification, Analytics, Wallet debit.
       */
      case 'ORDER_DISPATCHED':
        this.logger.log(
          `[Outbox] ORDER_DISPATCHED for order ${event.payload?.orderId} — notification jobs not yet implemented`,
        );
        break;

      /**
       * OrderCompletedEvent
       *
       * Chowdeck confirmed delivery.
       * Future jobs: Receipt generation, Wallet final settlement.
       */
      case 'ORDER_COMPLETED':
        this.logger.log(
          `[Outbox] ORDER_COMPLETED for order ${event.payload?.orderId} — receipt jobs not yet implemented`,
        );
        break;

      /**
       * OrderCancelledEvent
       *
       * The order cancellation has been successfully persisted.
       * Future jobs: Refund wallet, send cancellation email, notify admins.
       */
      case 'ORDER_CANCELLED':
        this.logger.log(
          `[Outbox] ORDER_CANCELLED for order ${event.payload?.orderId} — notification and refund jobs not yet implemented`,
        );
        break;

      default:
        this.logger.warn(
          `[Outbox] Unknown event type: ${event.eventType} — no routing configured`,
        );
    }
  }
}

// End of order cancellation sequence.

