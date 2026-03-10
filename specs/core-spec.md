# Task Management App — Core Spec

## Project Name

Task Management App (TodoAuth)

## Goal

A full-stack task management application with user authentication and authorization. Users can sign up, log in, and manage their personal todo lists. The system enforces strict data isolation — each user can only access their own todos. The project prioritizes software reliability through comprehensive E2E testing on both backend and frontend.

## Tech Stack

| Layer    | Technology         |
| -------- | ------------------ |
| Frontend | React + TypeScript |
| Backend  | NestJS + TypeScript |
| Database | PostgreSQL         |
| ORM      | TypeORM            |
| Frontend Testing | Playwright |
| Backend Testing  | Jest + Supertest |

## Data Model

### User

| Field      | Type     | Constraints                    |
| ---------- | -------- | ------------------------------ |
| id         | UUID     | Primary key, auto-generated    |
| email      | string   | Unique, required, valid email  |
| password   | string   | Required, hashed (bcrypt), min 8 chars |
| createdAt  | datetime | Auto-generated                 |
| updatedAt  | datetime | Auto-generated                 |

### Todo

| Field       | Type     | Constraints                          |
| ----------- | -------- | ------------------------------------ |
| id          | UUID     | Primary key, auto-generated          |
| title       | string   | Required, max 255 chars              |
| description | string   | Optional, max 1000 chars             |
| completed   | boolean  | Default: false                       |
| userId      | UUID     | Foreign key → User.id, required      |
| createdAt   | datetime | Auto-generated                       |
| updatedAt   | datetime | Auto-generated                       |

### Relationships

- User has many Todos (one-to-many).
- Todo belongs to one User (many-to-one).
- Deleting a user cascades to delete all their todos.

## API Design

### Authentication Endpoints

#### POST /auth/signup

Create a new user account.

- **Request Body**: `{ email: string, password: string }`
- **Validation**:
  - `email`: must be a valid email format, must not already exist.
  - `password`: minimum 8 characters.
- **Success Response**: `201 Created` — `{ id, email, createdAt }`
- **Error Responses**:
  - `400 Bad Request` — validation errors (invalid email, short password).
  - `409 Conflict` — email already registered.

#### POST /auth/login

Authenticate and receive a JWT.

- **Request Body**: `{ email: string, password: string }`
- **Success Response**: `200 OK` — `{ accessToken: string }`
- **Error Responses**:
  - `401 Unauthorized` — invalid credentials.

### Todo Endpoints

All todo endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

#### GET /todos

List all todos for the authenticated user.

- **Success Response**: `200 OK` — `Todo[]`
- **Behavior**: Returns only todos belonging to the authenticated user.

#### POST /todos

Create a new todo.

- **Request Body**: `{ title: string, description?: string }`
- **Validation**:
  - `title`: required, max 255 characters.
  - `description`: optional, max 1000 characters.
- **Success Response**: `201 Created` — `Todo`
- **Behavior**: Automatically associates the todo with the authenticated user.

#### PATCH /todos/:id

Update an existing todo.

- **Request Body**: `{ title?: string, description?: string, completed?: boolean }`
- **Success Response**: `200 OK` — `Todo`
- **Error Responses**:
  - `404 Not Found` — todo does not exist or does not belong to the user.
- **Behavior**: Users can only update their own todos.

#### DELETE /todos/:id

Delete a todo.

- **Success Response**: `200 OK` — `{ deleted: true }`
- **Error Responses**:
  - `404 Not Found` — todo does not exist or does not belong to the user.
- **Behavior**: Users can only delete their own todos.

### Global API Behavior

- All protected endpoints return `401 Unauthorized` if no valid JWT is provided.
- All validation errors return `400 Bad Request` with a descriptive message array.
- API prefix: `/api` (all routes served under `/api/auth/*` and `/api/todos/*`).

## Authentication & Authorization

### JWT Strategy

- **Algorithm**: HS256.
- **Payload**: `{ sub: userId, email: string }`.
- **Expiration**: 1 hour.
- **Secret**: Loaded from environment variable `JWT_SECRET`.

### Password Security

