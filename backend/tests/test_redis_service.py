"""
Tests for RedisService class.
"""
import json
from datetime import datetime

import pytest


@pytest.mark.unit
class TestRedisServiceInit:
    """Tests for RedisService initialization."""

    def test_redis_service_init(self, redis_service):
        """Test that RedisService initializes correctly."""
        assert redis_service.todo_key_prefix == "todo:"
        assert redis_service.todo_list_key == "todos:list"
        assert redis_service.redis_client is not None

    def test_get_todo_key(self, redis_service):
        """Test the _get_todo_key method."""
        todo_id = "test-123"
        expected_key = "todo:test-123"
        assert redis_service._get_todo_key(todo_id) == expected_key


@pytest.mark.unit
class TestCreateTodo:
    """Tests for create_todo method."""

    def test_create_todo_success(self, redis_service, sample_todo_data):
        """Test successful todo creation in Redis."""
        todo_id = "test-id-1"
        result = redis_service.create_todo(todo_id, sample_todo_data)

        assert result["id"] == todo_id
        assert result["title"] == sample_todo_data["title"]
        assert result["description"] == sample_todo_data["description"]
        assert result["completed"] == sample_todo_data["completed"]
        assert "created_at" in result
        assert "updated_at" in result

    def test_create_todo_stores_in_redis(self, redis_service, sample_todo_data):
        """Test that todo is actually stored in Redis."""
        todo_id = "test-id-2"
        redis_service.create_todo(todo_id, sample_todo_data)

        # Check if stored in Redis
        key = redis_service._get_todo_key(todo_id)
        stored_data = redis_service.redis_client.get(key)
        assert stored_data is not None

        stored_todo = json.loads(stored_data)
        assert stored_todo["id"] == todo_id
        assert stored_todo["title"] == sample_todo_data["title"]

    def test_create_todo_adds_to_list(self, redis_service, sample_todo_data):
        """Test that todo ID is added to the todos list."""
        todo_id = "test-id-3"
        redis_service.create_todo(todo_id, sample_todo_data)

        # Check if ID is in the list
        todo_ids = redis_service.redis_client.lrange(redis_service.todo_list_key, 0, -1)
        assert todo_id in todo_ids

    def test_create_multiple_todos(self, redis_service, multiple_todos):
        """Test creating multiple todos."""
        created_ids = []

        for idx, todo_data in enumerate(multiple_todos):
            todo_id = f"test-id-{idx}"
            result = redis_service.create_todo(todo_id, todo_data)
            created_ids.append(result["id"])

        # Verify all are in the list
        todo_ids = redis_service.redis_client.lrange(redis_service.todo_list_key, 0, -1)
        for created_id in created_ids:
            assert created_id in todo_ids

    def test_create_todo_timestamps(self, redis_service, sample_todo_data):
        """Test that timestamps are correctly set."""
        todo_id = "test-id-4"
        result = redis_service.create_todo(todo_id, sample_todo_data)

        # Verify timestamps are ISO format strings
        created_at = result["created_at"]
        updated_at = result["updated_at"]

        # Should be able to parse as datetime
        datetime.fromisoformat(created_at)
        datetime.fromisoformat(updated_at)

        # created_at and updated_at should be very close (within a second)
        # They may differ by microseconds due to execution time
        from datetime import datetime as dt

        created_dt = dt.fromisoformat(created_at)
        updated_dt = dt.fromisoformat(updated_at)
        time_diff = abs((updated_dt - created_dt).total_seconds())
        assert time_diff < 1.0, "Timestamps should be within 1 second of each other"


