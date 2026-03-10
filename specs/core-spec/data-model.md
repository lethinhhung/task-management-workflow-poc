# Data Model

## User

| Field      | Type     | Constraints                          |
| ---------- | -------- | ------------------------------------ |
| id         | UUID     | Primary key, auto-generated          |
| email      | string   | Unique, required, valid email        |
| password   | string   | Required, hashed (bcrypt), min 8 chars |
| createdAt  | datetime | Auto-generated                       |
| updatedAt  | datetime | Auto-generated                       |

## Todo

| Field       | Type     | Constraints                          |
| ----------- | -------- | ------------------------------------ |
| id          | UUID     | Primary key, auto-generated          |
| title       | string   | Required, max 255 chars              |
| description | string   | Optional, max 1000 chars             |
| completed   | boolean  | Default: false                       |
| userId      | UUID     | Foreign key → User.id, required      |
| createdAt   | datetime | Auto-generated                       |
| updatedAt   | datetime | Auto-generated                       |

## Relationships

- User has many Todos (one-to-many).
- Todo belongs to one User (many-to-one).
- Deleting a user cascades to delete all their todos.
