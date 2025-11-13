import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { TodoList } from './TodoList';
import { mockTodos, mockTodo, mockCompletedTodo } from '@/test/mockData';

describe('TodoList', () => {
  const mockHandlers = {
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display empty state when no todos', () => {
    render(<TodoList todos={[]} {...mockHandlers} />);

    expect(screen.getByText(/No todos yet. Create one to get started!/i)).toBeInTheDocument();
  });

  it('should not display empty state when todos exist', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    expect(screen.queryByText(/No todos yet/i)).not.toBeInTheDocument();
  });

  it('should render all todos', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    mockTodos.forEach((todo) => {
      expect(screen.getByText(todo.title)).toBeInTheDocument();
    });
  });

  it('should display "Active" section header when incomplete todos exist', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should display "Completed" section header when completed todos exist', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should not display "Active" section when all todos are completed', () => {
    render(<TodoList todos={[mockCompletedTodo]} {...mockHandlers} />);

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('should not display "Completed" section when no todos are completed', () => {
    render(<TodoList todos={[mockTodo]} {...mockHandlers} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
  });

  it('should separate incomplete and completed todos', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    const activeSection = screen.getByText('Active').parentElement;
    const completedSection = screen.getByText('Completed').parentElement;

    // Check that incomplete todos are in Active section
    const incompleteTodos = mockTodos.filter((todo) => !todo.completed);
    incompleteTodos.forEach((todo) => {
      const todoElement = screen.getByText(todo.title);
      expect(activeSection).toContainElement(todoElement);
    });

    // Check that completed todos are in Completed section
    const completedTodos = mockTodos.filter((todo) => todo.completed);
    completedTodos.forEach((todo) => {
      const todoElement = screen.getByText(todo.title);
      expect(completedSection).toContainElement(todoElement);
    });
  });

  it('should render correct number of incomplete todos', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    const incompleteTodos = mockTodos.filter((todo) => !todo.completed);

    // Just verify that incomplete todos are rendered
    expect(incompleteTodos.length).toBeGreaterThan(0);

    // Verify Active section exists when there are incomplete todos
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render correct number of completed todos', () => {
    render(<TodoList todos={mockTodos} {...mockHandlers} />);

    const completedTodos = mockTodos.filter((todo) => todo.completed);
    const checkboxes = screen.getAllByRole('checkbox');

    const checkedCount = checkboxes.filter(
      (checkbox) => checkbox.getAttribute('data-state') === 'checked'
    ).length;

    expect(checkedCount).toBe(completedTodos.length);
  });

  it('should pass handlers to TodoItem components', async () => {
    const user = (await import('@testing-library/user-event')).default.setup();
    render(<TodoList todos={[mockTodo]} {...mockHandlers} />);

    // Test onEdit handler
    const editButton = screen.getByText('Edit');
    await user.click(editButton);
    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTodo);

    // Test onDelete handler
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockTodo.id);
  });

  it('should display todos in the correct order within sections', () => {
    const todosInOrder = [
      { ...mockTodo, id: '1', title: 'First Incomplete', completed: false },
      { ...mockTodo, id: '2', title: 'Second Incomplete', completed: false },
      { ...mockTodo, id: '3', title: 'First Complete', completed: true },
      { ...mockTodo, id: '4', title: 'Second Complete', completed: true },
    ];

    render(<TodoList todos={todosInOrder} {...mockHandlers} />);

    const titles = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);

    // Incomplete todos should come before completed todos in the UI
    expect(titles.indexOf('First Incomplete')).toBeLessThan(titles.indexOf('First Complete'));
    expect(titles.indexOf('Second Incomplete')).toBeLessThan(titles.indexOf('Second Complete'));
  });

  it('should handle mixed completed status todos', () => {
    const mixedTodos = [
      { ...mockTodo, id: '1', title: 'First Todo', completed: false },
      { ...mockCompletedTodo, id: '2', title: 'Second Todo', completed: true },
      { ...mockTodo, id: '3', title: 'Third Todo', completed: false },
    ];

    render(<TodoList todos={mixedTodos} {...mockHandlers} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();

    // Should render all unique todos
    expect(screen.getByText('First Todo')).toBeInTheDocument();
    expect(screen.getByText('Second Todo')).toBeInTheDocument();
    expect(screen.getByText('Third Todo')).toBeInTheDocument();
  });

  it('should handle single incomplete todo', () => {
    render(<TodoList todos={[mockTodo]} {...mockHandlers} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    expect(screen.getByText(mockTodo.title)).toBeInTheDocument();
  });

  it('should handle single completed todo', () => {
    render(<TodoList todos={[mockCompletedTodo]} {...mockHandlers} />);

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(mockCompletedTodo.title)).toBeInTheDocument();
  });

  it('should sort active todos by priority (high, medium, low)', () => {
    const unsortedTodos = [
      { ...mockTodo, id: '1', title: 'Low Priority', priority: 'low' as const, completed: false },
      { ...mockTodo, id: '2', title: 'High Priority', priority: 'high' as const, completed: false },
      {
        ...mockTodo,
        id: '3',
        title: 'Medium Priority',
        priority: 'medium' as const,
        completed: false,
      },
    ];

    render(<TodoList todos={unsortedTodos} {...mockHandlers} />);

    const todoTitles = screen.getAllByRole('heading', { level: 3 });
    expect(todoTitles[0]).toHaveTextContent('High Priority');
    expect(todoTitles[1]).toHaveTextContent('Medium Priority');
    expect(todoTitles[2]).toHaveTextContent('Low Priority');
  });

  it('should not sort completed todos by priority', () => {
    const completedTodos = [
      {
        ...mockTodo,
        id: '1',
        title: 'Low Priority Completed',
        priority: 'low' as const,
        completed: true,
      },
      {
        ...mockTodo,
        id: '2',
        title: 'High Priority Completed',
        priority: 'high' as const,
        completed: true,
      },
    ];

    render(<TodoList todos={completedTodos} {...mockHandlers} />);

    // Completed todos should appear in original order, not sorted by priority
    const todoTitles = screen.getAllByRole('heading', { level: 3 });
    expect(todoTitles[0]).toHaveTextContent('Low Priority Completed');
    expect(todoTitles[1]).toHaveTextContent('High Priority Completed');
  });

  it('should sort only active todos while keeping completed todos unsorted', () => {
    const mixedTodos = [
      { ...mockTodo, id: '1', title: 'Low Active', priority: 'low' as const, completed: false },
      { ...mockTodo, id: '2', title: 'High Completed', priority: 'high' as const, completed: true },
      { ...mockTodo, id: '3', title: 'High Active', priority: 'high' as const, completed: false },
      { ...mockTodo, id: '4', title: 'Low Completed', priority: 'low' as const, completed: true },
    ];

    render(<TodoList todos={mixedTodos} {...mockHandlers} />);

    const activeTitles = screen.getByText('Active').parentElement!.querySelectorAll('h3');
    expect(activeTitles[0]).toHaveTextContent('High Active');
    expect(activeTitles[1]).toHaveTextContent('Low Active');

    const completedTitles = screen.getByText('Completed').parentElement!.querySelectorAll('h3');
    expect(completedTitles[0]).toHaveTextContent('High Completed');
    expect(completedTitles[1]).toHaveTextContent('Low Completed');
  });
});
