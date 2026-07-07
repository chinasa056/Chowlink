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


# Cancel Order Use Case Implementation Plan

This plan details the implementation of the `CancelOrderUseCase` for the corporate food ordering platform to cancel an aggregated order after it has been dispatched to Chowdeck. It ensures transactional consistency between local state (Order and Delivery statuses) and the Outbox event stream.

## Proposed Changes

---

### [Component Name] Database & Schema

#### [MODIFY] [schema.prisma](file:///c:/Users/User/Desktop/Chowlink/apps/api/prisma/schema.prisma)
- Add `CANCELLED` status to `DeliveryStatus` enum.
- Add `cancelledAt DateTime?` and `cancelReason String?` to the `Delivery` model.

---

### [Component Name] Core Orders Domain

#### [MODIFY] [order.entities.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/domain/entities/order.entities.ts)
- Modify the `cancel()` method to allow cancellation when the order is in `OrderStatus.DISPATCHED`.

#### [MODIFY] [order.repository.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/domain/interfaces/order.repository.ts)
- Update the signature of `saveDispatchTransaction`'s `deliveryData.status` parameter to support the `'CANCELLED'` state.
- Add the `saveCancelTransaction` method signature to handle atomic cancellation transactions.

---

### [Component Name] Infrastructure & Persistence

#### [MODIFY] [prisma-order.repository.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/infrastructure/persistence/prisma-order.repository.ts)
- Update the signature of `saveDispatchTransaction`'s `deliveryData.status` parameter to support the `'CANCELLED'` state.
- Implement the `saveCancelTransaction` method. Under a database transaction, this will:
  1. Update the associated `Delivery` record's `status` to `CANCELLED`, `cancelledAt` to `new Date()`, and `cancelReason` to the provided reason.
  2. Update the `Order` record's `status` to `CANCELLED` and `cancelledAt` to the current date.
  3. Create an `OutboxEvent` for the order cancellation.

---

### [Component Name] Events & Outbox

#### [MODIFY] [order.event.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/events/order/order.event.ts)
- Define the `OrderCancelledEvent` implementing the `DomainEvent` interface.

#### [MODIFY] [outbox.processor.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/queues/outbox.processor.ts)
- Add routing for the `'ORDER_CANCELLED'` event type within `routeEvent()`. Currently, it will log the event as processed with downstream notification and refund jobs marked as future implementations.

---

### [Component Name] Application Orchestration

#### [NEW] [cancel-order.dto.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/presentation/dto/cancel-order.dto.ts)
- Create a `CancelOrderDto` with a required validation decorator for the cancellation `reason`.

#### [MODIFY] [cancel-order.use-case.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/application/use-cases/cancel-order.use-case.ts)
- Implement `CancelOrderUseCase` with the following workflow:
  1. Load the Order and ensure it exists (throw `NotFoundException` otherwise).
  2. Load the associated Delivery record and ensure it exists (throw `NotFoundException` otherwise).
  3. Validate the `reason` is not empty (throw `BadRequestException` otherwise).
  4. Validate `Delivery.status` (must not be `DELIVERED`, `CANCELLED`, or `IN_TRANSIT`). Throw `BadRequestException` if any validation fails.
  5. Call the `ChowdeckRelayClient.cancelDelivery` SDK method.
  6. Transition the order state to cancelled using `order.cancel()`.
  7. Persist order/delivery state updates and the `OrderCancelledEvent` outbox log atomically by calling `OrderRepository.saveCancelTransaction()`.

---

### [Component Name] Presentation & Module Registration

#### [MODIFY] [orders.controller.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/presentation/controllers/orders.controller.ts)
- Define `OrdersController` and add a `POST /orders/:id/cancel` endpoint.
- Instantiates the `CancelOrderUseCase` and handles requests by invoking `cancelOrderUseCase.execute(id, dto.reason)`.

#### [MODIFY] [orders.module.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/orders.module.ts)
- Add `OrdersController` to the controller registrations.
- Provide `CancelOrderUseCase` and bind the `OrderRepository` implementation if not already done.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify the codebase compiles successfully.
- Run `npm run test` to check if tests pass.

