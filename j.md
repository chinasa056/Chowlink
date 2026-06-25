Yes. At this point, I think we've arrived at something that is both:

1. **Realistic enough to be built in 7–14 days**
2. **Sophisticated enough to impress Chowdeck engineers**

What I like most is that every architectural decision now has a purpose.

---

# Final Project Vision

## ChowLink

**A B2B Corporate Food Ordering Platform powered by Chowdeck Relay**

Organizations create lunch programs for employees.

Employees submit meal requests before a daily cutoff.

ChowLink aggregates orders.

ChowLink dispatches deliveries through Chowdeck Relay.

ChowLink receives Chowdeck webhooks and updates order statuses.

Organizations get centralized billing, analytics, and delivery management.

---

# High-Level Architecture

```text
apps/
│
├── api/
│   └── NestJS Application
│
packages/
│
├── chowdeck-sdk/
│
docs/
│
├── Architecture.md
├── ERD.md
├── API.md
├── SequenceDiagrams.md
├── Decisions.md
│
docker/
│
.github/
```

---

# Tech Stack

```text
Framework:
NestJS

Language:
TypeScript

Database:
MySQL

ORM:
Prisma

Cache:
Redis

Queue:
BullMQ

Docs:
Swagger

Testing:
Jest

Containerization:
Docker

CI/CD:
GitHub Actions

Validation:
class-validator

Logging:
nestjs-pino

API Client:
Axios (wrapped inside Chowdeck SDK)
```

---

# Architecture Style

Not full DDD.

Not basic NestJS.

A modular layered architecture inspired by DDD.

Every module contains:

```text
module/

application/

domain/

infrastructure/

presentation/

module.module.ts
```

---

# Module Layout Example

```text
orders/

application/

domain/

infrastructure/

presentation/

orders.module.ts
```

---

# Presentation Layer

Responsible for HTTP.

```text
presentation/

controllers/

dto/

responses/
```

Examples:

```text
OrdersController

CreateOrderDto

UpdateOrderStatusDto
```

No business logic here.

---

# Application Layer

Responsible for orchestration.

```text
application/

use-cases/
```

Examples:

```text
PlaceOrderUseCase

AggregateOrdersUseCase

DispatchOrderUseCase

CancelOrderUseCase
```

Responsibilities:

```text
Validate workflow

Call repositories

Call SDK

Publish events

Coordinate operations
```

No Prisma.

No Redis.

No Axios.

---

# Domain Layer

Responsible for business rules.

```text
domain/

entities/

enums/

interfaces/
```

Examples:

```text
Order

OrderStatus

OrderRepository
```

Business rules live here.

Example:

```typescript
order.dispatch()

order.cancel()

order.complete()
```

Instead of:

```typescript
if(order.status !== ...)
```

scattered throughout the application.

---

# Infrastructure Layer

Responsible for external systems.

```text
infrastructure/

persistence/

cache/

queues/

integrations/
```

Contains:

```text
Prisma

Redis

BullMQ

Chowdeck SDK
```

---

# Modules

---

## Auth Module

```text
auth/

application/

domain/

infrastructure/

presentation/
```

Features:

```text
Register

Login

JWT

Refresh Token

RBAC
```

Roles:

```text
SUPER_ADMIN

COMPANY_ADMIN

EMPLOYEE
```

---

## Organization Module

Features:

```text
Create Company

Invite Employee

Manage Departments

Manage Wallet
```

---

## Catalogue Module

Features:

```text
Restaurants

Menu Items

Search

Filtering
```

Redis Cached.

---

## Order Module

The heart of the system.

Features:

```text
Create Order

Aggregate Orders

Dispatch Orders

Track Orders

Cancel Orders
```

Order State Machine:

```text
PENDING

↓

AGGREGATED

↓

DISPATCHED

↓

IN_TRANSIT

↓

DELIVERED
```

Failure Path:

```text
FAILED

EXPIRED
```

---

## Wallet Module

Features:

```text
Wallet Balance

Debit

Refund

Transactions
```

---

## Notification Module

BullMQ Jobs:

