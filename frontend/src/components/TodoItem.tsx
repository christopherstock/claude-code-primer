import { Todo, Priority } from '@/types/todo';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: 'High', className: 'bg-red-100 text-red-800 border-red-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  low: { label: 'Low', className: 'bg-green-100 text-green-800 border-green-200' },
};

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const priorityInfo = priorityConfig[todo.priority];

  return (
    <Card className="mb-3">
      <CardContent className="flex items-start gap-3 p-4">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => onToggle(todo.id, checked === true)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-medium ${
                todo.completed ? 'line-through text-muted-foreground' : ''
              }`}
            >
              {todo.title}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${priorityInfo.className}`}
            >
              {priorityInfo.label}
            </span>
          </div>
          {todo.description && (
            <p
              className={`text-sm mt-1 ${
                todo.completed ? 'text-muted-foreground' : 'text-muted-foreground'
              }`}
            >
              {todo.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Created: {new Date(todo.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(todo)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(todo.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
