# Authentication & Authorization

## JWT Strategy

- **Algorithm**: HS256.
- **Payload**: `{ sub: userId, email: string }`.
- **Expiration**: 1 hour.
- **Secret**: Loaded from environment variable `JWT_SECRET`.

## Password Security

- Hash passwords with **bcrypt** (salt rounds: 10).
- Never return password fields in API responses.
- Never log password values.

## Guards

- **Backend**: NestJS `AuthGuard` using Passport JWT strategy. Applied to all todo endpoints.
- **Frontend**: Route guard that redirects unauthenticated users to the login page. Store JWT in localStorage for simplicity (acceptable for this POC).
