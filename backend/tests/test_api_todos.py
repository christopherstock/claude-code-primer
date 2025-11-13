"""
Tests for Todo API endpoints (CRUD operations).
"""
import pytest
from fastapi import status


@pytest.mark.api
class TestCreateTodo:
    """Tests for POST /api/todos/ endpoint."""

    def test_create_todo_success(self, test_client, sample_todo_create):
        """Test successful todo creation."""
        response = test_client.post("/api/todos/", json=sample_todo_create)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == sample_todo_create["title"]
        assert data["description"] == sample_todo_create["description"]
        assert data["completed"] == sample_todo_create["completed"]
        assert data["priority"] == sample_todo_create["priority"]
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_todo_minimal(self, test_client):
        """Test creating todo with only required fields."""
        todo_data = {"title": "Minimal Todo"}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["title"] == "Minimal Todo"
        assert data["description"] is None
        assert data["completed"] is False
        assert data["priority"] == "medium"  # Default priority

    def test_create_todo_completed(self, test_client):
        """Test creating a todo that's already completed."""
        todo_data = {
            "title": "Already Done",
            "description": "This was done before creation",
            "completed": True,
        }
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["completed"] is True

    def test_create_todo_empty_title_fails(self, test_client):
        """Test that creating todo with empty title fails validation."""
        todo_data = {"title": ""}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_todo_no_title_fails(self, test_client):
        """Test that creating todo without title fails validation."""
        todo_data = {"description": "No title provided"}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_todo_title_too_long_fails(self, test_client):
        """Test that creating todo with too long title fails validation."""
        todo_data = {"title": "x" * 201}  # Max is 200
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_todo_description_too_long_fails(self, test_client):
        """Test that creating todo with too long description fails validation."""
        todo_data = {
            "title": "Valid Title",
            "description": "x" * 1001,  # Max is 1000
        }
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_multiple_todos(self, test_client, multiple_todos):
        """Test creating multiple todos."""
        created_ids = []

        for todo_data in multiple_todos:
            response = test_client.post("/api/todos/", json=todo_data)
            assert response.status_code == status.HTTP_201_CREATED
            created_ids.append(response.json()["id"])

        # All IDs should be unique
        assert len(created_ids) == len(set(created_ids))


