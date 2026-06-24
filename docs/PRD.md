# ChowLink Product Requirements Document (PRD)

## 1. Product Overview

ChowLink is a B2B corporate food ordering platform powered by Chowdeck Relay.

Organizations use ChowLink to manage employee meal programs while leveraging Chowdeck's logistics infrastructure for delivery fulfillment.

Employees place meal requests before a daily cutoff time.

ChowLink aggregates orders, creates deliveries through Chowdeck Relay, receives delivery webhooks, and updates order statuses in real time.

---

## 2. Problem Statement

Organizations often struggle to coordinate employee meal programs.

Common challenges include:

* Multiple employees ordering independently
* Lack of centralized billing
* Difficulty tracking deliveries
* Administrative overhead in managing reimbursements
* No visibility into meal spending

ChowLink solves this by providing:

* Centralized ordering
* Company-funded wallets
* Consolidated delivery management
* Delivery tracking through Chowdeck Relay
* Spending analytics

---

## 3. Goals

### Business Goals

* Simplify corporate meal ordering
* Centralize meal spending
* Provide delivery visibility
* Reduce administrative overhead

### Technical Goals

* Demonstrate production-grade backend architecture
* Integrate with Chowdeck Relay APIs
* Process webhook events safely
* Support asynchronous workflows
* Maintain reliable delivery dispatching

---

## 4. User Roles

### SUPER_ADMIN

Platform administrator.

Permissions:

* Manage organizations
* View system analytics
* Suspend organizations
* View all orders

---

### COMPANY_ADMIN

Organization manager.

Permissions:

* Manage employees
* Fund organization wallet
* Configure ordering windows
* View organization analytics
* Monitor deliveries

---

### EMPLOYEE

Organization employee.

Permissions:

* Browse menu catalogue
* Place meal requests
* View order history
* Track deliveries

---

## 5. User Journeys

### Company Onboarding

1. Company Admin registers
2. Organization is created
3. Wallet is created
4. Employees are invited

---

### Employee Ordering

1. Employee logs in
2. Employee browses menu
3. Employee places meal request
4. Order enters PENDING state

---

### Order Aggregation

1. Daily cutoff time is reached
2. Orders are grouped
3. Aggregated order is prepared
4. Order enters AGGREGATED state

---

### Delivery Dispatch

1. Dispatch worker runs
2. Delivery request sent to Chowdeck Relay
3. Delivery created successfully
4. Order enters DISPATCHED state

---

### Delivery Completion

1. Chowdeck sends webhook
2. Webhook signature verified
3. Event processed
4. Order enters DELIVERED state

---

## 6. Order Lifecycle

PENDING

↓

AGGREGATED

↓

DISPATCHED

↓

IN_TRANSIT

↓

DELIVERED

Failure states:

FAILED

EXPIRED

CANCELLED

---

## 7. Wallet Rules

* Every organization has one wallet
* Wallet funds belong to the organization
* Wallet is debited when deliveries are dispatched
* Refunds are issued for failed deliveries
* Wallet balance cannot go below zero

---

## 8. Ordering Rules

* Employees may only place orders during active ordering windows
* Orders cannot be modified after cutoff
* Employees can only see their own orders
* Company Admins can see organization orders
* Orders must belong to the employee's organization

---

## 9. Delivery Rules

* Deliveries are created through Chowdeck Relay
* Delivery updates arrive through webhooks
* Webhook events must be idempotent
* Duplicate webhook events must be ignored
* Failed deliveries may be retried

---

## 10. Non-Functional Requirements

### Reliability

* Outbox Pattern for delivery dispatching
* Retry logic for Chowdeck API calls

### Security

* JWT authentication
* Role-based access control
* Webhook signature verification

### Performance

* Redis caching
* Queue-based processing
* Pagination for large datasets

### Observability

* Structured logging
* Request IDs
* Error tracking

---

## 11. Success Metrics

* Delivery Success Rate
* Average Delivery Time
* Orders Per Organization
* Wallet Utilization
* Most Ordered Meals
* Failed Delivery Percentage
