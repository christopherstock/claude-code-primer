import { useState, useEffect } from 'react';
import { Todo, TodoCreate, TodoUpdate } from '@/types/todo';
import { todoApi } from '@/lib/api';
import { TodoList } from '@/components/TodoList';
import { TodoDialog } from '@/components/TodoDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos. Please check if the backend is running.');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (data: TodoCreate) => {
    try {
      const newTodo = await todoApi.create(data);
      setTodos([newTodo, ...todos]);
    } catch (err) {
      console.error('Error creating todo:', err);
      alert('Failed to create todo');
    }
  };

  const handleUpdate = async (data: { id: string; updates: TodoUpdate }) => {
    try {
      const updatedTodo = await todoApi.update(data.id, data.updates);
      setTodos(todos.map((todo) => (todo.id === data.id ? updatedTodo : todo)));
    } catch (err) {
      console.error('Error updating todo:', err);
      alert('Failed to update todo');
    }
  };

  const handleSave = (data: TodoCreate | { id: string; updates: TodoUpdate }) => {
    if ('id' in data) {
      handleUpdate(data);
    } else {
      handleCreate(data);
    }
    setEditingTodo(null);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const updatedTodo = await todoApi.toggleComplete(id, completed);
      setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
    } catch (err) {
      console.error('Error toggling todo:', err);
      alert('Failed to update todo');
    }
  };

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) {
      return;
    }

    try {
      await todoApi.delete(id);
      setTodos(todos.filter((todo) => todo.id !== id));
    } catch (err) {
      console.error('Error deleting todo:', err);
      alert('Failed to delete todo');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingTodo(null);
    }
  };

  const stats = {
    total: todos.length,
    active: todos.filter((todo) => !todo.completed).length,
    completed: todos.filter((todo) => todo.completed).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">Todo App</CardTitle>
            <CardDescription>
              Manage your tasks efficiently with this full-stack todo application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Active: </span>
                  <span className="font-semibold">{stats.active}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Completed: </span>
                  <span className="font-semibold">{stats.completed}</span>
                </div>
              </div>
              <Button onClick={() => setDialogOpen(true)}>Create New Todo</Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading todos...</p>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchTodos}>Retry</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TodoList
            todos={todos}
            onToggle={handleToggle}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <TodoDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSave={handleSave}
          editTodo={editingTodo}
        />
      </div>
    </div>
  );
}