- Hash passwords with **bcrypt** (salt rounds: 10).
- Never return password fields in API responses.
- Never log password values.

### Guards

- **Backend**: NestJS `AuthGuard` using Passport JWT strategy. Applied to all todo endpoints.
- **Frontend**: Route guard that redirects unauthenticated users to the login page. Store JWT in memory (not localStorage for security, but acceptable for this POC — use localStorage for simplicity).

## Frontend

### Pages

| Route       | Page         | Auth Required | Description                     |
| ----------- | ------------ | ------------- | ------------------------------- |
| `/login`    | Login        | No            | Email + password login form     |
| `/signup`   | Sign Up      | No            | Email + password registration   |
| `/todos`    | Todo List    | Yes           | Main todo management interface  |

### Login Page

- Email and password input fields.
- Submit button.
- Link to sign-up page.
- Display error messages on failed login.
- Redirect to `/todos` on success.

### Sign Up Page

- Email and password input fields.
- Submit button.
- Link to login page.
- Display validation errors.
- Redirect to `/login` on success with a success message.

### Todo List Page

- Display list of todos with title, description, and completion status.
- "Add Todo" form (title input, optional description, submit button).
- Each todo item has:
  - A checkbox to toggle completion status.
  - An edit button to modify title/description.
  - A delete button to remove the todo.
- Logout button that clears the token and redirects to `/login`.

### Frontend Architecture

- Use React Router for navigation.
- Use Axios or Fetch for API calls.
- Store JWT in localStorage.
- Include JWT in `Authorization` header for all API requests.
- Use a simple auth context/provider pattern to manage authentication state.

## Testing

### Backend E2E Tests (Jest + Supertest)

Use a separate test database. Run migrations before tests and clean up after.

#### Auth Tests

1. **Signup — success**: POST `/api/auth/signup` with valid data returns `201` and user object (no password).
2. **Signup — duplicate email**: POST `/api/auth/signup` with existing email returns `409`.
3. **Signup — invalid email**: POST `/api/auth/signup` with malformed email returns `400`.
4. **Signup — short password**: POST `/api/auth/signup` with password < 8 chars returns `400`.
5. **Login — success**: POST `/api/auth/login` with valid credentials returns `200` and `accessToken`.
6. **Login — wrong password**: POST `/api/auth/login` with wrong password returns `401`.
7. **Login — nonexistent user**: POST `/api/auth/login` with unknown email returns `401`.

#### Todo Tests

8. **Create todo — success**: POST `/api/todos` with valid token and body returns `201`.
9. **Create todo — no auth**: POST `/api/todos` without token returns `401`.
10. **List todos — returns own only**: GET `/api/todos` returns only the authenticated user's todos.
11. **List todos — no auth**: GET `/api/todos` without token returns `401`.
12. **Update todo — toggle completed**: PATCH `/api/todos/:id` with `{ completed: true }` returns updated todo.
13. **Update todo — not own**: PATCH `/api/todos/:id` for another user's todo returns `404`.
14. **Delete todo — success**: DELETE `/api/todos/:id` removes the todo.
15. **Delete todo — not own**: DELETE `/api/todos/:id` for another user's todo returns `404`.

#### Cross-User Isolation Test

16. **Data isolation**: Create two users, each with todos. Verify each user can only see/modify their own todos.

### Frontend E2E Tests (Playwright)

Run against the full stack (backend + frontend). Use a test database.

#### Happy Path Scenario

1. Navigate to `/signup`.
2. Fill in email and password, submit.
3. Verify redirect to `/login`.
4. Fill in credentials, submit.
5. Verify redirect to `/todos`.
6. Create a new todo with title "Buy groceries".
7. Verify the todo appears in the list.
8. Click the checkbox to mark it as completed.
9. Verify the todo shows as completed.
10. Delete the todo.
11. Verify the todo is removed from the list.
12. Click logout.
13. Verify redirect to `/login`.

#### Auth Guard Test

14. Navigate directly to `/todos` without logging in.
15. Verify redirect to `/login`.

#### Error Display Test

16. Attempt login with invalid credentials.
17. Verify error message is displayed.

## Environment Configuration

### Environment Variables

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

### Project Structure

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
