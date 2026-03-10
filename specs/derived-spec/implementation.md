# Implementation Plan

## Setup

### Package Initialization

Two separate `package.json` files — one for `backend/` and one for `frontend/`. No root-level package.json or workspace configuration.

### TypeScript Configuration

Both projects use TypeScript with strict mode. Backend uses CommonJS modules (NestJS default). Frontend uses ES modules (Vite default).

### Environment Configuration

- Backend reads `.env` via `@nestjs/config` (`ConfigModule.forRoot()`).
- Frontend reads `VITE_API_URL` via Vite's built-in env handling (`import.meta.env.VITE_API_URL`).
- PostgreSQL runs via Docker Compose with two databases: `taskmanager` (dev) and `taskmanager_test` (test).

### Build Tool Configuration

- Backend: NestJS CLI (`nest build`, `nest start`).
- Frontend: Vite (`vite dev`, `vite build`).

## Implementation Order

1. **Docker Compose and environment setup** — Create `docker-compose.yml` for PostgreSQL service and `backend/.env` with all environment variables.
   - **Files**: `docker-compose.yml`, `backend/.env`
   - **Depends on**: Nothing.
   - **Key details**: PostgreSQL container exposes port 5432. Create both `taskmanager` and `taskmanager_test` databases. Use the `postgres` image with environment variables for user/password/db.

2. **Backend project scaffold** — Initialize the backend with NestJS configuration files, entry point, and root module.
   - **Files**: `backend/package.json`, `backend/tsconfig.json`, `backend/nest-cli.json`, `backend/src/main.ts`, `backend/src/app.module.ts`
   - **Depends on**: Step 1.
   - **Key details**: `main.ts` enables CORS (allow all origins for POC), sets global prefix `api`, enables validation pipe globally (`new ValidationPipe()`). `app.module.ts` imports `ConfigModule.forRoot()` and `TypeOrmModule.forRoot()` with database config from environment. Enable `synchronize: true` for auto-migration in development.

3. **User entity and module** — Define the User entity and UsersService with `findByEmail` and `create` methods.
   - **Files**: `backend/src/users/user.entity.ts`, `backend/src/users/users.service.ts`, `backend/src/users/users.module.ts`
   - **Depends on**: Step 2.
   - **Key details**: User entity uses `@PrimaryGeneratedColumn('uuid')` for ID. Email has `@Column({ unique: true })`. Password column is a plain string (stores bcrypt hash). Timestamps use `@CreateDateColumn()` and `@UpdateDateColumn()`. UsersModule exports `UsersService`.

4. **Auth module — signup and login** — Implement authentication with JWT, bcrypt password hashing, and DTOs with validation.
   - **Files**: `backend/src/auth/auth.module.ts`, `backend/src/auth/auth.controller.ts`, `backend/src/auth/auth.service.ts`, `backend/src/auth/jwt.strategy.ts`, `backend/src/auth/jwt-auth.guard.ts`, `backend/src/auth/dto/signup.dto.ts`, `backend/src/auth/dto/login.dto.ts`
   - **Depends on**: Step 3.
   - **Key details**: `AuthModule` imports `UsersModule`, `PassportModule`, and `JwtModule.registerAsync()` (loads secret and expiry from config). `AuthService.signup()` hashes password with bcrypt (10 rounds), checks for duplicate email (throws `ConflictException`), creates user, returns user without password. `AuthService.login()` validates credentials and returns signed JWT. `JwtStrategy` extracts `sub` and `email` from payload, attaches `{ userId: sub, email }` to request. DTOs use `@IsEmail()`, `@IsString()`, `@MinLength(8)` from class-validator.

5. **Todo entity and module** — Define the Todo entity and TodosService with CRUD operations scoped to userId.
   - **Files**: `backend/src/todos/todo.entity.ts`, `backend/src/todos/todos.service.ts`, `backend/src/todos/todos.module.ts`, `backend/src/todos/todos.controller.ts`, `backend/src/todos/dto/create-todo.dto.ts`, `backend/src/todos/dto/update-todo.dto.ts`
   - **Depends on**: Step 4.
   - **Key details**: Todo entity has `@ManyToOne(() => User, { onDelete: 'CASCADE' })` relation. `completed` defaults to `false`. Controller applies `@UseGuards(JwtAuthGuard)` to all endpoints. Controller extracts `userId` from `@Request()` decorator (`req.user.userId`). `TodosService.findAll(userId)` filters by userId. `update` and `remove` first find by both `id` and `userId` — return `NotFoundException` if not found (enforces ownership). `UpdateTodoDto` uses `PartialType(CreateTodoDto)` and adds optional `completed: boolean`.

