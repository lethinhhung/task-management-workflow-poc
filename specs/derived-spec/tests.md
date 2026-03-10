# Test Specification

## Test Strategy

### Backend (Jest + Supertest)

- **Framework**: Jest with Supertest for HTTP assertions.
- **Database strategy**: Use a separate test database (`taskmanager_test`). Connect with `synchronize: true` and `dropSchema: true` so the schema is recreated fresh on each test run.
- **Setup/Teardown**: Bootstrap the full NestJS application in `beforeAll`. Close the app and database connection in `afterAll`. All tests run sequentially (`--runInBand`) to avoid database conflicts.
- **Test helpers**: Shared utility functions for creating users and obtaining auth tokens to reduce duplication across test cases.

### Frontend (Playwright)

- **Framework**: Playwright for browser-based E2E tests.
- **Server requirements**: Both backend (port 3000) and frontend (port 5173) must be running. The test database should be clean before each test run.
- **Browser config**: Run in Chromium headless by default. Configure a reasonable timeout (30 seconds per test).

## Backend Tests

### Test Setup

#### Test Database Configuration

The E2E test file bootstraps a NestJS testing module with TypeORM configured to use the test database:

```
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME_TEST || 'taskmanager_test',
  entities: [User, Todo],
  synchronize: true,
  dropSchema: true,
})
```

#### App Bootstrapping

```
let app: INestApplication;

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule], // Or construct test-specific module
  }).compile();

  app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe());
  await app.init();
});

afterAll(async () => {
  await app.close();
});
```

#### Helper Utilities

- **`signupUser(email, password)`**: POSTs to `/api/auth/signup` and returns the response.
- **`loginUser(email, password)`**: POSTs to `/api/auth/login` and returns the access token from the response body.
- **`createTodo(token, title, description?)`**: POSTs to `/api/todos` with auth header and returns the response.

### Test Suites

#### Auth (`backend/test/app.e2e-spec.ts`)

- **Test name**: Signup — success
  - **Setup**: None.
  - **Action**: POST `/api/auth/signup` with `{ email: "test@example.com", password: "password123" }`.
  - **Assertion**: Status `201`. Body contains `id` (UUID), `email` matching input, `createdAt` (ISO string). Body does NOT contain `password`.

- **Test name**: Signup — duplicate email
  - **Setup**: Sign up a user with `test-dup@example.com`.
  - **Action**: POST `/api/auth/signup` with the same email.
  - **Assertion**: Status `409`.

- **Test name**: Signup — invalid email
  - **Setup**: None.
  - **Action**: POST `/api/auth/signup` with `{ email: "not-an-email", password: "password123" }`.
  - **Assertion**: Status `400`. Body contains a validation error message.

- **Test name**: Signup — short password
  - **Setup**: None.
  - **Action**: POST `/api/auth/signup` with `{ email: "short@example.com", password: "1234567" }`.
  - **Assertion**: Status `400`. Body contains a validation error message.

- **Test name**: Login — success
  - **Setup**: Sign up a user with `login@example.com` / `password123`.
  - **Action**: POST `/api/auth/login` with `{ email: "login@example.com", password: "password123" }`.
  - **Assertion**: Status `200`. Body contains `accessToken` (non-empty string).

- **Test name**: Login — wrong password
  - **Setup**: Sign up a user with `wrongpw@example.com` / `password123`.
  - **Action**: POST `/api/auth/login` with `{ email: "wrongpw@example.com", password: "wrongpassword" }`.
  - **Assertion**: Status `401`.

- **Test name**: Login — nonexistent user
  - **Setup**: None.
  - **Action**: POST `/api/auth/login` with `{ email: "nobody@example.com", password: "password123" }`.
  - **Assertion**: Status `401`.

#### Todos (`backend/test/app.e2e-spec.ts`)

- **Test name**: Create todo — success
  - **Setup**: Sign up and log in as `todo-create@example.com`. Obtain access token.
  - **Action**: POST `/api/todos` with `Authorization: Bearer <token>` and `{ title: "Buy groceries", description: "Milk, eggs, bread" }`.
  - **Assertion**: Status `201`. Body contains `id`, `title` ("Buy groceries"), `description` ("Milk, eggs, bread"), `completed` (false), `createdAt`.

- **Test name**: Create todo — no auth
  - **Setup**: None.
  - **Action**: POST `/api/todos` with `{ title: "Unauthorized todo" }` (no Authorization header).
  - **Assertion**: Status `401`.

- **Test name**: List todos — returns own only
  - **Setup**: Sign up and log in as User A. Create 2 todos for User A. Sign up and log in as User B. Create 1 todo for User B.
  - **Action**: GET `/api/todos` with User A's token.
  - **Assertion**: Status `200`. Body is an array of length 2. All todos belong to User A.

- **Test name**: List todos — no auth
  - **Setup**: None.
  - **Action**: GET `/api/todos` (no Authorization header).
  - **Assertion**: Status `401`.

- **Test name**: Update todo — toggle completed
  - **Setup**: Sign up and log in. Create a todo (completed = false).
  - **Action**: PATCH `/api/todos/:id` with `{ completed: true }` and auth token.
  - **Assertion**: Status `200`. Body contains `completed: true`.

