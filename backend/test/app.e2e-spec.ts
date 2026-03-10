import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { TodosModule } from '../src/todos/todos.module';
import { User } from '../src/users/user.entity';
import { Todo } from '../src/todos/todo.entity';

describe('App E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME_TEST || 'taskmanager_test',
          entities: [User, Todo],
          synchronize: true,
          dropSchema: true,
        }),
        AuthModule,
        UsersModule,
        TodosModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper functions
  const signupUser = (email: string, password: string) =>
    request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email, password });

  const loginUser = async (email: string, password: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
    return res.body.accessToken;
  };

  const createTodo = (token: string, title: string, description?: string, dueDate?: string) =>
    request(app.getHttpServer())
      .post('/api/todos')
      .set('Authorization', `Bearer ${token}`)
      .send({ title, description, dueDate });

  // Auth Tests
  describe('Auth', () => {
    it('Signup — success', async () => {
      const res = await signupUser('test@example.com', 'password123');
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.createdAt).toBeDefined();
      expect(res.body.password).toBeUndefined();
    });

    it('Signup — duplicate email', async () => {
      await signupUser('test-dup@example.com', 'password123');
      const res = await signupUser('test-dup@example.com', 'password123');
      expect(res.status).toBe(409);
    });

    it('Signup — invalid email', async () => {
      const res = await signupUser('not-an-email', 'password123');
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('Signup — short password', async () => {
      const res = await signupUser('short@example.com', '1234567');
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('Login — success', async () => {
      await signupUser('login@example.com', 'password123');
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
    });

    it('Login — wrong password', async () => {
      await signupUser('wrongpw@example.com', 'password123');
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'wrongpw@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('Login — nonexistent user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' });
      expect(res.status).toBe(401);
    });
  });

  // Todos Tests
  describe('Todos', () => {
    it('Create todo — success', async () => {
      await signupUser('todo-create@example.com', 'password123');
      const token = await loginUser('todo-create@example.com', 'password123');

      const res = await createTodo(token, 'Buy groceries', 'Milk, eggs, bread');
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('Buy groceries');
      expect(res.body.description).toBe('Milk, eggs, bread');
      expect(res.body.completed).toBe(false);
      expect(res.body.createdAt).toBeDefined();
    });

    it('Create todo — no auth', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/todos')
        .send({ title: 'Unauthorized todo' });
      expect(res.status).toBe(401);
    });

    it('List todos — returns own only', async () => {
      await signupUser('list-a@example.com', 'password123');
      const tokenA = await loginUser('list-a@example.com', 'password123');
      await createTodo(tokenA, 'A Todo 1');
      await createTodo(tokenA, 'A Todo 2');

      await signupUser('list-b@example.com', 'password123');
      const tokenB = await loginUser('list-b@example.com', 'password123');
      await createTodo(tokenB, 'B Todo 1');

      const res = await request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.every((t: any) => t.title.startsWith('A Todo'))).toBe(true);
    });

    it('List todos — no auth', async () => {
      const res = await request(app.getHttpServer()).get('/api/todos');
      expect(res.status).toBe(401);
    });

    it('Update todo — toggle completed', async () => {
      await signupUser('toggle@example.com', 'password123');
      const token = await loginUser('toggle@example.com', 'password123');
      const createRes = await createTodo(token, 'Toggle me');

      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });
      expect(res.status).toBe(200);
      expect(res.body.completed).toBe(true);
    });

    it('Update todo — not own', async () => {
      await signupUser('owner-update@example.com', 'password123');
      const tokenA = await loginUser('owner-update@example.com', 'password123');
      const createRes = await createTodo(tokenA, 'Owner A todo');

      await signupUser('intruder-update@example.com', 'password123');
      const tokenB = await loginUser('intruder-update@example.com', 'password123');

      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ completed: true });
      expect(res.status).toBe(404);
    });

    it('Delete todo — success', async () => {
      await signupUser('delete@example.com', 'password123');
      const token = await loginUser('delete@example.com', 'password123');
      const createRes = await createTodo(token, 'Delete me');

      const res = await request(app.getHttpServer())
        .delete(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);

      const listRes = await request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);
      expect(listRes.body).toHaveLength(0);
    });

    it('Delete todo — not own', async () => {
      await signupUser('owner-delete@example.com', 'password123');
      const tokenA = await loginUser('owner-delete@example.com', 'password123');
      const createRes = await createTodo(tokenA, 'Owner A delete');

      await signupUser('intruder-delete@example.com', 'password123');
      const tokenB = await loginUser('intruder-delete@example.com', 'password123');

      const res = await request(app.getHttpServer())
        .delete(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${tokenB}`);
      expect(res.status).toBe(404);
    });

    it('Create todo with due date', async () => {
      await signupUser('duedate-create@example.com', 'password123');
      const token = await loginUser('duedate-create@example.com', 'password123');

      const res = await createTodo(token, 'Deadline task', undefined, '2026-04-01T00:00:00.000Z');
      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBe('2026-04-01T00:00:00.000Z');
      expect(res.body.title).toBe('Deadline task');
    });

    it('Create todo without due date — dueDate is null', async () => {
      await signupUser('duedate-null@example.com', 'password123');
      const token = await loginUser('duedate-null@example.com', 'password123');

      const res = await createTodo(token, 'No deadline');
      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBeNull();
    });

    it('Update todo — set due date', async () => {
      await signupUser('duedate-set@example.com', 'password123');
      const token = await loginUser('duedate-set@example.com', 'password123');
      const createRes = await createTodo(token, 'Set due date later');

      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: '2026-05-01T00:00:00.000Z' });
      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBe('2026-05-01T00:00:00.000Z');
    });

    it('Update todo — clear due date', async () => {
      await signupUser('duedate-clear@example.com', 'password123');
      const token = await loginUser('duedate-clear@example.com', 'password123');
      const createRes = await createTodo(token, 'Clear due date', undefined, '2026-05-01T00:00:00.000Z');

      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: null });
      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBeNull();
    });

    it('Create todo — invalid dueDate format rejected', async () => {
      await signupUser('duedate-invalid@example.com', 'password123');
      const token = await loginUser('duedate-invalid@example.com', 'password123');

      const res = await request(app.getHttpServer())
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad date', dueDate: 'not-a-date' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('dueDate');
    });

    it('Create todo — invalid dueDate format (partial date) rejected', async () => {
      await signupUser('duedate-partial@example.com', 'password123');
      const token = await loginUser('duedate-partial@example.com', 'password123');

      const res = await request(app.getHttpServer())
        .post('/api/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Bad date 2', dueDate: '2026-13-01' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('Update todo — invalid dueDate format rejected', async () => {
      await signupUser('duedate-updinvalid@example.com', 'password123');
      const token = await loginUser('duedate-updinvalid@example.com', 'password123');
      const createRes = await createTodo(token, 'Update invalid date');

      const res = await request(app.getHttpServer())
        .patch(`/api/todos/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: 'yesterday' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('List todos returns dueDate field', async () => {
      await signupUser('duedate-list@example.com', 'password123');
      const token = await loginUser('duedate-list@example.com', 'password123');
      await createTodo(token, 'With date', undefined, '2026-06-01T00:00:00.000Z');
      await createTodo(token, 'Without date');

      const res = await request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      const withDate = res.body.find((t: any) => t.title === 'With date');
      const withoutDate = res.body.find((t: any) => t.title === 'Without date');
      expect(withDate.dueDate).toBe('2026-06-01T00:00:00.000Z');
      expect(withoutDate.dueDate).toBeNull();
    });
  });

  // Cross-User Isolation
  describe('Cross-User Isolation', () => {
    it('Data isolation — users can only access own todos', async () => {
      await signupUser('alice@example.com', 'password123');
      const aliceToken = await loginUser('alice@example.com', 'password123');
      await createTodo(aliceToken, 'Alice Todo 1');
      await createTodo(aliceToken, 'Alice Todo 2');

      await signupUser('bob@example.com', 'password123');
      const bobToken = await loginUser('bob@example.com', 'password123');
      const bobTodoRes = await createTodo(bobToken, 'Bob Todo 1');
      const bobTodoId = bobTodoRes.body.id;

      // Alice sees only her todos
      const aliceList = await request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(aliceList.status).toBe(200);
      expect(aliceList.body).toHaveLength(2);
      expect(aliceList.body.every((t: any) => t.title.startsWith('Alice'))).toBe(true);

      // Bob sees only his todos
      const bobList = await request(app.getHttpServer())
        .get('/api/todos')
        .set('Authorization', `Bearer ${bobToken}`);
      expect(bobList.status).toBe(200);
      expect(bobList.body).toHaveLength(1);
      expect(bobList.body[0].title).toBe('Bob Todo 1');

      // Alice cannot modify Bob's todo
      const patchRes = await request(app.getHttpServer())
        .patch(`/api/todos/${bobTodoId}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ completed: true });
      expect(patchRes.status).toBe(404);

      // Alice cannot delete Bob's todo
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/todos/${bobTodoId}`)
        .set('Authorization', `Bearer ${aliceToken}`);
      expect(deleteRes.status).toBe(404);
    });
  });
});
