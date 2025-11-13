import { Todo, TodoCreate, TodoUpdate } from '@/types/todo';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE_URL}/api/todos`;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const todoApi = {
  async getAll(): Promise<Todo[]> {
    const response = await fetch(API_ENDPOINT);
    return handleResponse<Todo[]>(response);
  },

  async getById(id: string): Promise<Todo> {
    const response = await fetch(`${API_ENDPOINT}/${id}`);
    return handleResponse<Todo>(response);
  },

  async create(todo: TodoCreate): Promise<Todo> {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    return handleResponse<Todo>(response);
  },

  async update(id: string, updates: TodoUpdate): Promise<Todo> {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return handleResponse<Todo>(response);
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_ENDPOINT}/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  async toggleComplete(id: string, completed: boolean): Promise<Todo> {
    return this.update(id, { completed });
  },
};