- **Test name**: Update todo — not own
  - **Setup**: Sign up and log in as User A, create a todo. Sign up and log in as User B.
  - **Action**: PATCH `/api/todos/:userA_todoId` with User B's token and `{ completed: true }`.
  - **Assertion**: Status `404`.

- **Test name**: Delete todo — success
  - **Setup**: Sign up and log in. Create a todo.
  - **Action**: DELETE `/api/todos/:id` with auth token.
  - **Assertion**: Status `200`. Body contains `{ deleted: true }`. Subsequent GET `/api/todos` returns empty array.

- **Test name**: Delete todo — not own
  - **Setup**: Sign up and log in as User A, create a todo. Sign up and log in as User B.
  - **Action**: DELETE `/api/todos/:userA_todoId` with User B's token.
  - **Assertion**: Status `404`.

#### Cross-User Isolation (`backend/test/app.e2e-spec.ts`)

- **Test name**: Data isolation — users can only access own todos
  - **Setup**: Sign up and log in User A (`alice@example.com`). Create 2 todos for User A ("Alice Todo 1", "Alice Todo 2"). Sign up and log in User B (`bob@example.com`). Create 1 todo for User B ("Bob Todo 1").
  - **Action**:
    1. GET `/api/todos` with User A's token.
    2. GET `/api/todos` with User B's token.
    3. PATCH User B's todo ID with User A's token.
    4. DELETE User B's todo ID with User A's token.
  - **Assertion**:
    1. User A sees 2 todos, both their own.
    2. User B sees 1 todo, their own.
    3. PATCH returns `404` (User A cannot modify User B's todo).
    4. DELETE returns `404` (User A cannot delete User B's todo).

## Frontend Tests

### Test Setup

#### Playwright Configuration (`frontend/e2e/playwright.config.ts`)

```
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../backend && npm run start:dev',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

#### Base URL and Server Requirements

- Frontend dev server must be running at `http://localhost:5173`.
- Backend must be running at `http://localhost:3000` with the test database.
- The test database should be clean or have `dropSchema`/`synchronize` enabled.

#### Helper Utilities

- **`signupAndLogin(page, email, password)`**: Navigates to `/signup`, fills form, submits, then navigates to `/login`, fills form, submits, and waits for redirect to `/todos`. Returns the email used.
- Use unique emails per test (e.g., include a timestamp or random string) to avoid conflicts.

### Test Suites

#### Happy Path (`frontend/e2e/todo-app.spec.ts`)

- **Test name**: Complete signup, login, CRUD, and logout flow
  - **Steps**:
    1. Navigate to `/signup`.
    2. Fill in email field with a unique test email.
    3. Fill in password field with `password123`.
    4. Click the submit/signup button.
    5. Verify redirect to `/login` page.
    6. Fill in email field with the same email.
    7. Fill in password field with `password123`.
    8. Click the submit/login button.
    9. Verify redirect to `/todos` page.
    10. Fill in the "Add Todo" title field with "Buy groceries".
    11. Click the add/submit button.
    12. Verify "Buy groceries" appears in the todo list.
    13. Click the checkbox next to "Buy groceries" to mark it as completed.
    14. Verify the todo shows as completed (checkbox is checked or visual indicator).
    15. Click the delete button for "Buy groceries".
    16. Verify "Buy groceries" is no longer in the todo list.
    17. Click the logout button.
    18. Verify redirect to `/login` page.
  - **Assertions**:
    - After signup: URL contains `/login`.
    - After login: URL contains `/todos`.
    - After creating todo: "Buy groceries" text is visible on page.
    - After toggling: Completion state is visually indicated.
    - After deleting: "Buy groceries" text is no longer visible.
    - After logout: URL contains `/login`.

#### Auth Guard (`frontend/e2e/todo-app.spec.ts`)

- **Test name**: Redirect to login when accessing /todos without authentication
  - **Steps**:
    1. Navigate directly to `/todos` (without logging in first).
    2. Wait for navigation to complete.
  - **Assertions**:
    - URL contains `/login` (user was redirected).
    - Login form is visible on the page.

#### Error Display (`frontend/e2e/todo-app.spec.ts`)

- **Test name**: Display error message on invalid login
  - **Steps**:
    1. Navigate to `/login`.
    2. Fill in email field with `nonexistent@example.com`.
    3. Fill in password field with `wrongpassword`.
    4. Click the submit/login button.
    5. Wait for error response.
  - **Assertions**:
    - An error message is visible on the page (e.g., text containing "unauthorized", "invalid", or "error").
    - User remains on the `/login` page (not redirected).

## Test Commands

- **Backend**: `cd backend && npm test`
  - Runs Jest E2E tests with the configuration in `test/jest-e2e.json`.
  - Requires PostgreSQL running with the `taskmanager_test` database available.
  - Tests run sequentially (`--runInBand` specified in package.json script).

- **Frontend**: `cd frontend && npx playwright test`
  - Runs Playwright tests from the `e2e/` directory.
  - Requires both backend (port 3000) and frontend dev server (port 5173) running.
  - Playwright config may auto-start servers via `webServer` configuration.
  - Run `npx playwright install` first if browsers haven't been downloaded.
