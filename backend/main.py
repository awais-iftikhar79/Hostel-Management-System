import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Local modular routers
from routers import auth_router
from routers import admin_routes 
from routers import students_routes

# Initialize the core API gateway with OpenAPI documentation metadata
app = FastAPI(
    title="Hostel ERP System", 
    description="Core API gateway handling authentication, administration, and student operations.",
    version="1.0"
)

# Configure Cross-Origin Resource Sharing (CORS) for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Provision static file serving for user-uploaded assets (e.g., payment receipts)
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register modular API routers to the main application tree
app.include_router(auth_router.router)
app.include_router(admin_routes.router)
app.include_router(students_routes.router)

@app.get("/", tags=["Health Check"])
def read_root():
    """
    Base health check endpoint to verify API operational status.
    Provides navigation to the Swagger UI configuration.
    """
    return {"message": "Hostel ERP API is active. Navigate to /docs for interactive API documentation."}