import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { todoApi, ApiError } from './api';
import type { Todo, TodoCreate, TodoUpdate } from '@/types/todo';

// Mock fetch
global.fetch = vi.fn();

function createFetchResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

describe('ApiError', () => {
  it('should create an ApiError with status and message', () => {
    const error = new ApiError(404, 'Not Found');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.name).toBe('ApiError');
  });

  it('should be an instance of Error', () => {
    const error = new ApiError(500, 'Server Error');
    expect(error).toBeInstanceOf(Error);
  });
});

describe('todoApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all todos successfully', async () => {
      const mockTodos: Todo[] = [
        {
          id: '1',
          title: 'Test Todo',
          description: 'Test description',
          completed: false,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse(mockTodos));

      const result = await todoApi.getAll();

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/todos'));
      expect(result).toEqual(mockTodos);
    });

    it('should throw ApiError on failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ error: 'Failed' }, 500)
      );

      await expect(todoApi.getAll()).rejects.toThrow(ApiError);
    });

    it('should return empty array when no todos', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse([]));

      const result = await todoApi.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch a specific todo by id', async () => {
      const mockTodo: Todo = {
        id: '123',
        title: 'Specific Todo',
        description: 'Description',
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse(mockTodo));

      const result = await todoApi.getById('123');

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/todos/123'));
      expect(result).toEqual(mockTodo);
      expect(result.id).toBe('123');
    });

    it('should throw ApiError when todo not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ detail: 'Not found' }, 404)
      );

      await expect(todoApi.getById('nonexistent')).rejects.toThrow(ApiError);
      await expect(todoApi.getById('nonexistent')).rejects.toThrow(/404|Not/);
    });
  });

  describe('create', () => {
    it('should create a new todo', async () => {
      const newTodo: TodoCreate = {
        title: 'New Todo',
        description: 'New description',
        completed: false,
      };

      const createdTodo: Todo = {
        id: '456',
        ...newTodo,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(createdTodo, 201)
      );

      const result = await todoApi.create(newTodo);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/todos'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTodo),
        })
      );
      expect(result).toEqual(createdTodo);
      expect(result.id).toBe('456');
    });

    it('should create todo with minimal fields', async () => {
      const minimalTodo: TodoCreate = {
        title: 'Minimal Todo',
      };

      const createdTodo: Todo = {
        id: '789',
        title: 'Minimal Todo',
        description: undefined,
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(createdTodo, 201)
      );

      const result = await todoApi.create(minimalTodo);
      expect(result.title).toBe('Minimal Todo');
    });

    it('should throw ApiError on validation failure', async () => {
      const invalidTodo: TodoCreate = {
        title: '',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ detail: 'Validation error' }, 422)
      );

      await expect(todoApi.create(invalidTodo)).rejects.toThrow(ApiError);
    });
  });

  describe('update', () => {
    it('should update an existing todo', async () => {
      const updates: TodoUpdate = {
        title: 'Updated Title',
        completed: true,
      };

      const updatedTodo: Todo = {
        id: '123',
        title: 'Updated Title',
        description: 'Original description',
        completed: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(updatedTodo)
      );

      const result = await todoApi.update('123', updates);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/todos/123'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })
      );
      expect(result).toEqual(updatedTodo);
      expect(result.title).toBe('Updated Title');
      expect(result.completed).toBe(true);
    });

    it('should update partial fields', async () => {
      const updates: TodoUpdate = {
        completed: true,
      };

      const updatedTodo: Todo = {
        id: '123',
        title: 'Original Title',
        description: 'Original description',
        completed: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(updatedTodo)
      );

      const result = await todoApi.update('123', updates);
      expect(result.completed).toBe(true);
      expect(result.title).toBe('Original Title');
    });

    it('should throw ApiError when todo not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ detail: 'Not found' }, 404)
      );

      await expect(todoApi.update('nonexistent', { completed: true })).rejects.toThrow(ApiError);
    });
  });

  describe('delete', () => {
    it('should delete a todo successfully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(createFetchResponse(null, 204));

      const result = await todoApi.delete('123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/todos/123'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toBeUndefined();
    });

    it('should throw ApiError when todo not found', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ detail: 'Not found' }, 404)
      );

      await expect(todoApi.delete('nonexistent')).rejects.toThrow(ApiError);
    });

    it('should handle 204 No Content response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('No content');
        },
        text: async () => '',
      } as Response);

      const result = await todoApi.delete('123');
      expect(result).toBeUndefined();
    });
  });

  describe('toggleComplete', () => {
    it('should toggle todo completion status', async () => {
      const updatedTodo: Todo = {
        id: '123',
        title: 'Test Todo',
        description: 'Description',
        completed: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(updatedTodo)
      );

      const result = await todoApi.toggleComplete('123', true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/todos/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ completed: true }),
        })
      );
      expect(result.completed).toBe(true);
    });

    it('should toggle from completed to incomplete', async () => {
      const updatedTodo: Todo = {
        id: '123',
        title: 'Test Todo',
        description: 'Description',
        completed: false,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse(updatedTodo)
      );

      const result = await todoApi.toggleComplete('123', false);
      expect(result.completed).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      await expect(todoApi.getAll()).rejects.toThrow('Network error');
    });

    it('should handle JSON parse errors in error response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => '',
      } as Response);

      await expect(todoApi.getAll()).rejects.toThrow(ApiError);
    });

    it('should include error details in ApiError', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
        createFetchResponse({ error: 'Custom error message' }, 400)
      );

      try {
        await todoApi.getAll();
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.status).toBe(400);
          expect(error.message).toContain('error');
        }
      }
    });
  });
});
