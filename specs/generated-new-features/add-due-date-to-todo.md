# Feature Request: Add Due Date to Todo

## Description

Add a `dueDate` timestamp field to todos so users can set deadlines for their tasks. The due date should be optional and displayed in the UI with visual indicators for overdue items.

## Requirements

### Data Model
- Add a `dueDate` field (datetime, nullable) to the Todo entity.
- Existing todos without a due date should remain valid (field is optional).

### API
- `POST /todos` and `PATCH /todos/:id` accept an optional `dueDate` field (ISO 8601 string or null).
- `GET /todos` and `GET /todos/:id` return the `dueDate` field in responses.
- Validate that `dueDate`, if provided, is a valid ISO 8601 datetime string.

### Frontend
- Show a date picker input on the todo creation and edit forms for setting the due date.
- Display the due date next to each todo item in the list.
- Visually highlight overdue todos (due date is in the past and todo is not completed) with a red/warning style.
- Allow clearing the due date (setting it to null).

### Testing
- Backend: Test creating and updating todos with and without a due date. Test validation rejects invalid date formats.
- Frontend: Test that the date picker appears, setting a due date persists, and overdue todos are visually highlighted.
