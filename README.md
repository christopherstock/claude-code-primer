# Todo App - Full-Stack Application

A modern full-stack todo application built with FastAPI, React, and Redis.

## Technology Stack

### Backend
- **Python 3.11** - Programming language
- **FastAPI** - Modern web framework for building APIs
- **Redis** - In-memory data store for persistence
- **Pydantic** - Data validation and settings management
- **Uvicorn** - ASGI server

### Frontend
- **Node.js 20** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI components
- **TailwindCSS** - Utility-first CSS framework

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Redis 7 Alpine** - Lightweight Redis image with persistence

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── todos.py          # Todo API endpoints
│   │   ├── models/
│   │   │   └── todo.py           # Pydantic models
│   │   ├── services/
│   │   │   └── redis_service.py  # Redis operations
│   │   └── main.py               # FastAPI application
│   ├── tests/                    # Backend test suite
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ruff.toml                 # Ruff linter configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/               # Reusable UI components
│   │   │   ├── TodoDialog.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── TodoList.tsx
│   │   ├── lib/
│   │   │   ├── api.ts            # API client
│   │   │   └── utils.ts          # Utility functions
│   │   ├── pages/
│   │   │   └── HomePage.tsx      # Main page
│   │   ├── test/                 # Test utilities and mocks
│   │   ├── types/
│   │   │   └── todo.ts           # TypeScript types
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts          # Vitest test configuration
│   ├── tailwind.config.js
│   ├── .prettierrc               # Prettier configuration
│   └── .prettierignore           # Prettier ignore patterns
├── redis/
│   ├── data/                     # Redis persistence volume
│   └── redis.conf                # Redis configuration
├── docker-compose.yml            # Docker Compose configuration
└── Makefile                      # Development commands

```

## Features

### Core Functionality
- ✅ Create, read, update, and delete todos
- ✅ Mark todos as completed/incomplete
- ✅ Priority levels (high, medium, low) with visual badges
- ✅ Automatic sorting by priority for active todos
- ✅ Separate views for active and completed todos
- ✅ Persistent storage with Redis

### Technical Features
- ✅ RESTful API with FastAPI
- ✅ Modern, responsive UI with React and TailwindCSS
- ✅ Type-safe frontend with TypeScript
- ✅ Accessible UI components with Radix UI
- ✅ Containerized with Docker
- ✅ Health checks for services

### Code Quality
- ✅ Comprehensive test coverage (100% backend, 99%+ frontend)
- ✅ Backend linting with Ruff (Python)
- ✅ Frontend formatting with Prettier (TypeScript/JavaScript)
- ✅ Modern Python type hints (PEP 604)
- ✅ Automated code formatting and style checking

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### 1. Clone the repository (if applicable)

```bash
cd /path/to/project
```

### 2. Start all services

```bash
docker compose up
```

This command will:
- Build the backend (FastAPI) container
- Build the frontend (React) container
- Start the Redis container
- Set up networking between all services

### 3. Access the application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Redis**: localhost:6379

### 4. Development workflow

```bash
# Run linters
make lint

# Run tests
make test

# Format code
make format

# Run all checks (lint + test)
make check
```

### 5. Stop the services

```bash
docker compose down
```

To also remove volumes (including Redis data):

```bash
docker compose down -v
```

## API Endpoints

### Todos

- `GET /api/todos` - Get all todos
- `GET /api/todos/{id}` - Get a specific todo
- `POST /api/todos` - Create a new todo
- `PATCH /api/todos/{id}` - Update a todo
- `DELETE /api/todos/{id}` - Delete a todo

### Health Check

- `GET /health` - Check API and Redis health

## Development

### Backend Development

To run the backend in development mode with hot reload:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Make sure Redis is running on `localhost:6379`.

### Frontend Development

To run the frontend in development mode:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173.

### Environment Variables

#### Backend
- `REDIS_HOST` - Redis host (default: `redis` in Docker, `localhost` locally)
- `REDIS_PORT` - Redis port (default: `6379`)
- `REDIS_DB` - Redis database number (default: `0`)

#### Frontend
- `VITE_API_URL` - Backend API URL (default: `http://localhost:8000`)

## Docker Services

### Backend Service
- Container name: `todo-backend`
- Port: `8000`
- Hot reload enabled
- Depends on Redis

### Frontend Service
- Container name: `todo-frontend`
- Port: `5173`
- Hot reload enabled
- Depends on Backend

### Redis Service
- Container name: `todo-redis`
- Port: `6379`
- Persistence enabled (AOF + RDB)
- Health checks configured
- Data stored in `./redis/data`

## Redis Configuration

The Redis service is configured with:
- **AOF (Append Only File)**: Enabled for durability
- **RDB Snapshots**: Periodic snapshots for backup
- **Max Memory**: 256MB with LRU eviction policy
- **Persistence**: Data stored in `./redis/data` volume

## Code Quality

### Linting and Formatting

This project uses **Ruff** for Python (backend) and **Prettier** for JavaScript/TypeScript (frontend).

#### Using Makefile (Recommended)

```bash
# Run all linters
make lint

# Format all code
make format

# Run tests and linters
make check

# Backend linting only
make lint-backend

# Frontend linting only
make lint-frontend
```

#### Manual Linting

**Backend (Ruff)**:
```bash
# Check for issues
docker-compose exec backend ruff check app tests

# Auto-fix issues
docker-compose exec backend ruff check app tests --fix

# Format code
docker-compose exec backend ruff format app tests
```

**Frontend (Prettier)**:
```bash
# Check formatting
docker-compose exec frontend npm run format:check

# Format code
docker-compose exec frontend npm run format
```

### Ruff Configuration

Backend uses Ruff with the following settings (see `backend/ruff.toml`):
- Target: Python 3.11
- Line length: 100 characters
- Enabled rules: E, W, F, I, N, UP, B, C4, SIM
- Modern type hints (PEP 604): `X | None` instead of `Optional[X]`

### Prettier Configuration

Frontend uses Prettier with the following settings (see `frontend/.prettierrc`):
- Single quotes
- 100 character line width
- 2 space indentation
- Semicolons enabled
- Trailing commas (ES5)

## Testing

### Run All Tests

```bash
make test
```

### Backend Tests

```bash
# Using Makefile
make test-backend

# Or directly
cd backend
pytest

# With coverage
pytest --cov=app --cov-report=html
```

### Frontend Tests

```bash
# Using Makefile
make test-frontend

# Or directly
cd frontend
npm test

# With coverage
npm run test:coverage
```

## Building for Production

### Build all services

```bash
docker compose build
```

### Build specific service

```bash
docker compose build backend
docker compose build frontend
```

## Troubleshooting

### Port already in use

If you get port conflict errors, you can change the ports in `docker-compose.yml`.

### Redis connection issues

Check if Redis is running:

```bash
docker compose ps
```

Check Redis logs:

```bash
docker compose logs redis
```

### Backend connection issues

Check backend logs:

```bash
docker compose logs backend
```

### Frontend not connecting to backend

Make sure the `VITE_API_URL` environment variable is set correctly in `docker-compose.yml`.

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
