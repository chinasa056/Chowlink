# Engineering Tradeoffs

This document explains major architectural decisions made during the development of ChowLink.

---

# Why NestJS Instead of Express

Decision:

NestJS

Reason:

* Built-in dependency injection
* Modular architecture
* Easier scaling as project grows
* Strong TypeScript support

Tradeoff:

* More boilerplate
* Higher learning curve

Accepted because maintainability is more important than minimal setup.

---

# Why Prisma Instead of Sequelize

Decision:

Prisma

Reason:

* Strong type safety
* Excellent TypeScript support
* Better developer experience
* Easier schema evolution

Tradeoff:

* Less flexibility for very complex SQL

Accepted because developer productivity is prioritized.

---

# Why MySQL Instead of MongoDB

Decision:

MySQL

Reason:

* Strong relational data model
* Transaction support
* Better fit for organizations, orders, wallets, and deliveries

Tradeoff:

* Less flexibility for unstructured data

Accepted because relationships are core to the system.

---

# Why Redis

Decision:

Redis

Used For:

* Caching
* Idempotency
* Webhook deduplication
* Queue coordination

Tradeoff:

* Additional infrastructure component

Accepted because performance and reliability benefits outweigh complexity.

---

# Why BullMQ

Decision:

BullMQ

Reason:

* Reliable background processing
* Retry support
* Delayed jobs
* Repeatable jobs

Tradeoff:

* More operational complexity

Accepted because delivery dispatching should not happen synchronously.

---

# Why an SDK Instead of Direct Axios Calls

Decision:

Custom Chowdeck SDK

Reason:

* Single integration boundary
* Easier testing
* Reusable code
* Cleaner business logic

Tradeoff:

* Additional abstraction layer

Accepted because external integrations should be isolated.

---

# Why Outbox Pattern

Decision:

Outbox Pattern

Reason:

* Prevent data inconsistency
* Reliable dispatching
* Supports retries

Tradeoff:

* Additional database table
* Additional worker

Accepted because reliability is critical.

---

# Why Webhook Idempotency

Decision:

Redis Event Tracking

Reason:

* Chowdeck may retry events
* Prevent duplicate processing

Tradeoff:

* Additional Redis reads

Accepted because duplicate delivery processing is unacceptable.

---

# Why Layered Modules

Decision:

Presentation

↓

Application

↓

Domain

↓

Infrastructure

Reason:

* Separation of concerns
* Easier testing
* Easier maintenance

Tradeoff:

* More files

Accepted because clarity scales better than convenience.

---

# Why Not Microservices

Decision:

Modular Monolith

Reason:

* Faster development
* Easier deployment
* Lower operational complexity

Tradeoff:

* Less independent scaling

Accepted because project scope does not justify microservices.

---

# Why Not Kafka

Decision:

BullMQ + Redis

Reason:

* Simpler setup
* Sufficient for current workload

Tradeoff:

* Lower throughput than Kafka

Accepted because project requirements are moderate.

---

# Future Improvements

Potential future enhancements:

* Kafka event streaming
* Distributed tracing
* Multi-region deployment
* Event sourcing
* CQRS
* Kubernetes deployment
* Read replicas
* Advanced observability