```text
Order Created

Delivery Created

Delivery Completed

Refund Issued
```

For MVP:

```text
Database notifications

Console logs
```

---

## Analytics Module

Features:

```text
Orders Today

Total Spend

Most Ordered Meals

Top Departments

Delivery Success Rate
```

---

# Chowdeck SDK

One of the strongest parts of the project.

---

## Structure

```text
packages/

chowdeck-sdk/

src/

RelayClient.ts

WebhookVerifier.ts

HttpClient.ts

RetryPolicy.ts

Types.ts

Errors.ts
```

---

## Usage

Instead of:

```typescript
axios.post(...)
```

You write:

```typescript
await chowdeckClient.createDelivery(...)
```

Benefits:

```text
Reusable

Testable

Clean

Production-like
```

---

# Chowdeck Integration Module

```text
modules/

chowdeck/
```

Contains:

```text
Webhook Controller

Event Processor

Relay Adapter
```

---

# Webhook Flow

```text
Chowdeck

↓

Webhook

↓

Verify Signature

↓

Check Idempotency

↓

Process Event

↓

Update Order
```

---

# Redis Idempotency

When webhook arrives:

```text
delivery.completed
```

Store:

```text
eventId
```

in Redis.

If Chowdeck retries:

```text
Already Processed

↓

Ignore
```

This mirrors real production systems.

---

# Queue Architecture

BullMQ

```text
Order Aggregated

↓

Dispatch Queue

↓

Worker

↓

Create Delivery

↓

Success
```

---

# Retry Flow

```text
Dispatch Delivery

↓

Timeout

↓

Retry

↓

Retry

↓

Retry

↓

Dead Letter Queue
```

---

# Outbox Pattern

We'll use it.

---

## Why?

Avoid:

```text
Order Saved

↓

Chowdeck API Failed

↓

Data Mismatch
```

---

## Flow

```text
Transaction

├── Save Order

└── Save Outbox Event

↓

Commit

↓

Worker Reads Outbox

↓

Calls Chowdeck

↓

Marks Event Sent
```

Benefits:

```text
Reliable

Recoverable

No Lost Events
```

---

# Database Design (High Level)

Core Tables:

```text
users

organizations

departments

wallets

restaurants

menu_items

orders

order_items

deliveries

notifications

outbox_events

audit_logs
```

---

# Observability

Logging:

```text
Request ID

Correlation ID

Latency

Status Code
```

Using:

```text
nestjs-pino
```

---

# API Documentation

Swagger.

Every endpoint:

```text
Request

Response

Errors

Examples
```

---

# Testing

Jest

Focus:

```text
Use Cases

Webhook Verification

Order State Machine

SDK

Outbox Processing
```

---

# Documentation

```text
docs/

Architecture.md

ERD.md

API.md

SequenceDiagrams.md

Decisions.md

Scaling.md
```

This is where you'll explain:

* Why BullMQ
* Why Redis
* Why Outbox
* Why SDK
* Why Prisma
* Why NestJS

---

# What Will Impress Chowdeck Most

Not NestJS.

Not Prisma.

Not BullMQ.

Not Redis.

The strongest signal is:

> You understood Chowdeck's Relay product, designed a real business application around it, implemented webhook handling, idempotency, queues, retries, and integration patterns, and documented the architecture like a professional engineering team.

That's what turns this from a portfolio project into a conversation starter during hiring.

### What I'd do next

Before writing code, create:

1. **Product Requirements Document (PRD)**
2. **User Roles & User Journeys**
3. **Business Rules**
4. **Database ERD**
5. **Module Responsibilities**
6. **API Endpoint Specification**
7. **Sequence Diagrams**
8. **Prisma Schema Design**

Once those are finalized, implementation becomes much faster because every decision has already been made.



Architecture mistake (overengineering)

Tuesday

How I designed the database schema

Wednesday

Why I chose Outbox Pattern

Thursday

Building a custom SDK instead of scattering Axios calls

Friday

How webhooks and idempotency actually work

Saturday

Project showcase

Sunday

Lessons learned building it