import { test, expect } from '@playwright/test';

function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function signupAndLogin(page: import('@playwright/test').Page, email: string, password: string) {
  // Signup
  await page.goto('/signup');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/login');

  // Login
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/todos');
}

test.describe('Happy Path', () => {
  test('Complete signup, login, CRUD, and logout flow', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'password123';

    // Signup
    await page.goto('/signup');
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/login/);

    // Login
    await page.fill('#email', email);
    await page.fill('#password', password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/todos/);

    // Create todo
    await page.fill('[data-testid="new-todo-title"]', 'Buy groceries');
    await page.click('[data-testid="add-todo"]');
    await expect(page.getByText('Buy groceries')).toBeVisible();

    // Toggle completed
    await page.locator('input[type="checkbox"]').first().click();
    await expect(page.locator('input[type="checkbox"]').first()).toBeChecked();

    // Delete todo
    await page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.getByText('Buy groceries')).not.toBeVisible();

    // Logout
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Auth Guard', () => {
  test('Redirect to login when accessing /todos without authentication', async ({ page }) => {
    await page.goto('/todos');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('form')).toBeVisible();
  });
});

test.describe('Due Date', () => {
  test('Set due date when creating a todo', async ({ page }) => {
    const email = uniqueEmail();
    await signupAndLogin(page, email, 'password123');

    await page.fill('[data-testid="new-todo-title"]', 'Task with deadline');
    await page.fill('[data-testid="new-todo-due-date"]', '2026-04-15');
    await page.click('[data-testid="add-todo"]');

    await expect(page.getByText('Task with deadline')).toBeVisible();
    await expect(page.getByText(/Due:.*4\/15\/2026/)).toBeVisible();
  });

  test('Create todo without due date shows no due date text', async ({ page }) => {
    const email = uniqueEmail();
    await signupAndLogin(page, email, 'password123');

    await page.fill('[data-testid="new-todo-title"]', 'No deadline task');
    await page.click('[data-testid="add-todo"]');

    await expect(page.getByText('No deadline task')).toBeVisible();
    const todoItem = page.locator('div', { hasText: 'No deadline task' }).first();
    await expect(todoItem.getByText(/^Due:/)).not.toBeVisible();
  });

  test('Overdue todo is visually highlighted', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupAndLogin(page, email, 'password123');

    // Create a todo with a past due date via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email, password: 'password123' },
    });
    const { accessToken } = await loginRes.json();
    await request.post('http://localhost:3000/api/todos', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: 'Overdue task', dueDate: '2025-01-01T00:00:00.000Z' },
    });

    await page.reload();
    await expect(page.getByText('Overdue task')).toBeVisible();
    await expect(page.locator('[data-testid="overdue-indicator"]')).toBeVisible();
  });

  test('Completed todo with past due date is NOT shown as overdue', async ({ page, request }) => {
    const email = uniqueEmail();
    await signupAndLogin(page, email, 'password123');

    // Create a todo with a past due date via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email, password: 'password123' },
    });
    const { accessToken } = await loginRes.json();
    const createRes = await request.post('http://localhost:3000/api/todos', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { title: 'Past but done', dueDate: '2025-01-01T00:00:00.000Z' },
    });
    const todo = await createRes.json();

    await page.reload();
    await expect(page.getByText('Past but done')).toBeVisible();

    // Mark as completed
    await page.locator(`[data-testid="toggle-${todo.id}"]`).click();
    await expect(page.locator(`[data-testid="toggle-${todo.id}"]`)).toBeChecked();

    // Overdue indicator should NOT be present
    await expect(page.locator('[data-testid="overdue-indicator"]')).not.toBeVisible();
  });

  test('Edit todo to set and clear due date', async ({ page }) => {
    const email = uniqueEmail();
    await signupAndLogin(page, email, 'password123');

    // Create todo without due date
    await page.fill('[data-testid="new-todo-title"]', 'Edit due date test');
    await page.click('[data-testid="add-todo"]');
    await expect(page.getByText('Edit due date test')).toBeVisible();

    // Edit — set due date
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.fill('[data-testid="edit-due-date"]', '2026-06-01');
    await page.click('[data-testid="save-edit"]');
    await expect(page.getByText(/Due:.*6\/1\/2026/)).toBeVisible();

    // Edit — clear due date
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.fill('[data-testid="edit-due-date"]', '');
    await page.click('[data-testid="save-edit"]');
    const todoItem = page.locator('div', { hasText: 'Edit due date test' }).first();
    await expect(todoItem.getByText(/^Due:/)).not.toBeVisible();
  });
});

test.describe('Error Display', () => {
  test('Display error message on invalid login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'nonexistent@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });
});
