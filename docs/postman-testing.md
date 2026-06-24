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