@pytest.mark.unit
class TestGetTodo:
    """Tests for get_todo method."""

    def test_get_todo_success(self, redis_service, sample_todo_data):
        """Test successfully retrieving a todo."""
        todo_id = "test-id-5"
        created = redis_service.create_todo(todo_id, sample_todo_data)

        retrieved = redis_service.get_todo(todo_id)

        assert retrieved is not None
        assert retrieved["id"] == todo_id
        assert retrieved["title"] == created["title"]

    def test_get_todo_not_found(self, redis_service):
        """Test retrieving a non-existent todo returns None."""
        result = redis_service.get_todo("non-existent-id")
        assert result is None

    def test_get_todo_after_creation(self, redis_service, sample_todo_data):
        """Test that retrieved todo matches created todo."""
        todo_id = "test-id-6"
        created = redis_service.create_todo(todo_id, sample_todo_data)
        retrieved = redis_service.get_todo(todo_id)

        assert retrieved == created


@pytest.mark.unit
class TestGetAllTodos:
    """Tests for get_all_todos method."""

    def test_get_all_todos_empty(self, redis_service):
        """Test getting all todos when none exist."""
        todos = redis_service.get_all_todos()
        assert isinstance(todos, list)
        assert len(todos) == 0

    def test_get_all_todos_single(self, redis_service, sample_todo_data):
        """Test getting all todos with one todo."""
        todo_id = "test-id-7"
        redis_service.create_todo(todo_id, sample_todo_data)

        todos = redis_service.get_all_todos()
        assert len(todos) == 1
        assert todos[0]["id"] == todo_id

    def test_get_all_todos_multiple(self, redis_service, multiple_todos):
        """Test getting all todos with multiple todos."""
        # Create multiple todos
        for idx, todo_data in enumerate(multiple_todos):
            redis_service.create_todo(f"test-id-{idx}", todo_data)

        todos = redis_service.get_all_todos()
        assert len(todos) == len(multiple_todos)

        # Verify all titles are present
        titles = [todo["title"] for todo in todos]
        expected_titles = [todo["title"] for todo in multiple_todos]
        assert sorted(titles) == sorted(expected_titles)

    def test_get_all_todos_order(self, redis_service, multiple_todos):
        """Test that todos are returned in the order they were created."""
        created_ids = []
        for idx, todo_data in enumerate(multiple_todos):
            todo_id = f"test-id-order-{idx}"
            redis_service.create_todo(todo_id, todo_data)
            created_ids.append(todo_id)

        todos = redis_service.get_all_todos()
        retrieved_ids = [todo["id"] for todo in todos]

        assert retrieved_ids == created_ids

    def test_get_all_todos_ignores_missing(self, redis_service, sample_todo_data):
        """Test that get_all_todos handles missing todos gracefully."""
        # Create a todo
        redis_service.create_todo("test-id-8", sample_todo_data)

        # Manually add a non-existent ID to the list
        redis_service.redis_client.rpush(redis_service.todo_list_key, "fake-id")

        # Should only return existing todos
        todos = redis_service.get_all_todos()
        assert len(todos) == 1
        assert todos[0]["id"] == "test-id-8"


