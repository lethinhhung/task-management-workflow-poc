# API Design

## Authentication Endpoints

### POST /auth/signup

Create a new user account.

- **Request Body**: `{ email: string, password: string }`
- **Validation**:
  - `email`: must be a valid email format, must not already exist.
  - `password`: minimum 8 characters.
- **Success Response**: `201 Created` — `{ id, email, createdAt }`
- **Error Responses**:
  - `400 Bad Request` — validation errors (invalid email, short password).
  - `409 Conflict` — email already registered.

### POST /auth/login

Authenticate and receive a JWT.

- **Request Body**: `{ email: string, password: string }`
- **Success Response**: `200 OK` — `{ accessToken: string }`
- **Error Responses**:
  - `401 Unauthorized` — invalid credentials.

## Todo Endpoints

All todo endpoints require a valid JWT in the `Authorization: Bearer <token>` header.

### GET /todos

List all todos for the authenticated user.

- **Success Response**: `200 OK` — `Todo[]`
- **Behavior**: Returns only todos belonging to the authenticated user.

### POST /todos

Create a new todo.

- **Request Body**: `{ title: string, description?: string }`
- **Validation**:
  - `title`: required, max 255 characters.
  - `description`: optional, max 1000 characters.
- **Success Response**: `201 Created` — `Todo`
- **Behavior**: Automatically associates the todo with the authenticated user.

### PATCH /todos/:id

Update an existing todo.

- **Request Body**: `{ title?: string, description?: string, completed?: boolean }`
- **Success Response**: `200 OK` — `Todo`
- **Error Responses**:
  - `404 Not Found` — todo does not exist or does not belong to the user.
- **Behavior**: Users can only update their own todos.

### DELETE /todos/:id

Delete a todo.

- **Success Response**: `200 OK` — `{ deleted: true }`
- **Error Responses**:
  - `404 Not Found` — todo does not exist or does not belong to the user.
- **Behavior**: Users can only delete their own todos.

## Global API Behavior

- All protected endpoints return `401 Unauthorized` if no valid JWT is provided.
- All validation errors return `400 Bad Request` with a descriptive message array.
- API prefix: `/api` (all routes served under `/api/auth/*` and `/api/todos/*`).
