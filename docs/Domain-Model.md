# ChowLink Domain Model

## Core Domain

Corporate Food Ordering

---

## Actors

### Employee

Places meal requests.

### Company Admin

Manages employees and budgets.

### Super Admin

Manages platform operations.

---

## Aggregates

### Organization

Root aggregate for:

* Employees
* Departments
* Wallet

---

### Order

Root aggregate for:

* Order Items
* Delivery

---

### Wallet

Root aggregate for:

* Transactions

---

## Core Business Processes

### Meal Ordering

Employee submits meal request.

---

### Order Aggregation

Orders grouped after cutoff time.

---

### Delivery Dispatch

Aggregated orders dispatched through Chowdeck Relay.

---

### Delivery Tracking

Delivery status updated through webhooks.

---

### Wallet Settlement

Wallet debited on successful dispatch.

Refund issued on failure.

---

## Order State Machine

PENDING

↓

AGGREGATED

↓

DISPATCHED

↓

IN_TRANSIT

↓

DELIVERED

Failure States:

FAILED

EXPIRED

CANCELLED