### Manual Verification
- We can write a script or mock test to run the use case and verify that when Chowdeck successfully processes cancellation, both Order and Delivery statuses are updated to `CANCELLED` and a new event is saved in the Outbox.

# Cancel Order Implementation Walkthrough

We have successfully implemented the `CancelOrderUseCase` flow to allow cancelling dispatched orders through the Chowdeck Relay API and persisting state transitions atomically.

## Changes Made

### 1. Database Schema Updates
- **File**: [schema.prisma](file:///c:/Users/User/Desktop/Chowlink/apps/api/prisma/schema.prisma)
- **Modifications**:
  - Added `CANCELLED` status to the `DeliveryStatus` enum.
  - Added `cancelledAt` (DateTime?) and `cancelReason` (String?) to the `Delivery` model.
- **Migration**: Ran `npx prisma db push` to synchronize the MySQL database and regenerate the Prisma Client.

### 2. Core Orders Domain
- **File**: [order.entities.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/domain/entities/order.entities.ts)
  - Updated the `cancel()` domain method to allow transition from `OrderStatus.DISPATCHED`.
  - Added a sequence comment at the end pointing to `prisma-order.repository.ts`.
- **File**: [order.repository.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/domain/interfaces/order.repository.ts)
  - Converted the `OrderRepository` from `interface` to `abstract class` for compatibility with NestJS's dependency injection container.
  - Updated `saveDispatchTransaction`'s status parameter type to include `'CANCELLED'`.
  - Added the abstract `saveCancelTransaction` signature.
  - Added a sequence comment pointing to `prisma-order.repository.ts`.

### 3. Infrastructure & Persistence
- **File**: [prisma-order.repository.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/infrastructure/persistence/prisma-order.repository.ts)
  - Updated implementation of `saveDispatchTransaction` status type.
  - Implemented the `saveCancelTransaction` method, wrapping the Delivery/Order cancellations and the outbox event write in an atomic `$transaction`.
  - Added a sequence comment pointing to `outbox.processor.ts`.

### 4. Events & Outbox Routing
- **File**: [order.event.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/events/order/order.event.ts)
  - Added `OrderCancelledEvent`.
- **File**: [domain-event.publisher.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/events/domain-event.publisher.ts)
  - Converted the `DomainEventPublisher` from `interface` to `abstract class` so it is resolvable as a DI token.
- **File**: [events.module.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/events/events.module.ts)
  - Activated and exported `EventsModule` as `@Global()`, binding `DomainEventPublisher` to `OutboxEventPublisher`.
- **File**: [app.module.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/app.module.ts)
  - Imported `EventsModule`.
- **File**: [outbox.processor.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/common/queues/outbox.processor.ts)
  - Added route event mapping for `ORDER_CANCELLED` to log event processing, and added an end-of-sequence comment.

### 5. Application Logic & Presentation
- **File**: [cancel-order.dto.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/presentation/dto/cancel-order.dto.ts)
  - Created validation structure requiring a cancellation `reason`.
  - Added a sequence comment pointing to `orders.controller.ts`.
- **File**: [cancel-order.use-case.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/application/use-cases/cancel-order.use-case.ts)
  - Implemented `CancelOrderUseCase` with full validations, Chowdeck SDK call, domain state transition, and transaction persistence.
  - Added sequence comments.
- **File**: [orders.controller.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/presentation/controllers/orders.controller.ts)
  - Implemented the controller mapping `POST /orders/:id/cancel` and calling `CancelOrderUseCase`.
  - Added sequence comments.
- **File**: [orders.module.ts](file:///c:/Users/User/Desktop/Chowlink/apps/api/src/modules/orders/orders.module.ts)
  - Registered `OrdersController`, `CancelOrderUseCase`, `PlaceOrderUseCase`, and mapped `OrderRepository` to `PrismaOrderRepository`.

### 6. Documentation
- **File**: [postman-testing.md](file:///c:/Users/User/Desktop/Chowlink/docs/postman-testing.md)
  - Added API documentation for the Cancel Order endpoint under a new `# ORDERS` section.

## Verification
- Ran `npm run build` which compiled successfully with no type errors.
