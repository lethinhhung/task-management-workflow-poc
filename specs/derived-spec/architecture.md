# Architecture

## Overview

TodoAuth is a full-stack monorepo consisting of a **NestJS backend** and a **React frontend**, communicating over a REST API. The backend serves as the API layer, handling authentication (JWT-based) and CRUD operations against a **PostgreSQL** database via **TypeORM**. The frontend is a single-page application built with React, TypeScript, and Vite, using React Router for client-side routing and an auth context for managing JWT tokens stored in localStorage.

The two projects are siblings in the repository root — `backend/` and `frontend/` — with a shared `docker-compose.yml` for the PostgreSQL database. There is no shared code package; the frontend communicates with the backend exclusively through HTTP requests to the `/api` prefix.

## Project Structure

```
project/
├── backend/
│   ├── src/
│   │   ├── main.ts                          # Application entry point, bootstrap NestJS app, enable CORS, set global prefix
│   │   ├── app.module.ts                    # Root module, imports AuthModule, UsersModule, TodosModule, TypeOrmModule
│   │   ├── auth/
│   │   │   ├── auth.module.ts               # Auth module, imports UsersModule, registers JwtModule and PassportModule
│   │   │   ├── auth.controller.ts           # Auth controller, POST /auth/signup and POST /auth/login
│   │   │   ├── auth.service.ts              # Auth service, signup logic (hash + create), login logic (validate + sign JWT)
│   │   │   ├── jwt.strategy.ts              # Passport JWT strategy, validates token and extracts user
│   │   │   ├── jwt-auth.guard.ts            # NestJS guard wrapping Passport JWT strategy
│   │   │   └── dto/
│   │   │       ├── signup.dto.ts            # DTO with class-validator: email (IsEmail), password (MinLength 8)
│   │   │       └── login.dto.ts             # DTO with class-validator: email (IsEmail), password (IsString)
│   │   ├── users/
│   │   │   ├── users.module.ts              # Users module, exports UsersService
│   │   │   ├── users.service.ts             # Users service, findByEmail, create
│   │   │   └── user.entity.ts               # TypeORM entity: id, email, password, createdAt, updatedAt
│   │   └── todos/
│   │       ├── todos.module.ts              # Todos module, imports TypeOrmModule.forFeature([Todo])
│   │       ├── todos.controller.ts          # Todos controller, CRUD endpoints with JwtAuthGuard
│   │       ├── todos.service.ts             # Todos service, CRUD operations scoped to userId
│   │       ├── todo.entity.ts               # TypeORM entity: id, title, description, completed, userId, createdAt, updatedAt
│   │       └── dto/
│   │           ├── create-todo.dto.ts       # DTO: title (IsString, MaxLength 255), description (IsOptional, MaxLength 1000)
│   │           └── update-todo.dto.ts       # DTO: PartialType of CreateTodoDto + completed (IsOptional, IsBoolean)
│   ├── test/
│   │   ├── app.e2e-spec.ts                  # E2E tests: auth and todo endpoint tests using Supertest
│   │   └── jest-e2e.json                    # Jest E2E configuration
│   ├── package.json                         # Backend dependencies and scripts
│   ├── tsconfig.json                        # TypeScript configuration for backend
│   ├── .env                                 # Environment variables (DB, JWT, PORT)
│   └── nest-cli.json                        # NestJS CLI configuration
├── frontend/
│   ├── src/
│   │   ├── main.tsx                         # React entry point, renders App into DOM
│   │   ├── App.tsx                          # Root component, sets up AuthProvider and React Router routes
│   │   ├── api/
│   │   │   └── client.ts                    # Axios instance configured with baseURL and auth interceptor
│   │   ├── context/
│   │   │   └── AuthContext.tsx              # Auth context/provider: login, logout, token state, isAuthenticated
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx                # Login form, calls POST /auth/login, stores token, redirects to /todos
│   │   │   ├── SignupPage.tsx               # Signup form, calls POST /auth/signup, redirects to /login with success message
│   │   │   └── TodoListPage.tsx             # Todo list UI: list todos, add/edit/toggle/delete todos, logout button
│   │   └── components/
│   │       ├── ProtectedRoute.tsx           # Route guard, redirects to /login if not authenticated
│   │       └── TodoItem.tsx                 # Single todo display: checkbox, title, description, edit/delete buttons
│   ├── e2e/
│   │   ├── todo-app.spec.ts                 # Playwright E2E tests: happy path, auth guard, error display
│   │   └── playwright.config.ts             # Playwright configuration
│   ├── index.html                           # Vite HTML entry point
│   ├── package.json                         # Frontend dependencies and scripts
│   ├── tsconfig.json                        # TypeScript configuration for frontend
│   └── vite.config.ts                       # Vite configuration with proxy or API URL
└── docker-compose.yml                       # PostgreSQL service for dev and test databases
```

