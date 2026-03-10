# Infrastructure

## Environment Variables

| Variable      | Description              | Example               |
| ------------- | ------------------------ | --------------------- |
| DB_HOST       | PostgreSQL host          | localhost              |
| DB_PORT       | PostgreSQL port          | 5432                   |
| DB_USERNAME   | Database user            | postgres               |
| DB_PASSWORD   | Database password        | postgres               |
| DB_NAME       | Database name            | taskmanager            |
| DB_NAME_TEST  | Test database name       | taskmanager_test       |
| JWT_SECRET    | Secret for signing JWTs  | a-strong-secret-key    |
| PORT          | Backend server port      | 3000                   |
| VITE_API_URL  | Backend API URL (frontend) | http://localhost:3000/api |

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── dto/
│   │   │       ├── signup.dto.ts
│   │   │       └── login.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.service.ts
│   │   │   └── user.entity.ts
│   │   └── todos/
│   │       ├── todos.module.ts
│   │       ├── todos.controller.ts
│   │       ├── todos.service.ts
│   │       ├── todo.entity.ts
│   │       └── dto/
│   │           ├── create-todo.dto.ts
│   │           └── update-todo.dto.ts
│   ├── test/
│   │   ├── app.e2e-spec.ts
│   │   └── jest-e2e.json
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── SignupPage.tsx
│   │   │   └── TodoListPage.tsx
│   │   └── components/
│   │       ├── ProtectedRoute.tsx
│   │       └── TodoItem.tsx
│   ├── e2e/
│   │   ├── todo-app.spec.ts
│   │   └── playwright.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── docker-compose.yml
```

## Non-Functional Requirements

- Backend responds within 200ms for all endpoints under normal load.
- Passwords are never stored in plain text.
- API returns consistent JSON error format: `{ statusCode, message, error }`.
- CORS enabled for frontend origin during development.
- Input validation using `class-validator` decorators on DTOs.
