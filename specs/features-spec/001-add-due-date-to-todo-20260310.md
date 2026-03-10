# Feature Spec: Add Due Date to Todo

## Goal

Add an optional `dueDate` timestamp field to todos so users can set deadlines. The due date is displayed in the UI with visual indicators for overdue (past due and not completed) items.

## Requirements

### Functional Requirements

1. Users can optionally set a due date when creating a todo.
2. Users can add, change, or clear a due date when editing a todo.
3. The due date is displayed next to each todo item in the list.
4. Todos that are overdue (due date in the past AND not completed) are visually highlighted with a red/warning style.
5. Completed todos are never shown as overdue regardless of due date.
6. Existing todos without a due date remain fully functional (field is nullable).

### Non-Functional Requirements

1. The `dueDate` field uses ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`) for API communication.
2. Invalid date formats are rejected by backend validation with a `400` response.
3. The frontend uses a native HTML date picker (`<input type="date">`) — no new dependencies.

## Data Model Changes

### Entity: `Todo` (`backend/src/todos/todo.entity.ts`)

Add one column to the existing `Todo` entity:

| Field     | Type        | Column Definition                                    | Default |
| --------- | ----------- | ---------------------------------------------------- | ------- |
| `dueDate` | `Date \| null` | `@Column({ type: 'timestamp', nullable: true, default: null })` | `null`  |

The field is placed after `completed` and before `userId` in the entity class.

Since `synchronize: true` is enabled in development, TypeORM auto-migrates the schema. No manual migration is needed.

## API Changes

### POST `/api/todos` — Create Todo

**Request body** (updated):

```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "dueDate": "2026-03-15T00:00:00.000Z"
}
```

- `dueDate` is optional. Omitting it or passing `null` creates a todo with no due date.
- If provided, must be a valid ISO 8601 datetime string. Invalid formats return `400`.

**Response body** (updated — new field added):

```json
{
  "id": "uuid",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "dueDate": "2026-03-15T00:00:00.000Z",
  "createdAt": "2026-03-10T...",
  "updatedAt": "2026-03-10T..."
}
```

### PATCH `/api/todos/:id` — Update Todo

**Request body** (updated):

```json
{
  "dueDate": "2026-03-20T00:00:00.000Z"
}
```

- Accepts `dueDate` as an optional field (same validation as create).
- Passing `null` explicitly clears the due date.

**Response body**: Same shape as create response, with updated `dueDate`.

### GET `/api/todos` and GET `/api/todos/:id`

**Response body**: Same shape as above. The `dueDate` field is always present in the response (value is `null` when not set).

## Frontend Changes

### Todo Interface (`frontend/src/pages/TodoListPage.tsx`)

Update the `Todo` interface:

```typescript
interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;    // <-- new field
  createdAt: string;
}
```

### TodoListPage (`frontend/src/pages/TodoListPage.tsx`)

1. **Add todo form**: Add a date input (`<input type="date">`) below the existing description input. Label: "Due Date". The input is optional — an empty value means no due date.
2. **State**: Add a `newDueDate` state variable (string, default `''`).
3. **`handleAddTodo()`**: Include `dueDate` in the POST payload. Convert the date input value (`YYYY-MM-DD`) to ISO 8601 (`new Date(value).toISOString()`) when non-empty, or `null` when empty.
4. **`handleEdit()`**: Update signature to accept `dueDate` parameter: `handleEdit(id: string, title: string, description: string, dueDate: string | null)`. Include `dueDate` in the PATCH payload.
5. **Clear the `newDueDate` state** after successful todo creation (same as title/description).
6. **Pass `dueDate`-related props** to `TodoItem` component.

### TodoItem (`frontend/src/components/TodoItem.tsx`)

1. **Props**: Update `onEdit` callback signature to include `dueDate`:
   ```typescript
   onEdit: (id: string, title: string, description: string, dueDate: string | null) => void;
   ```

2. **Display due date**: Below the title/description, show the formatted due date when present. Format as locale date string (e.g., `new Date(todo.dueDate).toLocaleDateString()`). Prefix with "Due: ".

3. **Overdue indicator**: When `todo.dueDate` is set, `new Date(todo.dueDate) < new Date()`, and `todo.completed` is `false`, apply a CSS class or inline style:
   - Red text color or red background tint on the todo item.
   - Add a `data-testid="overdue-indicator"` attribute for test targeting.

4. **Edit mode**: Add a date input (`<input type="date">`) to the edit form, pre-populated with the existing due date (converted from ISO to `YYYY-MM-DD` for the input value). Allow clearing by emptying the input.

5. **`handleSave()`**: Pass the edited `dueDate` value to `onEdit`. Convert empty string to `null`.

## Implementation Steps

### Step 1: Backend — Update Todo Entity

**File**: `backend/src/todos/todo.entity.ts`

Add after the `completed` column:

```typescript
@Column({ type: 'timestamp', nullable: true, default: null })
dueDate: Date | null;
```

### Step 2: Backend — Update CreateTodoDto

**File**: `backend/src/todos/dto/create-todo.dto.ts`

Add the `dueDate` field with validation:

```typescript
import { IsOptional, IsISO8601 } from 'class-validator';

