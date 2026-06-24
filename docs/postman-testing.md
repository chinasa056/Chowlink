# SwiftFX Postman Testing Guide

Base URL:

```text
http://localhost:3000
```

Environment variables to create in Postman:

```text
baseUrl=http://localhost:3000
accessToken=<set after login>
registrationToken=<set after verify email>
```

## FX Rate Service

These endpoints are public and only return market-rate information. Wallet-changing conversion is handled by `POST /wallet/convert`.

### Get exchange rate

```http
GET {{baseUrl}}/fx/rate?fromCurrency=NGN&toCurrency=USD
```

Query params:

```json
{
  "fromCurrency": "NGN",
  "toCurrency": "USD"
}
```

Example success response:

```json
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "rate": 0.0006666666666666666
}
```

Supported currencies:

```text
NGN, USD, EUR, GBP
```

Caching behavior:

```text
Redis key: fx-rate:<FROM>:<TO>
TTL: 300 seconds
Stale fallback key: fx-rate:stale:<FROM>:<TO>
External API: https://open.er-api.com/v6/latest/<FROM>
```

## Auth Flow

### Start registration

```http
POST {{baseUrl}}/auth/startRegister
Content-Type: application/json
```

Request body:

```json
{
  "email": "tester@example.com"
}
```

### Verify email code

```http
POST {{baseUrl}}/auth/verifyEmailCode
Content-Type: application/json
```

Request body:

```json
{
  "email": "tester@example.com",
  "code": "123456"
}
```

Save the returned registration token as `registrationToken`.

### Complete profile

```http
POST {{baseUrl}}/auth/completeProfile
Content-Type: application/json
```

Request body:

```json
{
  "registrationToken": "{{registrationToken}}",
  "fullName": "Test User",
  "dateOfBirth": "1995-01-01",
  "gender": "OTHER",
  "profilePicture": "https://example.com/avatar.png",
  "password": "Password123!"
}
```

### Login

```http
POST {{baseUrl}}/auth/login
Content-Type: application/json
```

Request body:

```json
{
  "email": "tester@example.com",
  "password": "Password123!"
}
```

Save the returned JWT as `accessToken`.

## Wallet Flow

All wallet endpoints require:

```http
Authorization: Bearer {{accessToken}}
```

### Create wallet

```http
POST {{baseUrl}}/wallet/create
Authorization: Bearer {{accessToken}}
```

Request body:

```json
{}
```

### Get wallet

```http
GET {{baseUrl}}/wallet
Authorization: Bearer {{accessToken}}
```

### Fund wallet

```http
POST {{baseUrl}}/wallet/fund
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Request body:

```json
{
  "currency": "NGN",
  "amount": 100000,
  "reference": "POSTMAN-FUND-001"
}
```

### Convert currency

```http
POST {{baseUrl}}/wallet/convert
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Request body:

```json
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "amount": 1000,
  "reference": "POSTMAN-CONVERT-001"
}
```

Second conversion example:

```json
{
  "fromCurrency": "EUR",
  "toCurrency": "NGN",
  "amount": 50,
  "reference": "POSTMAN-CONVERT-002"
}
```

### Get all balances

```http
GET {{baseUrl}}/wallet/balances
Authorization: Bearer {{accessToken}}
```

### Get balance by currency

```http
GET {{baseUrl}}/wallet/balances/NGN
Authorization: Bearer {{accessToken}}
```

## Transaction Flow

All transaction endpoints require:

```http
Authorization: Bearer {{accessToken}}
```

Use the optional `reference` field when retrying a request from Postman. If the same authenticated user sends the same reference again, the API returns the existing transaction instead of creating another one.

### Execute trade

```http
POST {{baseUrl}}/transaction/trade
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

Request body:

```json
{
  "fromCurrency": "NGN",
  "toCurrency": "USD",
  "amount": 1000,
  "rate": 0.0006666666666666666,
  "reference": "POSTMAN-TRADE-001"
}
```

### Get transaction history

```http
GET {{baseUrl}}/transaction/history
Authorization: Bearer {{accessToken}}
```

### Get transaction details

```http
GET {{baseUrl}}/transaction/<transactionId>
Authorization: Bearer {{accessToken}}
```

## Expected FX Failure Cases

Unsupported currency:

```http
GET {{baseUrl}}/fx/rate?fromCurrency=NGN&toCurrency=CAD
```

Expected response:

```json
{
  "message": "Currency must be one of NGN, USD, EUR, GBP",
  "error": "Bad Request",
  "statusCode": 400
}
```

Invalid amount:

```http
POST {{baseUrl}}/wallet/convert
Authorization: Bearer {{accessToken}}
Content-Type: application/json
```

```json
{
  "amount": 0,
  "fromCurrency": "NGN",
  "toCurrency": "USD"
}
```

Expected response:

```json
{
  "message": "Amount must be greater than zero",
  "error": "Bad Request",
  "statusCode": 400
}
```
