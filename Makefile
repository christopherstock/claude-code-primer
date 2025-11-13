.PHONY: help test lint format check clean

help:
	@echo "Available commands:"
	@echo "  make test          - Run all tests (backend + frontend)"
	@echo "  make lint          - Run all linters (Ruff + Prettier check)"
	@echo "  make format        - Format all code (Ruff + Prettier)"
	@echo "  make check         - Run tests and linters"
	@echo "  make test-backend  - Run backend tests only"
	@echo "  make test-frontend - Run frontend tests only"
	@echo "  make lint-backend  - Run Ruff linter on backend"
	@echo "  make lint-frontend - Run Prettier check on frontend"
	@echo "  make format-backend - Format backend code with Ruff"
	@echo "  make format-frontend - Format frontend code with Prettier"
	@echo "  make clean         - Remove test coverage and cache files"

# Test commands
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	docker-compose exec backend pytest -v

test-frontend:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test

# Lint commands
lint: lint-backend lint-frontend

lint-backend:
	@echo "Running Ruff linter on backend..."
	docker-compose exec backend ruff check app tests

lint-frontend:
	@echo "Running Prettier check on frontend..."
	docker-compose exec frontend npm run format:check

# Format commands
format: format-backend format-frontend

format-backend:
	@echo "Formatting backend code with Ruff..."
	docker-compose exec backend ruff check app tests --fix
	docker-compose exec backend ruff format app tests

format-frontend:
	@echo "Formatting frontend code with Prettier..."
	docker-compose exec frontend npm run format

# Combined check (test + lint)
check: lint test
	@echo "All checks passed!"

# Clean commands
clean:
	@echo "Cleaning test coverage and cache files..."
	find ./backend -type d -name "__pycache__" -exec rm -r {} +
	find ./backend -type d -name ".pytest_cache" -exec rm -r {} +
	find ./backend -type d -name ".ruff_cache" -exec rm -r {} +
	find ./backend -type f -name ".coverage" -delete
	find ./backend -type d -name "htmlcov" -exec rm -r {} +
	find ./frontend -type d -name "coverage" -exec rm -r {} +
	find ./frontend -type d -name ".nyc_output" -exec rm -r {} +
	@echo "Cleanup complete!"
