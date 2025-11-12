import { Todo } from '@/types/todo';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  return (
    <Card className="mb-3">
      <CardContent className="flex items-start gap-3 p-4">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={(checked) => onToggle(todo.id, checked === true)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <h3
            className={`font-medium ${
              todo.completed ? 'line-through text-muted-foreground' : ''
            }`}
          >
            {todo.title}
          </h3>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(todo)}
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(todo.id)}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
