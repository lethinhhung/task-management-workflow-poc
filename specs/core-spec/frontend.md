# Frontend

## Pages

| Route       | Page         | Auth Required | Description                     |
| ----------- | ------------ | ------------- | ------------------------------- |
| `/login`    | Login        | No            | Email + password login form     |
| `/signup`   | Sign Up      | No            | Email + password registration   |
| `/todos`    | Todo List    | Yes           | Main todo management interface  |

## Login Page

- Email and password input fields.
- Submit button.
- Link to sign-up page.
- Display error messages on failed login.
- Redirect to `/todos` on success.

## Sign Up Page

- Email and password input fields.
- Submit button.
- Link to login page.
- Display validation errors.
- Redirect to `/login` on success with a success message.

## Todo List Page

- Display list of todos with title, description, and completion status.
- "Add Todo" form (title input, optional description, submit button).
- Each todo item has:
  - A checkbox to toggle completion status.
  - An edit button to modify title/description.
  - A delete button to remove the todo.
- Logout button that clears the token and redirects to `/login`.

## Architecture

- Use React Router for navigation.
- Use Axios or Fetch for API calls.
- Store JWT in localStorage.
- Include JWT in `Authorization` header for all API requests.
- Use a simple auth context/provider pattern to manage authentication state.
