import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { TodoDialog } from './TodoDialog';
import { mockTodo } from '@/test/mockData';
import userEvent from '@testing-library/user-event';

describe('TodoDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('should render create dialog with correct title', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      expect(screen.getByText('Create New Todo')).toBeInTheDocument();
      expect(screen.getByText('Add a new todo item to your list')).toBeInTheDocument();
    });

    it('should render title and description inputs', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    });

    it('should render Cancel and Create buttons', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });

    it('should create new todo with title and description', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, 'New Todo');
      await user.type(descriptionInput, 'New Description');
      await user.click(createButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'New Todo',
        description: 'New Description',
        completed: false,
        priority: 'medium',
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should create todo with title only', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, 'New Todo');
      await user.click(createButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'New Todo',
        description: undefined,
        completed: false,
        priority: 'medium',
      });
    });

    it('should trim whitespace from title', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, '  Trimmed Title  ');
      await user.click(createButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Trimmed Title',
        description: undefined,
        completed: false,
        priority: 'medium',
      });
    });

    it('should trim whitespace from description', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, 'Title');
      await user.type(descriptionInput, '  Trimmed Description  ');
      await user.click(createButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Title',
        description: 'Trimmed Description',
        completed: false,
        priority: 'medium',
      });
    });

    it('should not create todo with empty title', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const createButton = screen.getByText('Create');
      await user.click(createButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should not create todo with whitespace-only title', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, '   ');
      await user.click(createButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should disable Create button when title is empty', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const createButton = screen.getByText('Create');
      expect(createButton).toBeDisabled();
    });

    it('should enable Create button when title is not empty', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const createButton = screen.getByText('Create');

      expect(createButton).toBeDisabled();

      await user.type(titleInput, 'New Todo');

      expect(createButton).not.toBeDisabled();
    });

    it('should render priority selector', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      expect(screen.getByLabelText(/Priority/i)).toBeInTheDocument();
    });

    it('should default priority to medium', () => {
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
      expect(prioritySelect.value).toBe('medium');
    });

    it('should create todo with selected priority', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      const prioritySelect = screen.getByLabelText(/Priority/i);
      const createButton = screen.getByText('Create');

      await user.type(titleInput, 'High Priority Task');
      await user.selectOptions(prioritySelect, 'high');
      await user.click(createButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'High Priority Task',
        description: undefined,
        completed: false,
        priority: 'high',
      });
    });
  });

  describe('Edit Mode', () => {
    it('should render edit dialog with correct title', () => {
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      expect(screen.getByText('Edit Todo')).toBeInTheDocument();
      expect(screen.getByText('Update your todo item details')).toBeInTheDocument();
    });

    it('should pre-fill form with existing todo data', () => {
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

      expect(titleInput.value).toBe(mockTodo.title);
      expect(descriptionInput.value).toBe(mockTodo.description || '');
    });

    it('should render Update button in edit mode', () => {
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });

    it('should update todo with new values', async () => {
      const user = userEvent.setup();
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      const titleInput = screen.getByLabelText(/Title/i);
      const descriptionInput = screen.getByLabelText(/Description/i);
      const updateButton = screen.getByText('Update');

      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Title');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated Description');
      await user.click(updateButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        id: mockTodo.id,
        updates: {
          title: 'Updated Title',
          description: 'Updated Description',
          priority: 'medium',
        },
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should clear form when switching from edit to create mode', () => {
      const { rerender } = render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      // Verify pre-filled values
      const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
      expect(titleInput.value).toBe(mockTodo.title);

      // Switch to create mode
      rerender(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={null}
        />
      );

      // Form should be cleared
      expect(titleInput.value).toBe('');
    });

    it('should pre-fill priority in edit mode', () => {
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      const prioritySelect = screen.getByLabelText(/Priority/i) as HTMLSelectElement;
      expect(prioritySelect.value).toBe(mockTodo.priority);
    });

    it('should update todo with changed priority', async () => {
      const user = userEvent.setup();
      render(
        <TodoDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          onSave={mockOnSave}
          editTodo={mockTodo}
        />
      );

      const prioritySelect = screen.getByLabelText(/Priority/i);
      const updateButton = screen.getByText('Update');

      await user.selectOptions(prioritySelect, 'high');
      await user.click(updateButton);

      expect(mockOnSave).toHaveBeenCalledWith({
        id: mockTodo.id,
        updates: {
          title: mockTodo.title,
          description: mockTodo.description,
          priority: 'high',
        },
      });
    });
  });

  describe('Dialog Controls', () => {
    it('should call onOpenChange when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should not call onSave when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Some Title');

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear form after successful save', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

      await user.type(titleInput, 'Test Title');
      await user.type(descriptionInput, 'Test Description');

      const createButton = screen.getByText('Create');
      await user.click(createButton);

      // Form should be cleared after save
      expect(titleInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });

    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup();
      render(<TodoDialog open={true} onOpenChange={mockOnOpenChange} onSave={mockOnSave} />);

      const titleInput = screen.getByLabelText(/Title/i);
      await user.type(titleInput, 'Test Title');
      await user.keyboard('{Enter}');

      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Test Title',
        description: undefined,
        completed: false,
        priority: 'medium',
      });
    });
  });
});
