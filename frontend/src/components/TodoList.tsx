import { Todo, Priority } from '@/types/todo';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const priorityOrder: Record<Priority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export function TodoList({ todos, onToggle, onEdit, onDelete }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No todos yet. Create one to get started!
      </div>
    );
  }

  const incompleteTodos = todos
    .filter((todo) => !todo.completed)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const completedTodos = todos.filter((todo) => todo.completed);

  return (
    <div className="space-y-6">
      {incompleteTodos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Active</h2>
          {incompleteTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {completedTodos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Completed</h2>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
