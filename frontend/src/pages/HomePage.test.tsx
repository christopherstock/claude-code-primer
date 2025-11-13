import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/utils'
import { HomePage } from './HomePage'
import { todoApi } from '@/lib/api'
import { mockTodo, mockCompletedTodo } from '@/test/mockData'
import userEvent from '@testing-library/user-event'

// Mock the API
vi.mock('@/lib/api', () => ({
  todoApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleComplete: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock window.confirm
global.confirm = vi.fn(() => true)

// Mock window.alert
global.alert = vi.fn()

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state initially', () => {
    vi.mocked(todoApi.getAll).mockImplementation(() => new Promise(() => {}))
    render(<HomePage />)

    expect(screen.getByText(/Loading todos.../i)).toBeInTheDocument()
  })

  it('should fetch and display todos on mount', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo, mockCompletedTodo])

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(mockTodo.title)).toBeInTheDocument()
      expect(screen.getByText(mockCompletedTodo.title)).toBeInTheDocument()
    })
  })

  it('should display error message when fetch fails', async () => {
    vi.mocked(todoApi.getAll).mockRejectedValue(new Error('Failed to fetch'))

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load todos/i)).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  it('should retry fetching todos when Retry button is clicked', async () => {
    vi.mocked(todoApi.getAll)
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce([mockTodo])

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Retry')
    await userEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText(mockTodo.title)).toBeInTheDocument()
    })
  })

  it('should display todo statistics', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo, mockCompletedTodo])

    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(/Total:/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Active:/i)).toBeInTheDocument()
    expect(screen.getByText(/Completed:/i)).toBeInTheDocument()

    // Check that todos are displayed
    expect(screen.getByText(mockTodo.title)).toBeInTheDocument()
    expect(screen.getByText(mockCompletedTodo.title)).toBeInTheDocument()
  })

  it('should open create dialog when "Create New Todo" button is clicked', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([])

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Create New Todo')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create New Todo')
    await user.click(createButton)

    expect(screen.getByText('Create New Todo', { selector: 'h2' })).toBeInTheDocument()
  })

  it('should create a new todo', async () => {
    const newTodo = { ...mockTodo, id: '3', title: 'New Todo' }
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.create).mockResolvedValue(newTodo)

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Create New Todo')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create New Todo')
    await user.click(createButton)

    const titleInput = screen.getByLabelText(/Title/i)
    await user.type(titleInput, 'New Todo')

    const saveButton = screen.getByText('Create')
    await user.click(saveButton)

    await waitFor(() => {
      expect(todoApi.create).toHaveBeenCalled()
    })
  })

  it('should handle create error', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([])
    vi.mocked(todoApi.create).mockRejectedValue(new Error('Failed'))

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Create New Todo')).toBeInTheDocument()
    })

    const createButton = screen.getByText('Create New Todo')
    await user.click(createButton)

    const titleInput = screen.getByLabelText(/Title/i)
    await user.type(titleInput, 'New Todo')

    const saveButton = screen.getByText('Create')
    await user.click(saveButton)

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to create todo')
    })
  })

  it('should open edit dialog when edit button is clicked', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText(mockTodo.title)).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(screen.getByText('Edit Todo')).toBeInTheDocument()
  })

  it('should update a todo', async () => {
    const updatedTodo = { ...mockTodo, title: 'Updated Title' }
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.update).mockResolvedValue(updatedTodo)

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    const updateButton = screen.getByText('Update')
    await user.click(updateButton)

    await waitFor(() => {
      expect(todoApi.update).toHaveBeenCalled()
    })
  })

  it('should handle update error', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.update).mockRejectedValue(new Error('Failed'))

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    const updateButton = screen.getByText('Update')
    await user.click(updateButton)

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to update todo')
    })
  })

  it('should toggle todo completion', async () => {
    const toggledTodo = { ...mockTodo, completed: true }
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.toggleComplete).mockResolvedValue(toggledTodo)

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() => {
      expect(todoApi.toggleComplete).toHaveBeenCalledWith(mockTodo.id, true)
    })
  })

  it('should handle toggle error', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.toggleComplete).mockRejectedValue(new Error('Failed'))

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    const checkbox = screen.getByRole('checkbox')
    await user.click(checkbox)

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to update todo')
    })
  })

  it('should delete a todo when confirmed', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.delete).mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    await waitFor(() => {
      expect(todoApi.delete).toHaveBeenCalledWith(mockTodo.id)
    })
  })

  it('should not delete todo when not confirmed', async () => {
    global.confirm = vi.fn(() => false)
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    expect(todoApi.delete).not.toHaveBeenCalled()
  })

  it('should handle delete error', async () => {
    global.confirm = vi.fn(() => true)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])
    vi.mocked(todoApi.delete).mockRejectedValue(new Error('Failed'))

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Delete')
    await user.click(deleteButton)

    // Wait for the API call to complete and error to be logged
    await waitFor(() => {
      expect(todoApi.delete).toHaveBeenCalledWith(mockTodo.id)
    })

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('should close dialog and clear editing todo', async () => {
    vi.mocked(todoApi.getAll).mockResolvedValue([mockTodo])

    const user = userEvent.setup()
    render(<HomePage />)

    await waitFor(() => {
      expect(screen.getByText('Edit')).toBeInTheDocument()
    })

    const editButton = screen.getByText('Edit')
    await user.click(editButton)

    expect(screen.getByText('Edit Todo')).toBeInTheDocument()

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Edit Todo')).not.toBeInTheDocument()
    })
  })
})
