from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router
from routers import admin_routes 
from routers import student_routes



app = FastAPI(title="Hostel ERP System", version="1.0")

# --- CORS SETUP ---
# This allows your React frontend to talk to this backend without getting blocked.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your React URL (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ROUTER REGISTRATION ---
app.include_router(auth_router.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Hostel ERP API. Go to /docs to test the endpoints."}

# Add this below your auth_router line:
app.include_router(admin_routes.router)

app.include_router(student_routes.router)