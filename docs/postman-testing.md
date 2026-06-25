# ChowLink API Documentation

Base URL

http://localhost:3000

---

## Auth

### Register User

POST /auth/register

Request

{
"firstName": "John",
"lastName": "Doe",
"email": "[john@example.com](mailto:john@example.com)",
"password": "password123",
"organizationId": "organization-id"
}

Response

201 Created

---

### Login

POST /auth/login

Request

{
"email": "[john@example.com](mailto:john@example.com)",
"password": "password123"
}

Response

200 OK

{
"accessToken": "jwt-token"
}


---

## Refresh Token

POST /auth/refresh

Request:
{
  "refreshToken": "token"
}

Response:
{
  "accessToken": "new-token"
}

---

## Get Profile

GET /auth/me

Headers:
Authorization: Bearer <token>

Response:
{
  "sub": "user-id",
  "email": "...",
  "role": "EMPLOYEE"
}

# ORGANIZATIONS

---

## Create Organization

POST /organizations

Request

{
  "name": "Flutterwave",
  "industry": "Fintech",
  "orderingCutoffTime": "11:30"
}

---

## Create Department

POST /organizations/:id/departments

Request

{
  "name": "Engineering"
}

---

## Get Organizations

GET /organizations

---

## Get Organization

GET /organizations/:id

# CATALOGUE

---

POST /catalogue/restaurants

{
  "name": "Chicken Republic",
  "address": "Victoria Island",
  "cuisineType": "Fast Food"
}

---

POST /catalogue/restaurants/:restaurantId/menu-items

{
  "name": "Chicken & Chips",
  "price": 4500,
  "description": "Quarter chicken with chips"
}

---

GET /catalogue/restaurants

---

GET /catalogue/restaurants/:id

---

GET /catalogue/restaurants/:id/menu-items


# WALLETS

---

GET /wallets/:organizationId

---

POST /wallets/:organizationId/fund

{
  "amount": 50000,
  "reference": "FUND-001"
}

---

POST /wallets/:organizationId/debit

{
  "amount": 3000,
  "reference": "ORDER-001",
  "description": "Order dispatch"
}

---

POST /wallets/:organizationId/refund

{
  "amount": 3000,
  "reference": "REFUND-001",
  "description": "Delivery failed"
}

---

GET /wallets/:organizationId/transactions