@pytest.mark.unit
class TestUpdateTodo:
    """Tests for update_todo method."""

    def test_update_todo_title(self, redis_service, sample_todo_data):
        """Test updating only the title."""
        todo_id = "test-id-9"
        created = redis_service.create_todo(todo_id, sample_todo_data)

        update_data = {"title": "Updated Title"}
        updated = redis_service.update_todo(todo_id, update_data)

        assert updated["title"] == "Updated Title"
        assert updated["description"] == created["description"]
        assert updated["completed"] == created["completed"]

    def test_update_todo_description(self, redis_service, sample_todo_data):
        """Test updating only the description."""
        todo_id = "test-id-10"
        redis_service.create_todo(todo_id, sample_todo_data)

        update_data = {"description": "Updated description"}
        updated = redis_service.update_todo(todo_id, update_data)

        assert updated["description"] == "Updated description"

    def test_update_todo_completed(self, redis_service, sample_todo_data):
        """Test updating only the completed status."""
        todo_id = "test-id-11"
        created = redis_service.create_todo(todo_id, sample_todo_data)
        original_completed = created["completed"]

        update_data = {"completed": not original_completed}
        updated = redis_service.update_todo(todo_id, update_data)

        assert updated["completed"] == (not original_completed)

    def test_update_todo_multiple_fields(self, redis_service, sample_todo_data):
        """Test updating multiple fields at once."""
        todo_id = "test-id-12"
        redis_service.create_todo(todo_id, sample_todo_data)

        update_data = {"title": "New Title", "description": "New Description", "completed": True}
        updated = redis_service.update_todo(todo_id, update_data)

        assert updated["title"] == "New Title"
        assert updated["description"] == "New Description"
        assert updated["completed"] is True

    def test_update_todo_not_found(self, redis_service):
        """Test updating a non-existent todo returns None."""
        update_data = {"title": "New Title"}
        result = redis_service.update_todo("non-existent-id", update_data)

        assert result is None

    def test_update_todo_updates_timestamp(self, redis_service, sample_todo_data):
        """Test that updated_at timestamp changes."""
        todo_id = "test-id-13"
        created = redis_service.create_todo(todo_id, sample_todo_data)
        original_updated_at = created["updated_at"]

        # Small delay to ensure timestamp difference
        import time

        time.sleep(0.01)

        update_data = {"title": "Updated"}
        updated = redis_service.update_todo(todo_id, update_data)

        assert updated["updated_at"] != original_updated_at

    def test_update_todo_persists_in_redis(self, redis_service, sample_todo_data):
        """Test that updates are persisted in Redis."""
        todo_id = "test-id-14"
        redis_service.create_todo(todo_id, sample_todo_data)

        update_data = {"title": "Persisted Update"}
        redis_service.update_todo(todo_id, update_data)

        # Retrieve directly from Redis
        key = redis_service._get_todo_key(todo_id)
        stored_data = redis_service.redis_client.get(key)
        stored_todo = json.loads(stored_data)

        assert stored_todo["title"] == "Persisted Update"

    def test_update_todo_with_none_values(self, redis_service, sample_todo_data):
        """Test that None values in update don't change the field."""
        todo_id = "test-id-15"
        created = redis_service.create_todo(todo_id, sample_todo_data)

        update_data = {"title": None, "completed": True}
        updated = redis_service.update_todo(todo_id, update_data)

        # Title should remain unchanged
        assert updated["title"] == created["title"]
        # Completed should be updated
        assert updated["completed"] is True


@pytest.mark.unit
class TestDeleteTodo:
    """Tests for delete_todo method."""

    def test_delete_todo_success(self, redis_service, sample_todo_data):
        """Test successfully deleting a todo."""
        todo_id = "test-id-16"
        redis_service.create_todo(todo_id, sample_todo_data)

        result = redis_service.delete_todo(todo_id)

        assert result is True

    def test_delete_todo_removes_from_redis(self, redis_service, sample_todo_data):
        """Test that todo is removed from Redis."""
        todo_id = "test-id-17"
        redis_service.create_todo(todo_id, sample_todo_data)

        redis_service.delete_todo(todo_id)

        # Verify it's not in Redis
        key = redis_service._get_todo_key(todo_id)
        stored_data = redis_service.redis_client.get(key)
        assert stored_data is None

    def test_delete_todo_removes_from_list(self, redis_service, sample_todo_data):
        """Test that todo ID is removed from the list."""
        todo_id = "test-id-18"
        redis_service.create_todo(todo_id, sample_todo_data)

        redis_service.delete_todo(todo_id)

        # Verify it's not in the list
        todo_ids = redis_service.redis_client.lrange(redis_service.todo_list_key, 0, -1)
        assert todo_id not in todo_ids

    def test_delete_todo_not_found(self, redis_service):
        """Test deleting a non-existent todo returns False."""
        result = redis_service.delete_todo("non-existent-id")
        assert result is False

    def test_delete_todo_twice(self, redis_service, sample_todo_data):
        """Test that deleting a todo twice returns False on second attempt."""
        todo_id = "test-id-19"
        redis_service.create_todo(todo_id, sample_todo_data)

        first_delete = redis_service.delete_todo(todo_id)
        assert first_delete is True

        second_delete = redis_service.delete_todo(todo_id)
        assert second_delete is False

    def test_delete_one_keeps_others(self, redis_service, multiple_todos):
        """Test that deleting one todo doesn't affect others."""
        # Create multiple todos
        created_ids = []
        for idx, todo_data in enumerate(multiple_todos):
            todo_id = f"test-id-delete-{idx}"
            redis_service.create_todo(todo_id, todo_data)
            created_ids.append(todo_id)

        # Delete the first one
        redis_service.delete_todo(created_ids[0])

        # Verify others still exist
        remaining_todos = redis_service.get_all_todos()
        assert len(remaining_todos) == len(multiple_todos) - 1

        remaining_ids = [todo["id"] for todo in remaining_todos]
        assert created_ids[0] not in remaining_ids
        assert created_ids[1] in remaining_ids
        assert created_ids[2] in remaining_ids