## Modules

### Auth Module (`backend/src/auth/`)

- **Responsibility**: User registration (signup) and authentication (login). Issues JWTs upon successful login. Provides the JWT guard used by protected endpoints.
- **Location**: `backend/src/auth/`
- **Dependencies**: UsersModule (to create and look up users), `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`.
- **Exports**: `AuthService`, `JwtAuthGuard`, `JwtStrategy`.

### Users Module (`backend/src/users/`)

- **Responsibility**: User entity definition and user data access (find by email, create user).
- **Location**: `backend/src/users/`
- **Dependencies**: TypeORM (`TypeOrmModule.forFeature([User])`).
- **Exports**: `UsersService`.

### Todos Module (`backend/src/todos/`)

- **Responsibility**: CRUD operations for todos, scoped to the authenticated user. Enforces ownership — users can only access their own todos.
- **Location**: `backend/src/todos/`
- **Dependencies**: TypeORM (`TypeOrmModule.forFeature([Todo])`), Auth module (`JwtAuthGuard`).
- **Exports**: `TodosController`, `TodosService`.

### API Client (`frontend/src/api/`)

- **Responsibility**: Configures an HTTP client (Axios) with the base API URL and an interceptor that attaches the JWT from localStorage to every request.
- **Location**: `frontend/src/api/`
- **Dependencies**: `axios`.
- **Exports**: `apiClient` (configured Axios instance).

### Auth Context (`frontend/src/context/`)

- **Responsibility**: Manages authentication state (JWT token, isAuthenticated flag). Provides login/logout functions to child components via React context.
- **Location**: `frontend/src/context/`
- **Dependencies**: React, API client.
- **Exports**: `AuthProvider`, `useAuth` hook.

### Pages (`frontend/src/pages/`)

- **Responsibility**: Page-level components for login, signup, and todo list views. Each page handles its own form state, API calls, and error display.
- **Location**: `frontend/src/pages/`
- **Dependencies**: Auth context, API client, React Router.
- **Exports**: `LoginPage`, `SignupPage`, `TodoListPage`.

### Components (`frontend/src/components/`)

- **Responsibility**: Reusable UI components — `ProtectedRoute` for route guarding and `TodoItem` for rendering individual todos.
- **Location**: `frontend/src/components/`
- **Dependencies**: Auth context, React Router.
- **Exports**: `ProtectedRoute`, `TodoItem`.

## Data Flow

### Authentication Flow (Signup)

1. User fills out signup form on `SignupPage`.
2. Frontend POSTs `{ email, password }` to `/api/auth/signup`.
3. `AuthController.signup()` validates DTO, calls `AuthService.signup()`.
4. `AuthService` checks for existing email via `UsersService.findByEmail()`.
5. If email is unique, password is hashed with bcrypt (10 salt rounds), user is created via `UsersService.create()`.
6. Returns `201` with `{ id, email, createdAt }` (no password).
7. Frontend redirects to `/login` with a success message.

### Authentication Flow (Login)

1. User fills out login form on `LoginPage`.
2. Frontend POSTs `{ email, password }` to `/api/auth/login`.
3. `AuthController.login()` validates DTO, calls `AuthService.login()`.
4. `AuthService` looks up user by email, compares password with bcrypt.
5. If valid, signs a JWT with `{ sub: userId, email }` (HS256, 1h expiry).
6. Returns `200` with `{ accessToken }`.
7. Frontend stores token in localStorage via `AuthContext.login()`, redirects to `/todos`.

### Authentication Flow (Token Validation)

