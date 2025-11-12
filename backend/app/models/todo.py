from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TodoBase(BaseModel):
    """Base Todo model with common fields"""
    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    description: Optional[str] = Field(None, max_length=1000, description="Todo description")
    completed: bool = Field(default=False, description="Completion status")


class TodoCreate(TodoBase):
    """Model for creating a new Todo"""
    pass


class TodoUpdate(BaseModel):
    """Model for updating an existing Todo"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None


class TodoInDB(TodoBase):
    """Model representing a Todo in the database"""
    id: str = Field(..., description="Unique todo identifier")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class TodoResponse(TodoInDB):
    """Model for Todo API responses"""
    pass