@pytest.mark.unit
class TestHealthCheck:
    """Tests for health_check method."""

    def test_health_check_success(self, redis_service):
        """Test health check returns True when Redis is available."""
        result = redis_service.health_check()
        assert result is True

    def test_health_check_uses_ping(self, redis_service, monkeypatch):
        """Test that health check uses Redis ping command."""
        ping_called = False

        def mock_ping():
            nonlocal ping_called
            ping_called = True
            return True

        monkeypatch.setattr(redis_service.redis_client, "ping", mock_ping)

        redis_service.health_check()
        assert ping_called is True

    def test_health_check_handles_exception(self, redis_service, monkeypatch):
        """Test that health check handles exceptions gracefully."""

        def mock_ping_error():
            raise Exception("Connection error")

        monkeypatch.setattr(redis_service.redis_client, "ping", mock_ping_error)

        result = redis_service.health_check()
        assert result is False


@pytest.mark.unit
class TestRedisServiceWorkflow:
    """Integration tests for RedisService workflows."""

    def test_complete_workflow(self, redis_service, sample_todo_data):
        """Test complete create-read-update-delete workflow."""
        # Create
        todo_id = "workflow-test"
        created = redis_service.create_todo(todo_id, sample_todo_data)
        assert created["id"] == todo_id

        # Read (single)
        retrieved = redis_service.get_todo(todo_id)
        assert retrieved["id"] == todo_id

        # Read (all)
        all_todos = redis_service.get_all_todos()
        assert len(all_todos) == 1

        # Update
        updated = redis_service.update_todo(todo_id, {"completed": True})
        assert updated["completed"] is True

        # Delete
        deleted = redis_service.delete_todo(todo_id)
        assert deleted is True

        # Verify deletion
        retrieved_after_delete = redis_service.get_todo(todo_id)
        assert retrieved_after_delete is None

    def test_concurrent_operations(self, redis_service, multiple_todos):
        """Test multiple concurrent operations."""
        # Create multiple todos
        created_ids = []
        for idx, todo_data in enumerate(multiple_todos):
            todo_id = f"concurrent-{idx}"
            redis_service.create_todo(todo_id, todo_data)
            created_ids.append(todo_id)

        # Update some
        redis_service.update_todo(created_ids[0], {"completed": True})
        redis_service.update_todo(created_ids[1], {"title": "Updated"})

        # Delete one
        redis_service.delete_todo(created_ids[2])

        # Verify state
        all_todos = redis_service.get_all_todos()
        assert len(all_todos) == 2

        # Check updates persisted
        todo_0 = redis_service.get_todo(created_ids[0])
        assert todo_0["completed"] is True

        todo_1 = redis_service.get_todo(created_ids[1])
        assert todo_1["title"] == "Updated"

        # Check deletion
        todo_2 = redis_service.get_todo(created_ids[2])
        assert todo_2 is None
