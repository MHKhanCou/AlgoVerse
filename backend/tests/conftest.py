import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.models import User
from app.auth.password_utils import hash_password

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """TestClient with overridden DB dependency."""

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(client):
    """Create and return a verified test user."""
    client.post(
        "/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "TestPass123!",
        },
    )
    # Manually verify in DB
    db = TestSession()
    user = db.query(User).filter(User.email == "test@example.com").first()
    user.is_verified = True
    db.commit()
    db.close()
    return {"email": "test@example.com", "password": "TestPass123!"}


@pytest.fixture
def auth_headers(client, test_user):
    """Login and return Authorization headers."""
    resp = client.post(
        "/login",
        data={"username": test_user["email"], "password": test_user["password"]},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(client):
    """Create and return an admin user."""
    db = TestSession()
    user = User(
        name="Admin User",
        email="admin@example.com",
        password=hash_password("AdminPass123!"),
        is_verified=True,
        is_admin=True,
    )
    db.add(user)
    db.commit()
    db.close()
    return {"email": "admin@example.com", "password": "AdminPass123!"}


@pytest.fixture
def admin_headers(client, admin_user):
    """Login as admin and return Authorization headers."""
    resp = client.post(
        "/login",
        data={"username": admin_user["email"], "password": admin_user["password"]},
    )
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
