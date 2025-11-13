import uuid

from fastapi import APIRouter, HTTPException, status

from app.models.todo import TodoCreate, TodoResponse, TodoUpdate
from app.services.redis_service import redis_service

router = APIRouter(prefix="/todos", tags=["todos"])


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(todo: TodoCreate):
    """Create a new todo item"""
    todo_id = str(uuid.uuid4())
    todo_data = todo.model_dump()

    created_todo = redis_service.create_todo(todo_id, todo_data)
    return created_todo


@router.get("/", response_model=list[TodoResponse])
async def get_all_todos():
    """Get all todo items"""
    todos = redis_service.get_all_todos()
    return todos


@router.get("/{todo_id}", response_model=TodoResponse)
async def get_todo(todo_id: str):
    """Get a specific todo item by ID"""
    todo = redis_service.get_todo(todo_id)

    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Todo with id {todo_id} not found"
        )

    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo_update: TodoUpdate):
    """Update a todo item"""
    # Remove None values from update data
    update_data = todo_update.model_dump(exclude_unset=True)

    updated_todo = redis_service.update_todo(todo_id, update_data)

    if not updated_todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Todo with id {todo_id} not found"
        )

    return updated_todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: str):
    """Delete a todo item"""
    deleted = redis_service.delete_todo(todo_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Todo with id {todo_id} not found"
        )

    return None
