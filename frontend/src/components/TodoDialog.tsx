import { useState, useEffect } from 'react';
import { Todo, TodoCreate, TodoUpdate } from '@/types/todo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: TodoCreate | { id: string; updates: TodoUpdate }) => void;
  editTodo?: Todo | null;
}

export function TodoDialog({ open, onOpenChange, onSave, editTodo }: TodoDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title);
      setDescription(editTodo.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [editTodo, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    if (editTodo) {
      onSave({
        id: editTodo.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
        },
      });
    } else {
      onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        completed: false,
      });
    }

    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editTodo ? 'Edit Todo' : 'Create New Todo'}</DialogTitle>
            <DialogDescription>
              {editTodo
                ? 'Update your todo item details'
                : 'Add a new todo item to your list'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter todo title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter todo description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {editTodo ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
