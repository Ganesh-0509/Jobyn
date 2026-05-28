"""
conftest.py — shared fixtures for CampusSync Edge backend tests.
"""

import os
import pytest
from fastapi.testclient import TestClient
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


@pytest.fixture
def client():
    """FastAPI test client."""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Headers with a valid JWT signed with the real SUPABASE_JWT_SECRET."""
    import jwt
    token = jwt.encode(
        {
            "sub": "test-user-uuid-1234",
            "email": "testuser@example.com",
            "role": "authenticated",
            "aud": "authenticated",
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_headers():
    """Headers for an admin user. Uses the first email from ADMIN_EMAILS."""
    import jwt
    from app.core.settings import settings
    admin_email = settings.ADMIN_EMAILS[0] if settings.ADMIN_EMAILS else "admin@campussync.ai"
    token = jwt.encode(
        {
            "sub": "admin-user-uuid-5678",
            "email": admin_email,
            "role": "authenticated",
            "aud": "authenticated",
        },
        JWT_SECRET,
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
