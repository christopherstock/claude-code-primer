import redis
import json
import os
from typing import Optional, List
from datetime import datetime


class RedisService:
    """Service for Redis database operations"""

    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0)),
            decode_responses=True
        )
        self.todo_key_prefix = "todo:"
        self.todo_list_key = "todos:list"

    def _get_todo_key(self, todo_id: str) -> str:
        """Generate Redis key for a todo item"""
        return f"{self.todo_key_prefix}{todo_id}"

    def create_todo(self, todo_id: str, todo_data: dict) -> dict:
        """Create a new todo in Redis"""
        todo_data["id"] = todo_id
        todo_data["created_at"] = datetime.utcnow().isoformat()
        todo_data["updated_at"] = datetime.utcnow().isoformat()

        # Store todo data
        key = self._get_todo_key(todo_id)
        self.redis_client.set(key, json.dumps(todo_data))

        # Add to list of todos
        self.redis_client.rpush(self.todo_list_key, todo_id)

        return todo_data

    def get_todo(self, todo_id: str) -> Optional[dict]:
        """Get a todo by ID"""
        key = self._get_todo_key(todo_id)
        data = self.redis_client.get(key)

        if data:
            return json.loads(data)
        return None

    def get_all_todos(self) -> List[dict]:
        """Get all todos"""
        todo_ids = self.redis_client.lrange(self.todo_list_key, 0, -1)
        todos = []

        for todo_id in todo_ids:
            todo = self.get_todo(todo_id)
            if todo:
                todos.append(todo)

        return todos

    def update_todo(self, todo_id: str, update_data: dict) -> Optional[dict]:
        """Update an existing todo"""
        todo = self.get_todo(todo_id)

        if not todo:
            return None

        # Update fields
        for key, value in update_data.items():
            if value is not None:
                todo[key] = value

        todo["updated_at"] = datetime.utcnow().isoformat()

        # Save updated todo
        key = self._get_todo_key(todo_id)
        self.redis_client.set(key, json.dumps(todo))

        return todo

    def delete_todo(self, todo_id: str) -> bool:
        """Delete a todo"""
        key = self._get_todo_key(todo_id)

        # Delete from Redis
        deleted = self.redis_client.delete(key)

        # Remove from list
        self.redis_client.lrem(self.todo_list_key, 0, todo_id)

        return deleted > 0

    def health_check(self) -> bool:
        """Check if Redis connection is healthy"""
        try:
            self.redis_client.ping()
            return True
        except Exception:
            return False


# Singleton instance
redis_service = RedisService()
