# JWT Authentication API

## Endpoints

### 1. Login
**POST** `/api/auth/login/`

Request body:
```json
{
  "username": "admin",
  "password": "your-password"
}
```

Response (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "first_name": "",
    "last_name": "",
    "is_staff": true
  }
}
```

### 2. Refresh Token
**POST** `/api/auth/token/refresh/`

Request body:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

Response (200 OK):
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 3. Logout
**POST** `/api/auth/logout/`

Headers:
```
Authorization: Bearer <access_token>
```

Request body:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

Response (200 OK):
```json
{
  "detail": "Successfully logged out"
}
```

### 4. Get Current User
**GET** `/api/auth/me/`

Headers:
```
Authorization: Bearer <access_token>
```

Response (200 OK):
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com",
  "first_name": "",
  "last_name": "",
  "is_staff": true
}
```

## Token Usage

Include the access token in all authenticated requests:
```
Authorization: Bearer <access_token>
```

## Token Lifetimes
- Access token: 60 minutes
- Refresh token: 1 day

## Error Responses

**Invalid credentials (401)**:
```json
{
  "detail": "Invalid username or password"
}
```

**Invalid/expired token (401)**:
```json
{
  "detail": "Token is invalid or expired"
}
```

**Missing token (401)**:
```json
{
  "detail": "Authentication credentials were not provided."
}
```
