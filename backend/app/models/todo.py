from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Priority(str, Enum):
    """Priority levels for todos"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TodoBase(BaseModel):
    """Base Todo model with common fields"""

    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    description: str | None = Field(None, max_length=1000, description="Todo description")
    completed: bool = Field(default=False, description="Completion status")
    done: bool = Field(default=False, description="Done status - marks item as fully completed")
    priority: Priority = Field(default=Priority.MEDIUM, description="Priority level")


class TodoCreate(TodoBase):
    """Model for creating a new Todo"""

    pass


class TodoUpdate(BaseModel):
    """Model for updating an existing Todo"""

    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, max_length=1000)
    completed: bool | None = None
    done: bool | None = None
    priority: Priority | None = None


class TodoInDB(TodoBase):
    """Model representing a Todo in the database"""

    id: str = Field(..., description="Unique todo identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}


class TodoResponse(TodoInDB):
    """Model for Todo API responses"""

    pass
