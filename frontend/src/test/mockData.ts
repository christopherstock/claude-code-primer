import { Todo } from '@/types/todo';

export const mockTodo: Todo = {
  id: '1',
  title: 'Test Todo',
  description: 'This is a test todo',
  completed: false,
  priority: 'medium',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockCompletedTodo: Todo = {
  id: '2',
  title: 'Completed Todo',
  description: 'This todo is completed',
  completed: true,
  priority: 'low',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

export const mockTodos: Todo[] = [
  mockTodo,
  mockCompletedTodo,
  {
    id: '3',
    title: 'Another Todo',
    description: 'Another test todo',
    completed: false,
    priority: 'high',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z',
  },
];
