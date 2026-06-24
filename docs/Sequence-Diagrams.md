# Sequence Diagrams

This document describes the major workflows in ChowLink.

---

# 1. Employee Places Order

Employee

↓

POST /orders

↓

OrdersController

↓

PlaceOrderUseCase

↓

OrderRepository

↓

MySQL

↓

Create Outbox Event

↓

Commit Transaction

↓

Return Success

Result:

* Order created
* Order status = PENDING
* Outbox event created

---

# 2. Daily Order Aggregation

BullMQ Scheduler

↓

AggregateOrdersUseCase

↓

Fetch PENDING Orders

↓

Group Orders By Restaurant

↓

Update Status

↓

AGGREGATED

↓

Save Changes

Result:

* Orders grouped
* Ready for dispatch

---

# 3. Outbox Processing

Outbox Worker

↓

Fetch PENDING Outbox Events

↓

DispatchOrderUseCase

↓

Chowdeck SDK

↓

Relay API

↓

Success?

├── YES
│
│   Mark Event SENT
│
│   Create Delivery Record
│
│   Update Order Status
│
│   DISPATCHED
│
└── NO
│
Retry
│
FAILED after max retries

Result:

* Reliable delivery dispatching
* No lost orders

---

# 4. Delivery Dispatch Flow

Order

↓

Dispatch Queue

↓

Dispatch Processor

↓

Chowdeck Relay Client

↓

Create Delivery

↓

Receive Delivery ID

↓

Save Delivery Record

↓

Update Order Status

↓

DISPATCHED

Result:

* Chowdeck delivery created
* Internal delivery record stored

---

# 5. Webhook Processing Flow

Chowdeck

↓

Webhook Event

↓

Webhook Controller

↓

Verify Signature

↓

Check Redis Event Key

↓

Already Processed?

├── YES
│
│   Return 200
│
└── NO
│
Process Event
│
Save Event Key
│
Update Delivery
│
Update Order

Result:

* Idempotent webhook handling
* Duplicate events ignored

---

# 6. Delivery Completed

Chowdeck

↓

delivery.completed

↓

Webhook Controller

↓

Event Processor

↓

Update Delivery

↓

DELIVERED

↓

Update Order

↓

DELIVERED

↓

Create Notification

↓

Notify Employee

Result:

* Employee sees completed delivery

---

# 7. Failed Delivery

Chowdeck

↓

delivery.failed

↓

Webhook Controller

↓

Event Processor

↓

Update Delivery

↓

FAILED

↓

Update Order

↓

FAILED

↓

Wallet Refund

↓

Create Notification

↓

Notify Employee

Result:

* Funds refunded
* Employee informed

---

# 8. Wallet Funding

Company Admin

↓

POST /wallet/fund

↓

Wallet Controller

↓

Wallet Service

↓

Wallet Repository

↓

Wallet Transaction

↓

Update Balance

↓

Success

Result:

* Wallet credited
* Transaction recorded

---

# 9. Analytics Request

Company Admin

↓

GET /analytics

↓

Analytics Controller

↓

Analytics Service

↓

Redis Cache

↓

Cache Hit?

├── YES
│
│   Return Cached Data
│
└── NO
│
Query Database
│
Calculate Metrics
│
Cache Result
│
Return Response

Result:

* Fast analytics retrieval
