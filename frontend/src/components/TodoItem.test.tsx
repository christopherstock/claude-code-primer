import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { TodoItem } from './TodoItem';
import { mockTodo, mockCompletedTodo } from '@/test/mockData';
import userEvent from '@testing-library/user-event';

describe('TodoItem', () => {
  const mockHandlers = {
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render todo item with title', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    expect(screen.getByText(mockTodo.title)).toBeInTheDocument();
  });

  it('should render todo item with description', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    if (mockTodo.description) {
      expect(screen.getByText(mockTodo.description)).toBeInTheDocument();
    }
  });

  it('should not render description when not provided', () => {
    const todoWithoutDescription = { ...mockTodo, description: undefined };
    render(<TodoItem todo={todoWithoutDescription} {...mockHandlers} />);

    expect(screen.queryByText(/This is a test todo/)).not.toBeInTheDocument();
  });

  it('should render created date', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
  });

  it('should render Edit and Delete buttons', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onToggle when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith(mockTodo.id, true);
  });

  it('should call onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledWith(mockTodo);
  });

  it('should call onDelete when Delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledWith(mockTodo.id);
  });

  it('should display checkbox as checked for completed todo', () => {
    render(<TodoItem todo={mockCompletedTodo} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('should display checkbox as unchecked for incomplete todo', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('should apply line-through style to completed todo title', () => {
    render(<TodoItem todo={mockCompletedTodo} {...mockHandlers} />);

    const title = screen.getByText(mockCompletedTodo.title);
    expect(title).toHaveClass('line-through');
  });

  it('should not apply line-through style to incomplete todo title', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const title = screen.getByText(mockTodo.title);
    expect(title).not.toHaveClass('line-through');
  });

  it('should format created date correctly', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const formattedDate = new Date(mockTodo.created_at).toLocaleDateString();
    expect(screen.getByText(`Created: ${formattedDate}`)).toBeInTheDocument();
  });

  it('should toggle from unchecked to checked', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith(mockTodo.id, true);
  });

  it('should toggle from checked to unchecked', async () => {
    const user = userEvent.setup();
    render(<TodoItem todo={mockCompletedTodo} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith(mockCompletedTodo.id, false);
  });

  it('should render priority badge', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('should render high priority badge with correct style', () => {
    const highPriorityTodo = { ...mockTodo, priority: 'high' as const };
    render(<TodoItem todo={highPriorityTodo} {...mockHandlers} />);

    const badge = screen.getByText('High');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100');
  });

  it('should render low priority badge with correct style', () => {
    const lowPriorityTodo = { ...mockTodo, priority: 'low' as const };
    render(<TodoItem todo={lowPriorityTodo} {...mockHandlers} />);

    const badge = screen.getByText('Low');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
  });

  it('should render medium priority badge with correct style', () => {
    render(<TodoItem todo={mockTodo} {...mockHandlers} />);

    const badge = screen.getByText('Medium');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100');
  });
});