@pytest.mark.api
class TestGetAllTodos:
    """Tests for GET /api/todos/ endpoint."""

    def test_get_all_todos_empty(self, test_client):
        """Test getting all todos when none exist."""
        response = test_client.get("/api/todos/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0

    def test_get_all_todos_with_data(self, test_client, sample_todo_create):
        """Test getting all todos when some exist."""
        # Create a todo first
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        assert create_response.status_code == status.HTTP_201_CREATED

        # Get all todos
        response = test_client.get("/api/todos/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["title"] == sample_todo_create["title"]

    def test_get_all_todos_multiple(self, test_client, multiple_todos):
        """Test getting all todos with multiple items."""
        # Create multiple todos
        for todo_data in multiple_todos:
            test_client.post("/api/todos/", json=todo_data)

        # Get all todos
        response = test_client.get("/api/todos/")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == len(multiple_todos)

        # Verify all titles are present
        titles = [todo["title"] for todo in data]
        expected_titles = [todo["title"] for todo in multiple_todos]
        assert sorted(titles) == sorted(expected_titles)

    def test_get_all_todos_response_structure(self, test_client, sample_todo_create):
        """Test that todos in list have correct structure."""
        test_client.post("/api/todos/", json=sample_todo_create)
        response = test_client.get("/api/todos/")

        data = response.json()
        todo = data[0]
        assert "id" in todo
        assert "title" in todo
        assert "description" in todo
        assert "completed" in todo
        assert "priority" in todo
        assert "created_at" in todo
        assert "updated_at" in todo


@pytest.mark.api
class TestGetTodoById:
    """Tests for GET /api/todos/{todo_id} endpoint."""

    def test_get_todo_by_id_success(self, test_client, sample_todo_create):
        """Test getting a specific todo by ID."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        created_todo = create_response.json()
        todo_id = created_todo["id"]

        # Get the todo by ID
        response = test_client.get(f"/api/todos/{todo_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == todo_id
        assert data["title"] == sample_todo_create["title"]
        assert data["description"] == sample_todo_create["description"]

    def test_get_todo_not_found(self, test_client):
        """Test getting a non-existent todo returns 404."""
        fake_id = "non-existent-id"
        response = test_client.get(f"/api/todos/{fake_id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        data = response.json()
        assert "detail" in data
        assert fake_id in data["detail"]

    def test_get_todo_after_deletion(self, test_client, sample_todo_create):
        """Test getting a todo after it's been deleted returns 404."""
        # Create and then delete a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]
        test_client.delete(f"/api/todos/{todo_id}")

        # Try to get the deleted todo
        response = test_client.get(f"/api/todos/{todo_id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.api
class TestUpdateTodo:
    """Tests for PATCH /api/todos/{todo_id} endpoint."""

    def test_update_todo_title(self, test_client, sample_todo_create):
        """Test updating only the title of a todo."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        # Update the title
        update_data = {"title": "Updated Title"}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["description"] == sample_todo_create["description"]
        assert data["completed"] == sample_todo_create["completed"]

    def test_update_todo_description(self, test_client, sample_todo_create):
        """Test updating only the description of a todo."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        update_data = {"description": "Updated description"}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["title"] == sample_todo_create["title"]

    def test_update_todo_completed_status(self, test_client, sample_todo_create):
        """Test toggling the completed status of a todo."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]
        original_completed = create_response.json()["completed"]

        update_data = {"completed": not original_completed}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["completed"] == (not original_completed)

    def test_update_todo_multiple_fields(self, test_client, sample_todo_create):
        """Test updating multiple fields at once."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        update_data = {"title": "New Title", "description": "New Description", "completed": True}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == "New Title"
        assert data["description"] == "New Description"
        assert data["completed"] is True

    def test_update_todo_not_found(self, test_client):
        """Test updating a non-existent todo returns 404."""
        fake_id = "non-existent-id"
        update_data = {"title": "New Title"}
        response = test_client.patch(f"/api/todos/{fake_id}", json=update_data)

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_todo_empty_title_fails(self, test_client, sample_todo_create):
        """Test updating todo with empty title fails validation."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        update_data = {"title": ""}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_update_todo_updated_at_changes(self, test_client, sample_todo_create):
        """Test that updated_at timestamp changes after update."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]
        original_updated_at = create_response.json()["updated_at"]

        # Small delay to ensure timestamp difference
        import time

        time.sleep(0.01)

        update_data = {"title": "Updated"}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        data = response.json()
        assert data["updated_at"] != original_updated_at

    def test_update_todo_empty_payload(self, test_client, sample_todo_create):
        """Test updating todo with empty payload doesn't change anything."""
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]
        original_data = create_response.json()

        update_data = {}
        response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == original_data["title"]
        assert data["description"] == original_data["description"]
        assert data["completed"] == original_data["completed"]


@pytest.mark.api
class TestDeleteTodo:
    """Tests for DELETE /api/todos/{todo_id} endpoint."""

    def test_delete_todo_success(self, test_client, sample_todo_create):
        """Test successfully deleting a todo."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        # Delete the todo
        response = test_client.delete(f"/api/todos/{todo_id}")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_delete_todo_not_found(self, test_client):
        """Test deleting a non-existent todo returns 404."""
        fake_id = "non-existent-id"
        response = test_client.delete(f"/api/todos/{fake_id}")

        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_todo_removes_from_list(self, test_client, sample_todo_create):
        """Test that deleted todo is removed from the list."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        # Verify it's in the list
        get_response = test_client.get("/api/todos/")
        assert len(get_response.json()) == 1

        # Delete the todo
        test_client.delete(f"/api/todos/{todo_id}")

        # Verify it's not in the list
        get_response = test_client.get("/api/todos/")
        assert len(get_response.json()) == 0

    def test_delete_todo_twice_fails(self, test_client, sample_todo_create):
        """Test that deleting a todo twice returns 404 on second attempt."""
        # Create and delete a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]
        delete_response = test_client.delete(f"/api/todos/{todo_id}")
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Try to delete again
        second_delete_response = test_client.delete(f"/api/todos/{todo_id}")
        assert second_delete_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_one_of_many(self, test_client, multiple_todos):
        """Test deleting one todo from multiple doesn't affect others."""
        # Create multiple todos
        created_ids = []
        for todo_data in multiple_todos:
            response = test_client.post("/api/todos/", json=todo_data)
            created_ids.append(response.json()["id"])

        # Delete the first one
        test_client.delete(f"/api/todos/{created_ids[0]}")

        # Verify others still exist
        get_response = test_client.get("/api/todos/")
        remaining_todos = get_response.json()
        assert len(remaining_todos) == len(multiple_todos) - 1
        remaining_ids = [todo["id"] for todo in remaining_todos]
        assert created_ids[0] not in remaining_ids
        assert created_ids[1] in remaining_ids
        assert created_ids[2] in remaining_ids


@pytest.mark.api
class TestTodoWorkflow:
    """Integration tests for complete todo workflows."""

    def test_complete_crud_workflow(self, test_client):
        """Test complete Create-Read-Update-Delete workflow."""
        # Create
        create_data = {"title": "Workflow Todo", "description": "Test workflow"}
        create_response = test_client.post("/api/todos/", json=create_data)
        assert create_response.status_code == status.HTTP_201_CREATED
        todo_id = create_response.json()["id"]

        # Read (single)
        get_response = test_client.get(f"/api/todos/{todo_id}")
        assert get_response.status_code == status.HTTP_200_OK
        assert get_response.json()["title"] == "Workflow Todo"

        # Read (all)
        get_all_response = test_client.get("/api/todos/")
        assert get_all_response.status_code == status.HTTP_200_OK
        assert len(get_all_response.json()) == 1

        # Update
        update_data = {"completed": True}
        update_response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)
        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["completed"] is True

        # Delete
        delete_response = test_client.delete(f"/api/todos/{todo_id}")
        assert delete_response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deletion
        get_deleted_response = test_client.get(f"/api/todos/{todo_id}")
        assert get_deleted_response.status_code == status.HTTP_404_NOT_FOUND

    def test_multiple_users_scenario(self, test_client):
        """Test scenario with multiple concurrent todos."""
        # Create several todos
        todos_data = [
            {"title": "User 1 Todo 1", "completed": False},
            {"title": "User 1 Todo 2", "completed": True},
            {"title": "User 2 Todo 1", "completed": False},
        ]

        created_ids = []
        for todo_data in todos_data:
            response = test_client.post("/api/todos/", json=todo_data)
            created_ids.append(response.json()["id"])

        # Verify all are retrievable
        get_all_response = test_client.get("/api/todos/")
        assert len(get_all_response.json()) == 3

        # Update one
        test_client.patch(f"/api/todos/{created_ids[0]}", json={"completed": True})

        # Delete another
        test_client.delete(f"/api/todos/{created_ids[1]}")

        # Verify final state
        final_response = test_client.get("/api/todos/")
        final_todos = final_response.json()
        assert len(final_todos) == 2

        # Check that deleted todo is not in list
        final_ids = [todo["id"] for todo in final_todos]
        assert created_ids[1] not in final_ids


@pytest.mark.api
class TestTodoPriority:
    """Tests for todo priority field."""

    def test_create_todo_with_high_priority(self, test_client):
        """Test creating todo with high priority."""
        todo_data = {
            "title": "High Priority Task",
            "description": "This is urgent",
            "priority": "high",
        }
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["priority"] == "high"

    def test_create_todo_with_low_priority(self, test_client):
        """Test creating todo with low priority."""
        todo_data = {"title": "Low Priority Task", "priority": "low"}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["priority"] == "low"

    def test_create_todo_default_priority(self, test_client):
        """Test that todo gets medium priority by default."""
        todo_data = {"title": "No Priority Specified"}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["priority"] == "medium"

    def test_update_todo_priority(self, test_client, sample_todo_create):
        """Test updating todo priority."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        # Update priority to high
        update_data = {"priority": "high"}
        update_response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert update_response.status_code == status.HTTP_200_OK
        data = update_response.json()
        assert data["priority"] == "high"
        assert data["title"] == sample_todo_create["title"]  # Other fields unchanged

    def test_create_todo_invalid_priority(self, test_client):
        """Test that invalid priority value fails validation."""
        todo_data = {
            "title": "Invalid Priority",
            "priority": "urgent",  # Not a valid priority
        }
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_get_todos_includes_priority(self, test_client):
        """Test that getting todos includes priority field."""
        # Create todos with different priorities
        todos_data = [
            {"title": "High Priority", "priority": "high"},
            {"title": "Medium Priority", "priority": "medium"},
            {"title": "Low Priority", "priority": "low"},
        ]

        for todo_data in todos_data:
            test_client.post("/api/todos/", json=todo_data)

        # Get all todos
        response = test_client.get("/api/todos/")
        todos = response.json()

        assert len(todos) == 3
        priorities = [todo["priority"] for todo in todos]
        assert "high" in priorities
        assert "medium" in priorities
        assert "low" in priorities

    def test_update_todo_priority_to_low(self, test_client):
        """Test updating priority from high to low."""
        # Create high priority todo
        todo_data = {"title": "Downgrade Priority", "priority": "high"}
        create_response = test_client.post("/api/todos/", json=todo_data)
        todo_id = create_response.json()["id"]

        # Update to low priority
        update_response = test_client.patch(f"/api/todos/{todo_id}", json={"priority": "low"})

        assert update_response.status_code == status.HTTP_200_OK
        assert update_response.json()["priority"] == "low"


@pytest.mark.api
class TestTodoDone:
    """Tests for todo done field."""

    def test_create_todo_done_default(self, test_client):
        """Test that done defaults to False."""
        todo_data = {"title": "Test Done Field"}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["done"] is False

    def test_create_todo_with_done_true(self, test_client):
        """Test creating todo with done=True."""
        todo_data = {"title": "Already Done", "done": True}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["done"] is True

    def test_update_todo_done_status(self, test_client, sample_todo_create):
        """Test updating todo done status."""
        # Create a todo
        create_response = test_client.post("/api/todos/", json=sample_todo_create)
        todo_id = create_response.json()["id"]

        # Update done to True
        update_data = {"done": True}
        update_response = test_client.patch(f"/api/todos/{todo_id}", json=update_data)

        assert update_response.status_code == status.HTTP_200_OK
        data = update_response.json()
        assert data["done"] is True

    def test_done_and_completed_are_independent(self, test_client):
        """Test that done and completed fields are independent."""
        # Create todo with done=True but completed=False
        todo_data = {"title": "Test Independence", "done": True, "completed": False}
        response = test_client.post("/api/todos/", json=todo_data)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["done"] is True
        assert data["completed"] is False
