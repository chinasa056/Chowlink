
Employee

↓

PlaceOrderUseCase

↓

OrderEntity.create()

↓

Repository.create()

↓

Publish(OrderCreatedEvent)

↓

OutboxEventPublisher

↓

Outbox Table

──────────────────────────

11:30 AM

↓

BullMQ Scheduler

↓

AggregateOrdersUseCase

↓

Order.aggregate()

↓

Repository.save()

↓

Publish(OrdersAggregatedEvent)

↓

Outbox Table

──────────────────────────

Dispatch Processor

↓

DispatchOrderUseCase

↓

Chowdeck SDK

↓

Delivery Created

↓

OrderDispatchedEvent

↓

Outbox
```



## I would simplify BullMQ to just two jobs.

### Job 1

```text
11:30 AM

↓

Aggregate Orders
```

---

### Job 2

```text
Dispatch Orders
```

## Responsibilities (agregate order is doe though)

### Scheduler

Only knows

> **WHEN** something should happen.

```text
11:30

↓

Add Aggregate Job
```

Nothing else.

---

### Aggregation Processor

Only knows

> **Execute AggregateOrdersUseCase**

```text
Job

↓

AggregateOrdersUseCase.execute()
```

Nothing else.

---

### Dispatch Processor

Only knows

```text
Job

↓

DispatchOrderUseCase.execute()
```

Nothing else.

---

## Where does the Outbox fit now?

Exactly where it already does.

```text
PlaceOrderUseCase

↓

Publish(OrderCreatedEvent)

↓

Outbox
```

---

```text
AggregateOrdersUseCase

↓

Publish(OrdersAggregatedEvent)

↓

Outbox
```

---

```text
DispatchOrderUseCase

↓

Publish(OrderDispatchedEvent)

↓

Outbox
```

The Outbox becomes an **audit trail** of everything important that happened in the system.


No unnecessary complexity.

---

## I think Phase 2 should now be exactly this

```
Step 1
```

Configure BullMQ.

---

```
Step 2
```

Build

```
aggregation.scheduler.ts
```

Schedules the daily aggregation.

---

```
Step 3
```

Build

```
aggregation.processor.ts
```

Executes `AggregateOrdersUseCase`. (done)

---

```
Step 4 (nw to do)
```

Build

```
dispatch.processor.ts
```

Executes `DispatchOrderUseCase`.

For now it can use a mock adapter. In Phase 3 we'll replace it with the real Chowdeck SDK.

---

```
Step 5
```

Build `DispatchOrderUseCase`.

It will:

* Load aggregated orders.
* Create deliveries through the adapter.
* Update the order state to `DISPATCHED`.
* Publish `OrderDispatchedEvent`.

---


# Our Final Event Flow (Version 1)

Let's lock this in.

```
Employee

        │

        ▼

PlaceOrderUseCase

        │

        ▼

OrderEntity.create()

        │

        ▼

Repository.create()

        │

        ▼

Publish(OrderCreatedEvent)

        │

        ▼

Outbox Table

────────────────────────────────────

11:30 Scheduler

        │

        ▼

AggregateOrdersUseCase

        │

        ▼

Order.aggregate()

        │

        ▼

Repository.update()

        │

        ▼

Publish(OrdersAggregatedEvent)

        │

        ▼

Outbox Table

────────────────────────────────────

Dispatch Processor

        │

        ▼

DispatchOrderUseCase

        │

        ▼

Chowdeck SDK

        │

        ▼

Delivery Created

        │

        ▼

Publish(OrderDispatchedEvent)

        │

        ▼

Outbox Table
```