@IsOptional()
@IsISO8601({ strict: false }, { message: 'dueDate must be a valid ISO 8601 date string' })
dueDate?: string;
```

### Step 3: Backend — Update UpdateTodoDto

**File**: `backend/src/todos/dto/update-todo.dto.ts`

The `dueDate` field is inherited from `CreateTodoDto` via `PartialType`. No changes needed unless clearing (`null`) must be explicitly allowed.

Add explicit handling for `null`:

```typescript
@IsOptional()
@ValidateIf((o) => o.dueDate !== null)
@IsISO8601({ strict: false }, { message: 'dueDate must be a valid ISO 8601 date string or null' })
dueDate?: string | null;
```

This allows `null` to pass validation (for clearing) while still validating non-null values.

### Step 4: Backend — Verify TodosService

**File**: `backend/src/todos/todos.service.ts`

No changes required. The `create` method uses spread (`{ ...dto, userId }`), and `update` uses `Object.assign(todo, dto)` — both naturally pick up the new `dueDate` field from the DTO.

### Step 5: Backend — Verify TodosController

**File**: `backend/src/todos/todos.controller.ts`

No changes required. Endpoints already pass DTOs through to the service and return the full entity.

### Step 6: Frontend — Update Todo Interface and TodoListPage

**File**: `frontend/src/pages/TodoListPage.tsx`

1. Add `dueDate: string | null` to `Todo` interface.
2. Add `newDueDate` state (`useState<string>('')`).
3. Add date input to the create form.
4. Update `handleAddTodo` to include `dueDate` in POST body.
5. Update `handleEdit` to accept and forward `dueDate`.
6. Pass updated `onEdit` to `TodoItem`.

### Step 7: Frontend — Update TodoItem Component

**File**: `frontend/src/components/TodoItem.tsx`

1. Update `onEdit` prop type to include `dueDate`.
2. Add `editDueDate` state for edit mode.
3. Display formatted due date when present.
4. Apply overdue styling (red color, `data-testid="overdue-indicator"`).
5. Add date input to edit form.
6. Pass `dueDate` in save handler.

### Step 8: Backend — Add E2E Tests

**File**: `backend/test/app.e2e-spec.ts`

Add new test cases to the existing Todos test suite (details below).

### Step 9: Frontend — Add E2E Tests

**File**: `frontend/e2e/todo-app.spec.ts`

Add new test cases for due date functionality (details below).

## Test Cases

### Backend E2E Tests (`backend/test/app.e2e-spec.ts`)

Add these tests inside the existing Todos `describe` block:

---

**Test name**: Create todo with due date

- **Setup**: Sign up and log in. Obtain access token.
- **Action**: POST `/api/todos` with `{ title: "Deadline task", dueDate: "2026-04-01T00:00:00.000Z" }` and auth header.
- **Assertion**: Status `201`. Body contains `dueDate` equal to `"2026-04-01T00:00:00.000Z"`. Body contains `title` equal to `"Deadline task"`.

---

**Test name**: Create todo without due date — dueDate is null

- **Setup**: Sign up and log in. Obtain access token.
- **Action**: POST `/api/todos` with `{ title: "No deadline" }` (no `dueDate` field) and auth header.
- **Assertion**: Status `201`. Body contains `dueDate` equal to `null`.

---

**Test name**: Update todo — set due date

- **Setup**: Sign up and log in. Create a todo without a due date.
- **Action**: PATCH `/api/todos/:id` with `{ dueDate: "2026-05-01T00:00:00.000Z" }` and auth header.
- **Assertion**: Status `200`. Body contains `dueDate` equal to `"2026-05-01T00:00:00.000Z"`.

---

**Test name**: Update todo — clear due date

- **Setup**: Sign up and log in. Create a todo with `dueDate: "2026-05-01T00:00:00.000Z"`.
- **Action**: PATCH `/api/todos/:id` with `{ dueDate: null }` and auth header.
- **Assertion**: Status `200`. Body contains `dueDate` equal to `null`.

---

**Test name**: Create todo — invalid dueDate format rejected

- **Setup**: Sign up and log in. Obtain access token.
- **Action**: POST `/api/todos` with `{ title: "Bad date", dueDate: "not-a-date" }` and auth header.
- **Assertion**: Status `400`. Body contains validation error message mentioning `dueDate`.

---

**Test name**: Create todo — invalid dueDate format (partial date) rejected

- **Setup**: Sign up and log in. Obtain access token.
- **Action**: POST `/api/todos` with `{ title: "Bad date 2", dueDate: "2026-13-01" }` and auth header.
- **Assertion**: Status `400`. Body contains validation error message.

---

**Test name**: Update todo — invalid dueDate format rejected

- **Setup**: Sign up and log in. Create a todo.
- **Action**: PATCH `/api/todos/:id` with `{ dueDate: "yesterday" }` and auth header.
- **Assertion**: Status `400`. Body contains validation error message.

---

**Test name**: List todos returns dueDate field

- **Setup**: Sign up and log in. Create one todo with `dueDate: "2026-06-01T00:00:00.000Z"` and one todo without dueDate.
- **Action**: GET `/api/todos` with auth header.
- **Assertion**: Status `200`. Body is array of length 2. One todo has `dueDate` set, the other has `dueDate: null`. Both have all existing fields.

### Frontend E2E Tests (`frontend/e2e/todo-app.spec.ts`)

Add a new `describe` block for due date functionality:

---

**Test name**: Set due date when creating a todo

- **Steps**:
  1. Sign up and log in (using helper or inline).
  2. Fill in the title field with "Task with deadline".
  3. Fill in the due date input with "2026-04-15".
  4. Click the add/submit button.
  5. Verify "Task with deadline" appears in the todo list.
  6. Verify "Due:" text with formatted date (containing "4/15/2026" or "Apr 15" depending on locale) is visible.
- **Assertions**:
  - Todo appears in list.
  - Due date text is displayed near the todo.

---

**Test name**: Create todo without due date shows no due date text

- **Steps**:
  1. Sign up and log in.
  2. Fill in the title field with "No deadline task".
  3. Leave the due date input empty.
  4. Click the add/submit button.
  5. Verify "No deadline task" appears in the list.
- **Assertions**:
  - Todo appears in list.
  - No "Due:" text is associated with this todo.

---

**Test name**: Overdue todo is visually highlighted

- **Steps**:
  1. Sign up and log in.
  2. Create a todo via API (or UI) with a due date in the past (e.g., "2025-01-01") and `completed: false`.
  3. Navigate to `/todos` or refresh.
  4. Locate the todo in the list.
- **Assertions**:
  - The todo item has `data-testid="overdue-indicator"` present (or a visible red/warning style).
  - The overdue visual indicator is visible.

---

**Test name**: Completed todo with past due date is NOT shown as overdue

- **Steps**:
  1. Sign up and log in.
  2. Create a todo with a past due date.
  3. Mark the todo as completed (click checkbox).
  4. Verify the todo shows as completed.
- **Assertions**:
  - The `data-testid="overdue-indicator"` is NOT present on the completed todo.

---

**Test name**: Edit todo to set and clear due date

- **Steps**:
  1. Sign up and log in.
  2. Create a todo without a due date.
  3. Click edit on the todo.
  4. Set the due date input to "2026-06-01".
  5. Click save.
  6. Verify the due date is now displayed.
  7. Click edit again.
  8. Clear the due date input.
  9. Click save.
  10. Verify the due date is no longer displayed.
- **Assertions**:
  - After setting: "Due:" text with date is visible.
  - After clearing: "Due:" text is no longer associated with the todo.
