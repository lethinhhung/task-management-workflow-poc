# Testing

## Backend E2E Tests (Jest + Supertest)

Use a separate test database. Run migrations before tests and clean up after.

### Auth Tests

1. **Signup — success**: POST `/api/auth/signup` with valid data returns `201` and user object (no password).
2. **Signup — duplicate email**: POST `/api/auth/signup` with existing email returns `409`.
3. **Signup — invalid email**: POST `/api/auth/signup` with malformed email returns `400`.
4. **Signup — short password**: POST `/api/auth/signup` with password < 8 chars returns `400`.
5. **Login — success**: POST `/api/auth/login` with valid credentials returns `200` and `accessToken`.
6. **Login — wrong password**: POST `/api/auth/login` with wrong password returns `401`.
7. **Login — nonexistent user**: POST `/api/auth/login` with unknown email returns `401`.

### Todo Tests

8. **Create todo — success**: POST `/api/todos` with valid token and body returns `201`.
9. **Create todo — no auth**: POST `/api/todos` without token returns `401`.
10. **List todos — returns own only**: GET `/api/todos` returns only the authenticated user's todos.
11. **List todos — no auth**: GET `/api/todos` without token returns `401`.
12. **Update todo — toggle completed**: PATCH `/api/todos/:id` with `{ completed: true }` returns updated todo.
13. **Update todo — not own**: PATCH `/api/todos/:id` for another user's todo returns `404`.
14. **Delete todo — success**: DELETE `/api/todos/:id` removes the todo.
15. **Delete todo — not own**: DELETE `/api/todos/:id` for another user's todo returns `404`.

### Cross-User Isolation Test

16. **Data isolation**: Create two users, each with todos. Verify each user can only see/modify their own todos.

## Frontend E2E Tests (Playwright)

Run against the full stack (backend + frontend). Use a test database.

### Happy Path Scenario

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

### Auth Guard Test

14. Navigate directly to `/todos` without logging in.
15. Verify redirect to `/login`.

### Error Display Test

16. Attempt login with invalid credentials.
17. Verify error message is displayed.
