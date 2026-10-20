import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.middleware.rate_limit import limiter
from app.models import User
from app.auth import email_utils
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


@pytest.fixture(autouse=True)
def disable_email_delivery(monkeypatch):
    """Never let the suite open an SMTP connection to a real provider."""
    monkeypatch.setattr(email_utils, "DISABLE_EMAIL", True)


@pytest.fixture(autouse=True)
def disable_rate_limiting():
    """
    Turn off slowapi for the duration of every test.

    The limiter is process-global and keyed on the client address. TestClient
    always reports the same address, so without this the whole session shares
    a single bucket: /register allows 3/minute, and once the suite has made
    three registration calls every later call gets a 429. The test_user
    fixture then finds no user to verify and blows up in an unrelated test,
    which is why the failures only appeared in a full run and never for a
    single test file on its own.
    """
    previously_enabled = limiter.enabled
    limiter.enabled = False
    limiter.reset()
    yield
    limiter.reset()
    limiter.enabled = previously_enabled


@pytest.fixture
def db_session():
    """Direct session on the same in-memory database the API uses."""
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def rate_limits_active():
    """Re-enable slowapi for a test that asserts a 429 (the suite disables it)."""
    limiter.reset()
    limiter.enabled = True
    yield
    limiter.reset()
    limiter.enabled = False


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
    assert user is not None, (
        "test_user fixture could not find the account it just registered - "
        "registration did not return 2xx (rate limit, or the endpoint failed)"
    )
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
