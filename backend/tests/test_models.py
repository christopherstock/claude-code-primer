"""
Tests for Pydantic models (TodoBase, TodoCreate, TodoUpdate, TodoInDB, TodoResponse).
"""
from datetime import datetime

import pytest
from pydantic import ValidationError

from app.models.todo import Priority, TodoBase, TodoCreate, TodoInDB, TodoResponse, TodoUpdate


@pytest.mark.unit
class TestTodoBase:
    """Tests for TodoBase model."""

    def test_create_todo_base_valid(self):
        """Test creating a valid TodoBase instance."""
        todo = TodoBase(title="Test Todo", description="Test description", completed=False)

        assert todo.title == "Test Todo"
        assert todo.description == "Test description"
        assert todo.completed is False

    def test_create_todo_base_minimal(self):
        """Test creating TodoBase with only required fields."""
        todo = TodoBase(title="Minimal Todo")

        assert todo.title == "Minimal Todo"
        assert todo.description is None
        assert todo.completed is False  # Default value

    def test_create_todo_base_completed_default(self):
        """Test that completed defaults to False."""
        todo = TodoBase(title="Test")

        assert todo.completed is False

    def test_todo_base_title_required(self):
        """Test that title is required."""
        with pytest.raises(ValidationError) as exc_info:
            TodoBase()

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("title",) for error in errors)

    def test_todo_base_empty_title_fails(self):
        """Test that empty title fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            TodoBase(title="")

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("title",) and "at least 1 character" in str(error["msg"]).lower()
            for error in errors
        )

    def test_todo_base_title_too_long_fails(self):
        """Test that title longer than 200 characters fails validation."""
        long_title = "x" * 201

        with pytest.raises(ValidationError) as exc_info:
            TodoBase(title=long_title)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("title",) and "at most 200 character" in str(error["msg"]).lower()
            for error in errors
        )

    def test_todo_base_title_max_length_valid(self):
        """Test that title with exactly 200 characters is valid."""
        max_title = "x" * 200

        todo = TodoBase(title=max_title)
        assert len(todo.title) == 200

    def test_todo_base_description_too_long_fails(self):
        """Test that description longer than 1000 characters fails validation."""
        long_description = "x" * 1001

        with pytest.raises(ValidationError) as exc_info:
            TodoBase(title="Test", description=long_description)

        errors = exc_info.value.errors()
        assert any(
            error["loc"] == ("description",)
            and "at most 1000 character" in str(error["msg"]).lower()
            for error in errors
        )

    def test_todo_base_description_max_length_valid(self):
        """Test that description with exactly 1000 characters is valid."""
        max_description = "x" * 1000

        todo = TodoBase(title="Test", description=max_description)
        assert len(todo.description) == 1000

    def test_todo_base_description_optional(self):
        """Test that description is optional."""
        todo = TodoBase(title="Test")
        assert todo.description is None

    def test_todo_base_completed_boolean(self):
        """Test that completed must be a boolean."""
        with pytest.raises(ValidationError) as exc_info:
            TodoBase(title="Test", completed="not a boolean")

        errors = exc_info.value.errors()
        assert any(error["loc"] == ("completed",) for error in errors)

    def test_todo_base_completed_values(self):
        """Test both True and False values for completed."""
        todo_incomplete = TodoBase(title="Test", completed=False)
        todo_complete = TodoBase(title="Test", completed=True)

        assert todo_incomplete.completed is False
        assert todo_complete.completed is True


@pytest.mark.unit
class TestTodoCreate:
    """Tests for TodoCreate model."""

    def test_todo_create_inherits_from_base(self):
        """Test that TodoCreate has same validation as TodoBase."""
        todo = TodoCreate(title="Create Test", description="Description", completed=True)

        assert todo.title == "Create Test"
        assert todo.description == "Description"
        assert todo.completed is True

    def test_todo_create_validation(self):
        """Test that TodoCreate inherits validation rules."""
        with pytest.raises(ValidationError):
            TodoCreate(title="")  # Empty title should fail

        with pytest.raises(ValidationError):
            TodoCreate(title="x" * 201)  # Too long title should fail


@pytest.mark.unit
class TestTodoUpdate:
    """Tests for TodoUpdate model."""

    def test_todo_update_all_fields_optional(self):
        """Test that all fields in TodoUpdate are optional."""
        # Should not raise any errors
        todo_update = TodoUpdate()

        assert todo_update.title is None
        assert todo_update.description is None
        assert todo_update.completed is None

    def test_todo_update_partial_update(self):
        """Test updating only some fields."""
        update_title = TodoUpdate(title="Updated Title")
        assert update_title.title == "Updated Title"
        assert update_title.description is None
        assert update_title.completed is None

        update_completed = TodoUpdate(completed=True)
        assert update_completed.title is None
        assert update_completed.completed is True

    def test_todo_update_title_validation(self):
        """Test that title validation still applies when provided."""
        with pytest.raises(ValidationError):
            TodoUpdate(title="")  # Empty title should fail

        with pytest.raises(ValidationError):
            TodoUpdate(title="x" * 201)  # Too long title should fail

    def test_todo_update_description_validation(self):
        """Test that description validation still applies when provided."""
        with pytest.raises(ValidationError):
            TodoUpdate(description="x" * 1001)  # Too long description should fail

    def test_todo_update_all_fields(self):
        """Test updating all fields at once."""
        todo_update = TodoUpdate(title="New Title", description="New Description", completed=True)

        assert todo_update.title == "New Title"
        assert todo_update.description == "New Description"
        assert todo_update.completed is True

    def test_todo_update_model_dump_exclude_unset(self):
        """Test that exclude_unset works correctly."""
        update = TodoUpdate(title="Only Title")
        dumped = update.model_dump(exclude_unset=True)

        assert "title" in dumped
        assert "description" not in dumped
        assert "completed" not in dumped


@pytest.mark.unit
class TestTodoInDB:
    """Tests for TodoInDB model."""

    def test_todo_in_db_required_fields(self):
        """Test that TodoInDB requires id and timestamps."""
        with pytest.raises(ValidationError) as exc_info:
            TodoInDB(title="Test")

        errors = exc_info.value.errors()
        error_fields = [error["loc"][0] for error in errors]
        assert "id" in error_fields

    def test_todo_in_db_with_all_fields(self):
        """Test creating TodoInDB with all fields."""
        now = datetime.utcnow()

        todo = TodoInDB(
            id="test-id-123",
            title="Test Todo",
            description="Test description",
            completed=False,
            created_at=now,
            updated_at=now,
        )

        assert todo.id == "test-id-123"
        assert todo.title == "Test Todo"
        assert todo.created_at == now
        assert todo.updated_at == now

    def test_todo_in_db_timestamps_default(self):
        """Test that timestamps have default values."""
        todo = TodoInDB(id="test-id", title="Test", completed=False)

        assert isinstance(todo.created_at, datetime)
        assert isinstance(todo.updated_at, datetime)

    def test_todo_in_db_id_type(self):
        """Test that id must be a string."""
        # Should work with string
        todo = TodoInDB(id="string-id", title="Test", completed=False)
        assert isinstance(todo.id, str)

        # Pydantic 2.x is strict about types by default - int won't auto-convert
        # This should raise a validation error
        with pytest.raises(ValidationError):
            TodoInDB(id=123, title="Test", completed=False)

    def test_todo_in_db_json_encoders(self):
        """Test that datetime fields are properly encoded to ISO format."""
        now = datetime.utcnow()
        todo = TodoInDB(id="test-id", title="Test", completed=False, created_at=now, updated_at=now)

        # Use model_dump with mode='json' to apply json encoders
        json_data = todo.model_dump(mode="json")

        # Timestamps should be ISO format strings
        assert isinstance(json_data["created_at"], str)
        assert isinstance(json_data["updated_at"], str)

        # Should be parseable back to datetime
        parsed_created = datetime.fromisoformat(json_data["created_at"].replace("Z", "+00:00"))
        assert isinstance(parsed_created, datetime)

    def test_todo_in_db_inherits_validation(self):
        """Test that TodoInDB inherits validation from TodoBase."""
        with pytest.raises(ValidationError):
            TodoInDB(id="test", title="", completed=False)  # Empty title

        with pytest.raises(ValidationError):
            TodoInDB(id="test", title="x" * 201, completed=False)  # Too long title


@pytest.mark.unit
class TestTodoResponse:
    """Tests for TodoResponse model."""

    def test_todo_response_inherits_from_todo_in_db(self):
        """Test that TodoResponse has same structure as TodoInDB."""
        now = datetime.utcnow()

        response = TodoResponse(
            id="response-id",
            title="Response Todo",
            description="Description",
            completed=True,
            created_at=now,
            updated_at=now,
        )

        assert response.id == "response-id"
        assert response.title == "Response Todo"
        assert response.description == "Description"
        assert response.completed is True
        assert isinstance(response.created_at, datetime)
        assert isinstance(response.updated_at, datetime)

    def test_todo_response_json_serialization(self):
        """Test that TodoResponse can be serialized to JSON."""
        response = TodoResponse(
            id="test-id", title="Test", description="Description", completed=False
        )

        json_data = response.model_dump(mode="json")

        assert json_data["id"] == "test-id"
        assert json_data["title"] == "Test"
        assert isinstance(json_data["created_at"], str)
        assert isinstance(json_data["updated_at"], str)

    def test_todo_response_validation(self):
        """Test that TodoResponse has same validation as TodoInDB."""
        with pytest.raises(ValidationError):
            TodoResponse(title="Test", completed=False)  # Missing id

        with pytest.raises(ValidationError):
            TodoResponse(id="test", title="", completed=False)  # Empty title


@pytest.mark.unit
class TestModelRelationships:
    """Tests for relationships between models."""

    def test_create_to_response_workflow(self):
        """Test converting from TodoCreate to TodoResponse workflow."""
        # Create
        create_data = TodoCreate(title="New Todo", description="Description", completed=False)

        # Simulate DB storage (adding id and timestamps)
        now = datetime.utcnow()
        response = TodoResponse(
            id="generated-id",
            title=create_data.title,
            description=create_data.description,
            completed=create_data.completed,
            created_at=now,
            updated_at=now,
        )

        assert response.title == create_data.title
        assert response.description == create_data.description
        assert response.completed == create_data.completed
        assert response.id == "generated-id"

    def test_update_to_response_workflow(self):
        """Test applying TodoUpdate to TodoResponse."""
        # Original todo
        original = TodoResponse(
            id="test-id",
            title="Original Title",
            description="Original Description",
            completed=False,
        )

        # Update
        update = TodoUpdate(title="Updated Title", completed=True)

        # Apply update (simulate)
        update_data = update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(original, key, value)

        assert original.title == "Updated Title"
        assert original.description == "Original Description"  # Unchanged
        assert original.completed is True

    def test_all_models_have_title(self):
        """Test that all models include title field."""
        create = TodoCreate(title="Test")
        assert hasattr(create, "title")

        update = TodoUpdate(title="Test")
        assert hasattr(update, "title")

        in_db = TodoInDB(id="test", title="Test", completed=False)
        assert hasattr(in_db, "title")

        response = TodoResponse(id="test", title="Test", completed=False)
        assert hasattr(response, "title")

    def test_model_dump_compatibility(self):
        """Test that model_dump works for all models."""
        create = TodoCreate(title="Test")
        assert isinstance(create.model_dump(), dict)

        update = TodoUpdate(title="Test")
        assert isinstance(update.model_dump(), dict)

        response = TodoResponse(id="test", title="Test", completed=False)
        assert isinstance(response.model_dump(), dict)


@pytest.mark.unit
class TestPriority:
    """Tests for Priority enum and priority field."""

    def test_priority_enum_values(self):
        """Test that Priority enum has expected values."""
        assert Priority.LOW == "low"
        assert Priority.MEDIUM == "medium"
        assert Priority.HIGH == "high"

    def test_priority_default_value(self):
        """Test that priority defaults to medium."""
        todo = TodoBase(title="Test")
        assert todo.priority == Priority.MEDIUM

    def test_priority_all_values(self):
        """Test creating todos with all priority values."""
        todo_low = TodoBase(title="Low Priority", priority=Priority.LOW)
        assert todo_low.priority == Priority.LOW

        todo_medium = TodoBase(title="Medium Priority", priority=Priority.MEDIUM)
        assert todo_medium.priority == Priority.MEDIUM

        todo_high = TodoBase(title="High Priority", priority=Priority.HIGH)
        assert todo_high.priority == Priority.HIGH

    def test_priority_with_string(self):
        """Test creating todo with priority as string."""
        todo = TodoBase(title="Test", priority="high")
        assert todo.priority == Priority.HIGH

    def test_priority_invalid_value(self):
        """Test that invalid priority value fails validation."""
        with pytest.raises(ValidationError) as exc_info:
            TodoBase(title="Test", priority="invalid")

        errors = exc_info.value.errors()
        assert any("priority" in str(error["loc"]) for error in errors)

    def test_priority_in_todo_create(self):
        """Test priority field in TodoCreate."""
        todo = TodoCreate(title="Test", priority=Priority.HIGH)
        assert todo.priority == Priority.HIGH

        # Test default
        todo_default = TodoCreate(title="Test")
        assert todo_default.priority == Priority.MEDIUM

    def test_priority_in_todo_update(self):
        """Test priority field in TodoUpdate."""
        update = TodoUpdate(priority=Priority.LOW)
        assert update.priority == Priority.LOW

        # Test optional
        update_no_priority = TodoUpdate(title="Updated")
        assert not hasattr(update_no_priority, "priority") or update_no_priority.priority is None

    def test_priority_in_todo_in_db(self):
        """Test priority field in TodoInDB."""
        todo = TodoInDB(id="test-id", title="Test", completed=False, priority=Priority.HIGH)
        assert todo.priority == Priority.HIGH

    def test_priority_in_todo_response(self):
        """Test priority field in TodoResponse."""
        response = TodoResponse(id="test-id", title="Test", completed=False, priority=Priority.LOW)
        assert response.priority == Priority.LOW

    def test_done_field_default(self):
        """Test that done field defaults to False."""
        todo = TodoBase(title="Test")
        assert todo.done is False

    def test_done_field_all_models(self):
        """Test done field in all models."""
        # TodoCreate
        create = TodoCreate(title="Test", done=True)
        assert create.done is True

        # TodoUpdate
        update = TodoUpdate(done=True)
        assert update.done is True

        # TodoInDB
        in_db = TodoInDB(id="test", title="Test", completed=False, done=True)
        assert in_db.done is True

        # TodoResponse
        response = TodoResponse(id="test", title="Test", completed=False, done=True)
        assert response.done is True
