# ChowLink Entity Relationship Design (ERD)

## Overview

This document defines the core entities, ownership boundaries, and relationships within ChowLink.

---

# User

Represents any authenticated platform user.

## Attributes

* id
* firstName
* lastName
* email
* password
* role
* organizationId
* departmentId
* createdAt
* updatedAt

## Relationships

* Belongs to one Organization
* Belongs to one Department (optional)
* Can create many Orders

---

# Organization

Represents a company using ChowLink.

## Attributes

* id
* name
* industry
* orderingCutoffTime
* isActive
* createdAt
* updatedAt

## Relationships

* Has many Users
* Has many Departments
* Has one Wallet
* Has many Orders

---

# Department

Represents a team inside an organization.

## Attributes

* id
* name
* organizationId

## Relationships

* Belongs to Organization
* Has many Users

---

# Wallet

Represents organization spending balance.

## Attributes

* id
* organizationId
* balance
* currency

## Relationships

* Belongs to Organization
* Has many WalletTransactions

---

# WalletTransaction

Tracks wallet activity.

## Attributes

* id
* walletId
* amount
* type
* description
* createdAt

## Types

* CREDIT
* DEBIT
* REFUND

## Relationships

* Belongs to Wallet

---

# Restaurant

Represents available vendors.

## Attributes

* id
* name
* description
* isActive

## Relationships

* Has many MenuItems

---

# MenuItem

Represents food available for ordering.

## Attributes

* id
* restaurantId
* name
* description
* price
* isAvailable

## Relationships

* Belongs to Restaurant

---

# Order

Represents an employee meal request.

## Attributes

* id
* userId
* organizationId
* status
* totalAmount
* notes
* createdAt
* updatedAt

## Relationships

* Belongs to User
* Belongs to Organization
* Has many OrderItems
* Has one Delivery

---

# OrderItem

Represents items within an order.

## Attributes

* id
* orderId
* menuItemId
* quantity
* price

## Relationships

* Belongs to Order
* Belongs to MenuItem

---

# Delivery

Represents a Chowdeck delivery.

## Attributes

* id
* orderId
* chowdeckDeliveryId
* status
* estimatedArrival
* deliveredAt

## Relationships

* Belongs to Order

---

# Notification

Represents user notifications.

## Attributes

* id
* userId
* title
* message
* isRead

## Relationships

* Belongs to User

---

# OutboxEvent

Used by the Outbox Pattern.

## Attributes

* id
* aggregateId
* aggregateType
* eventType
* payload
* status
* createdAt

## Status

* PENDING
* PROCESSING
* SENT
* FAILED

---

# AuditLog

Tracks important system actions.

## Attributes

* id
* actorId
* action
* entityType
* entityId
* metadata
* createdAt

## Relationships

* Belongs to User

---

# High-Level Relationships

Organization
│
├── Users
│
├── Departments
│
├── Wallet
│
└── Orders

User
│
├── Orders
│
└── Notifications

Restaurant
│
└── MenuItems

Order
│
├── OrderItems
│
└── Delivery

Wallet
│
└── WalletTransactions
