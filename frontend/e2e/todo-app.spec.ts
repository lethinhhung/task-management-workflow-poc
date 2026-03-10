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
