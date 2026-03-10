import { useState } from 'react';

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, title: string, description: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');

  const handleSave = () => {
    onEdit(todo.id, editTitle, editDescription);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setIsEditing(false);
  };

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
        <button onClick={handleSave} data-testid="save-edit">Save</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '8px' }}>
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
      <button onClick={() => setIsEditing(true)} style={{ marginLeft: '8px' }}>Edit</button>
      <button onClick={() => onDelete(todo.id)} style={{ marginLeft: '4px' }}>Delete</button>
    </div>
  );
}
