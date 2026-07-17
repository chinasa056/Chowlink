Excellent. This is actually where the project starts becoming different from almost every portfolio project on GitHub.

We've finished the synchronous part:

```text
Employee

↓

POST /orders

↓

Database

↓

Outbox Event Created
```

Now we move into **asynchronous architecture**, which is exactly how companies like Chowdeck, Paystack, Moniepoint, Kuda, Uber, DoorDash, etc. build systems.

---

# Here's our roadmap from here

## ✅ Completed

```text
Infrastructure

✓ NestJS
✓ Prisma
✓ MySQL

Business Modules

✓ Auth
✓ Organizations
✓ Catalogue
✓ Wallet

Orders

✓ Order Entity
✓ Order Repository
✓ PlaceOrderUseCase

Pattern

✓ Outbox table
```

---

## Phase 1 (Next)

# AggregateOrdersUseCase ⭐⭐⭐⭐⭐

This is where Orders stop being CRUD.

At exactly **11:30 AM**

BullMQ fires

↓

AggregateOrdersUseCase

↓

Find all Pending Orders

↓

Group them

↓

Change state

↓

Save

↓

Create Dispatch Outbox Event

This introduces our first asynchronous business workflow.

---

## Phase 2

BullMQ Scheduler

```text
11:30 AM

↓

BullMQ Repeatable Job

↓

Aggregation Queue

↓

AggregateOrdersUseCase
```

Now the application does work by itself.

No HTTP request involved.

---

## Phase 3

Outbox Worker

```text
Pending Outbox Events

↓

BullMQ Worker

↓

Dispatch Queue
```

Now we're processing events instead of requests.

---

## Phase 4

DispatchOrderUseCase

```text
Dispatch Queue

↓

Find Aggregated Orders

↓

Call Chowdeck SDK

↓

Order.dispatch()

↓

Save

↓

Wait for webhook
```

---

## Phase 5

Webhook

```text
Webhook

↓

Verify Signature

↓

Deduplicate

↓

CompleteOrderUseCase

↓

Order.complete()

↓

Save
```

---

# I actually want to improve the Aggregate use case

The original design we had was

```text
Find Pending Orders

↓

Loop

↓

Aggregate()

↓

Save()
```

That's okay.

But I think we can make it much more realistic.

---

# How Corporate Lunch Actually Works

Imagine this company.

```text
Flutterwave HQ
```

Employees order

```text
Rice

Rice

Rice

Shawarma

Pizza

Burger
```

Restaurants

```text
Chicken Republic

Domino's

KFC
```

The company doesn't want

```text
6 deliveries
```

It wants

```text
3 deliveries

One per restaurant.
```

So instead of

```text
Pending Orders

↓

Aggregate
```

We'll do

```text
Pending Orders

↓

Load Order Items

↓

Determine Restaurant

↓

Group By Restaurant

↓

Create Delivery Batch

↓

Mark Orders Aggregated

↓

Create Dispatch Event
```

That's much closer to a real logistics system.

---

# Visual Flow

```text
11:30

↓

BullMQ Scheduler

↓

AggregateOrdersUseCase

↓

Find Pending Orders

↓

Load Order Items

↓

Restaurant A

├── Order 1

├── Order 4

└── Order 8

Restaurant B

├── Order 2

└── Order 6

Restaurant C

├── Order 3

└── Order 5

↓

Create Aggregation Batch

↓

Order.aggregate()

↓

Repository.save()

↓

Outbox Event

↓

Dispatch Queue
```

Notice something interesting.

The **Order status changes**.

But we also discover a brand new concept.

---

# Delivery Batch

I think we should introduce one more domain concept.

Not today.

Later.

```text
DeliveryBatch
```

Example

```text
Batch

id

restaurantId

organizationId

dispatchTime

orders[]
```

Instead of dispatching

```text
Order 1

Order 2

Order 3
```

We dispatch

```text
Batch 19

↓

contains

↓

Order 1

Order 2

Order 3
```

That's much closer to how Chowdeck Relay would likely operate internally.

I wouldn't put it in Version 1 because it would require another Prisma model and relationships, but we can mention it in the documentation as a future enhancement. If an interviewer asks how you'd scale the system, this is one of the first things I'd bring up.

---

# What We'll Build Next (In Order)

I think this sequence is the strongest:

### Step 1 — AggregateOrdersUseCase ⭐⭐⭐⭐⭐

This introduces state transitions.

```
PENDING

↓

AGGREGATED
```

---

### Step 2 — Aggregation Processor (BullMQ)

```
11:30

↓

Queue

↓

AggregateOrdersUseCase
```

---

### Step 3 — DispatchOrderUseCase

```
AGGREGATED

↓

DISPATCHED
```

---

### Step 4 — Dispatch Processor

```
Queue

↓

DispatchOrderUseCase

↓

Chowdeck Adapter
```

---

### Step 5 — Chowdeck SDK

```
Relay Client

Delivery Client

Retry Policy

Webhook Verifier
```

---

### Step 6 — Webhook Processor

```
IN_TRANSIT

↓

DELIVERED
```

---

## I also want to make one architectural change before we code the aggregator

This is something I think you'll appreciate because it makes the architecture feel "alive."

Instead of our use cases directly creating outbox records, I'd like to introduce a dedicated **Domain Event Publisher** abstraction. The `AggregateOrdersUseCase` would simply publish an `OrdersAggregatedEvent`, and the infrastructure layer would persist it to the `outbox_events` table. Later, if you ever replaced the Outbox with Kafka, RabbitMQ, or another message broker, the application layer wouldn't change at all—only the event publisher implementation would.

It's a small abstraction, but it demonstrates another level of architectural thinking without adding much complexity.

So my recommendation is:

1. Build **AggregateOrdersUseCase**.
2. Introduce a lightweight `DomainEventPublisher` interface while we're there.
3. Keep the Outbox implementation behind that interface.

That gives us a clean, extensible foundation for every asynchronous workflow that follows.
