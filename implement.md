# Dispatch and Outbox Implementation Plan

This plan outlines the architecture for the asynchronous components: `DispatchOrderUseCase`, `dispatch.processor.ts`, and `outbox.worker.ts` (or `outbox.processor.ts`). It follows the exact flow and responsibilities you detailed.

## Proposed Changes

### 1. Outbox Worker (`outbox.worker.ts`)
- **Location**: Probably in `src/modules/outbox/infrastructure/workers/` or a dedicated module. (I will check existing folder structure). 
- **Responsibility**: A background process (via `setInterval` or Cron) that reads `OutboxEvent` from Prisma where `status = PENDING`.
- **Logic**:
  - `OrderCreatedEvent` -> Not currently handled (maybe notifications later).
  - `OrdersAggregatedEvent` -> Add to BullMQ `ORDER_QUEUE` as `dispatch-order` job, passing `{ orderId }`.
  - `OrderDispatchedEvent` -> Add to Notification/Analytics queues.
  - Updates `status` to `PROCESSED`.

### 2. Dispatch Processor (`dispatch.processor.ts`)
- **Location**: `apps/api/src/modules/orders/infrastructure/queues/dispatch.processor.ts`
- **Responsibility**: A thin BullMQ `WorkerHost` that listens to `ORDER_QUEUE`.
- **Logic**: 
  - Listens for jobs named `dispatch-order`.
  - Extracts `orderId` from `job.data`.
  - Calls `DispatchOrderUseCase.execute(orderId)`.

### 3. DispatchOrderUseCase (`dispatch-order.use-case.ts`)
- **Location**: `apps/api/src/modules/orders/application/use-cases/dispatch-order.use-case.ts`
- **Responsibility**: Takes one aggregated order and turns it into a real Chowdeck delivery.
- **Logic**:
  1. Load Order using `orderRepository.findById(orderId)`. (Include Organization, User, Restaurant).
  2. Validate state (`order.status === AGGREGATED`).
  3. **Idempotency Check**: Check if Delivery already exists for this `orderId`.
  4. Build payload using Restaurant address for pickup and Organization address for destination.
  5. Call `IRelayClient.createDelivery()`.
  6. Call `order.dispatch()` to update status.
  7. Use Prisma transaction (or repository method) to:
     - Create Delivery record in DB.
     - Update Order record.
     - Publish `OrderDispatchedEvent` to Outbox.
  8. Return.

## Open Questions

> [!IMPORTANT]
> - Do you want the `Outbox Worker` implemented as a NestJS `@Cron()` task, a continuous `setInterval` loop in a hosted service, or a BullMQ repeatable job?
> - Where should the Outbox Worker code reside? e.g. `apps/api/src/common/outbox/outbox.worker.ts`?
> - For the `Delivery` idempotency check, should I add a method to `OrderRepository` like `findDeliveryByOrderId()`?

## Verification Plan
- Implement the files in order.
- Verify TypeScript compilation.
- Ensure the `BullMQ` jobs are structured precisely as data-only records, keeping logic entirely in the Use Cases.