1. Frontend includes JWT in `Authorization: Bearer <token>` header via Axios interceptor.
2. `JwtAuthGuard` triggers `JwtStrategy.validate()`.
3. `JwtStrategy` extracts and verifies the token using `JWT_SECRET`.
4. If valid, attaches `{ userId, email }` to the request object.
5. If invalid or expired, returns `401 Unauthorized`.

### CRUD Flow (Todos)

1. **Create**: Frontend POSTs `{ title, description? }` to `/api/todos`. Controller validates DTO, calls `TodosService.create(userId, dto)`. Service creates a Todo entity with the authenticated user's ID. Returns `201` with the new todo.
2. **Read**: Frontend GETs `/api/todos`. Controller calls `TodosService.findAll(userId)`. Service queries todos where `userId` matches. Returns `200` with array of user's todos.
3. **Update**: Frontend PATCHes `/api/todos/:id` with partial body. Controller calls `TodosService.update(userId, id, dto)`. Service finds the todo by ID and userId (ownership check). If not found, returns `404`. Otherwise updates and returns `200` with updated todo.
4. **Delete**: Frontend DELETEs `/api/todos/:id`. Controller calls `TodosService.remove(userId, id)`. Service finds the todo by ID and userId (ownership check). If not found, returns `404`. Otherwise deletes and returns `200` with `{ deleted: true }`.

### Frontend-to-Backend Communication Pattern

- All API requests go through the centralized Axios client (`frontend/src/api/client.ts`).
- The Axios instance is configured with `baseURL` set to the `VITE_API_URL` environment variable (e.g., `http://localhost:3000/api`).
- A request interceptor reads the JWT from localStorage and attaches it as `Authorization: Bearer <token>`.
- Responses are consumed directly by page components. Errors are caught and displayed as user-facing messages.
- On `401` responses (expired/invalid token), the frontend logs the user out and redirects to `/login`.

## External Dependencies

### Backend

| Package              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `@nestjs/core`       | NestJS framework core                            |
| `@nestjs/common`     | Common NestJS decorators and utilities            |
| `@nestjs/platform-express` | Express HTTP adapter for NestJS              |
| `@nestjs/typeorm`    | TypeORM integration for NestJS                    |
| `typeorm`            | ORM for PostgreSQL database access                |
| `pg`                 | PostgreSQL driver for Node.js                     |
| `@nestjs/jwt`        | JWT utilities for NestJS                          |
| `@nestjs/passport`   | Passport integration for NestJS                   |
| `passport`           | Authentication middleware                         |
| `passport-jwt`       | JWT strategy for Passport                         |
| `bcrypt`             | Password hashing (salt rounds: 10)                |
| `class-validator`    | DTO validation decorators                         |
| `class-transformer`  | DTO transformation (used with class-validator)     |
| `@nestjs/config`     | Environment variable configuration                |

### Backend (Dev Dependencies)

| Package              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `@nestjs/cli`        | NestJS CLI for building and running               |
| `@nestjs/testing`    | Testing utilities for NestJS                      |
| `jest`               | Test runner                                       |
| `ts-jest`            | TypeScript preprocessor for Jest                  |
| `supertest`          | HTTP assertion library for E2E tests              |
| `@types/jest`        | TypeScript types for Jest                         |
| `@types/supertest`   | TypeScript types for Supertest                    |
| `@types/bcrypt`      | TypeScript types for bcrypt                       |
| `@types/passport-jwt`| TypeScript types for passport-jwt                 |
| `typescript`         | TypeScript compiler                               |
| `ts-node`            | TypeScript execution for Node.js                  |

### Frontend

| Package              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `react`              | UI library                                        |
| `react-dom`          | React DOM rendering                               |
| `react-router-dom`   | Client-side routing                               |
| `axios`              | HTTP client for API communication                 |

### Frontend (Dev Dependencies)

| Package              | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `vite`               | Build tool and dev server                         |
| `@vitejs/plugin-react` | Vite plugin for React                          |
| `typescript`         | TypeScript compiler                               |
| `@types/react`       | TypeScript types for React                        |
| `@types/react-dom`   | TypeScript types for React DOM                    |
| `@playwright/test`   | Playwright E2E testing framework                  |
