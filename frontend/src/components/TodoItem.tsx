import { useState } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, description: string, dueDate: string | null) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [editDueDate, setEditDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : ''
  );

  const handleSave = () => {
    const dueDate = editDueDate ? new Date(editDueDate).toISOString() : null;
    onEdit(todo.id, editTitle, editDescription, dueDate);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditDueDate(todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '');
    setIsEditing(false);
  };

  const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();

  if (isEditing) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '8px' }}>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Title"
          data-testid="edit-title"
        />
        <input
          type="text"
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Description"
          data-testid="edit-description"
        />
        <input
          type="date"
          value={editDueDate}
          onChange={(e) => setEditDueDate(e.target.value)}
          data-testid="edit-due-date"
        />
        <button onClick={handleSave} data-testid="save-edit">Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        marginBottom: '8px',
        ...(isOverdue ? { backgroundColor: '#ffe0e0' } : {}),
      }}
      {...(isOverdue ? { 'data-testid': 'overdue-indicator' } : {})}
    >
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id, !todo.completed)}
        data-testid={`toggle-${todo.id}`}
      />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', marginLeft: '8px' }}>
        {todo.title}
      </span>
      {todo.description && (
        <p style={{ margin: '4px 0 0 26px', color: '#666' }}>{todo.description}</p>
      )}
      {todo.dueDate && (
        <p style={{ margin: '4px 0 0 26px', color: isOverdue ? 'red' : '#666' }}>
          Due: {new Date(todo.dueDate).toLocaleDateString()}
        </p>
      )}
      <button onClick={() => setIsEditing(true)} style={{ marginLeft: '8px' }}>Edit</button>
      <button onClick={() => onDelete(todo.id)} style={{ marginLeft: '4px' }}>Delete</button>
    </div>
  );
}