6. **Backend E2E test setup and tests** — Configure Jest for E2E testing and write all backend test cases.
   - **Files**: `backend/test/jest-e2e.json`, `backend/test/app.e2e-spec.ts`
   - **Depends on**: Step 5.
   - **Key details**: Use test database (`DB_NAME_TEST`). Bootstrap NestJS app in `beforeAll`, close in `afterAll`. Use `TypeOrmModule` with `synchronize: true` and `dropSchema: true` to reset DB per test run. Helper functions: `signupUser(email, password)`, `loginUser(email, password)` returning access token. Test all 16 cases from the testing spec.

7. **Frontend project scaffold** — Initialize the React project with Vite, configure routing and the auth context.
   - **Files**: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/api/client.ts`, `frontend/src/context/AuthContext.tsx`
   - **Depends on**: Step 1 (for API URL config).
   - **Key details**: `vite.config.ts` uses `@vitejs/plugin-react`. `client.ts` creates an Axios instance with `baseURL` from `import.meta.env.VITE_API_URL`. Request interceptor reads token from localStorage. Response interceptor handles 401 by clearing token and redirecting to `/login`. `AuthContext` provides `token`, `isAuthenticated`, `login(token)`, `logout()`. `App.tsx` wraps routes in `AuthProvider` and `BrowserRouter`.

8. **Frontend pages and components** — Build the login, signup, and todo list pages plus shared components.
   - **Files**: `frontend/src/pages/LoginPage.tsx`, `frontend/src/pages/SignupPage.tsx`, `frontend/src/pages/TodoListPage.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/components/TodoItem.tsx`
   - **Depends on**: Step 7.
   - **Key details**: `ProtectedRoute` checks `isAuthenticated` from context — redirects to `/login` if false. `LoginPage` shows email/password form, calls `/auth/login`, stores token via context, redirects to `/todos`. `SignupPage` shows email/password form, calls `/auth/signup`, redirects to `/login` with success message. `TodoListPage` fetches todos on mount, provides add/edit/toggle/delete functionality. `TodoItem` renders checkbox, title, description, edit button, delete button.

9. **Frontend E2E tests (Playwright)** — Configure Playwright and write all frontend test cases.
   - **Files**: `frontend/e2e/playwright.config.ts`, `frontend/e2e/todo-app.spec.ts`
   - **Depends on**: Step 8.
   - **Key details**: Playwright config sets `baseURL` to `http://localhost:5173` (Vite default). Tests require both backend and frontend running. Configure `webServer` in Playwright config if needed. Test the happy path (signup → login → CRUD → logout), auth guard (direct nav to /todos redirects to /login), and error display (invalid login shows error).

## Configuration Files

### `backend/package.json`

```json
{
  "name": "task-management-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest --config ./test/jest-e2e.json --runInBand"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "bcrypt": "^5.1.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "pg": "^8.11.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0",
    "typeorm": "^0.3.17"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/jest": "^29.5.0",
    "@types/passport-jwt": "^3.0.9",
    "@types/supertest": "^2.0.12",
    "jest": "^29.5.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.0",
    "typescript": "^5.1.0"
  }
}
```

### `frontend/package.json`

```json
{
  "name": "task-management-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "npx playwright test"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.1.0",
    "vite": "^5.0.0"
  }
}
```

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

### `backend/nest-cli.json`

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
```

### `docker-compose.yml`

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: taskmanager
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql

volumes:
  pgdata:
```

### `init-test-db.sql`

```sql
CREATE DATABASE taskmanager_test;
```

### `backend/.env`

```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=taskmanager
DB_NAME_TEST=taskmanager_test
JWT_SECRET=a-strong-secret-key-change-in-production
PORT=3000
```

### `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TodoAuth</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Environment Variables

| Variable       | Type   | Default                        | Used By   | Description                              |
| -------------- | ------ | ------------------------------ | --------- | ---------------------------------------- |
| `DB_HOST`      | string | `localhost`                    | Backend   | PostgreSQL host                          |
| `DB_PORT`      | number | `5432`                         | Backend   | PostgreSQL port                          |
| `DB_USERNAME`  | string | `postgres`                     | Backend   | PostgreSQL user                          |
| `DB_PASSWORD`  | string | `postgres`                     | Backend   | PostgreSQL password                      |
| `DB_NAME`      | string | `taskmanager`                  | Backend   | Development database name                |
| `DB_NAME_TEST` | string | `taskmanager_test`             | Backend   | Test database name (used in E2E tests)   |
| `JWT_SECRET`   | string | `a-strong-secret-key-change-in-production` | Backend | Secret for signing/verifying JWTs |
| `PORT`         | number | `3000`                         | Backend   | Backend HTTP server port                 |
| `VITE_API_URL` | string | `http://localhost:3000/api`    | Frontend  | Backend API base URL for Axios client    |
