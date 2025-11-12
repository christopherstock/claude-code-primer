from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.todos import router as todos_router
from app.services.redis_service import redis_service

app = FastAPI(
    title="Todo App API",
    description="A simple Todo application API with Redis backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(todos_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Todo App API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    redis_healthy = redis_service.health_check()

    return {
        "status": "healthy" if redis_healthy else "unhealthy",
        "redis": "connected" if redis_healthy else "disconnected"
    }


@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    print("Starting Todo App API...")
    print(f"Redis connection: {'OK' if redis_service.health_check() else 'FAILED'}")


@app.on_event("shutdown")
async def shutdown_event():
    """Shutdown event handler"""
    print("Shutting down Todo App API...")
