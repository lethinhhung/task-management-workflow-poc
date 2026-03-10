import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';
import { TodoItem } from '../components/TodoItem';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
}

export function TodoListPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchTodos = useCallback(async () => {
    try {
      const response = await apiClient.get('/todos');
      setTodos(response.data);
    } catch {
      setError('Failed to load todos');
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleAddTodo = async () => {
    if (!newTitle.trim()) return;
    setError('');
    try {
      const response = await apiClient.post('/todos', {
        title: newTitle,
        description: newDescription || undefined,
      });
      setTodos((prev) => [...prev, response.data]);
      setNewTitle('');
      setNewDescription('');
    } catch {
      setError('Failed to create todo');
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const response = await apiClient.patch(`/todos/${id}`, { completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? response.data : t)));
    } catch {
      setError('Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/todos/${id}`);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete todo');
    }
  };

  const handleEdit = async (id: string, title: string, description: string) => {
    try {
      const response = await apiClient.patch(`/todos/${id}`, { title, description });
      setTodos((prev) => prev.map((t) => (t.id === id ? response.data : t)));
    } catch {
      setError('Failed to update todo');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>My Todos</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Todo title"
          data-testid="new-todo-title"
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <input
          type="text"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Description (optional)"
          data-testid="new-todo-description"
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={handleAddTodo} data-testid="add-todo">Add</button>
      </div>
      <div>
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
        {todos.length === 0 && <p>No todos yet. Add one above!</p>}
      </div>
    </div>
  );
}
