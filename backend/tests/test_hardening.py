"""Tests for the production-safety behaviour added on top of the API surface.

Covers two things that are easy to regress because they are invisible in a
passing request: the browser-facing security headers, and the boot-time refusal
to run production without a JWT signing key.
"""

from pathlib import Path

import pytest

from app.core.config import Settings
from app.routes import contests

EXPECTED_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
}


class TestSecurityHeaders:
    def test_present_on_success(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        for name, value in EXPECTED_HEADERS.items():
            assert resp.headers.get(name) == value

    def test_present_on_error(self, client):
        # An error response is still a browser-visible response. Headers that
        # only appear on the happy path are the ones that matter least.
        resp = client.get("/no-such-route-exists")
        assert resp.status_code == 404
        for name, value in EXPECTED_HEADERS.items():
            assert resp.headers.get(name) == value

    def test_present_on_an_authenticated_failure(self, client):
        # 401s are produced by an HTTPException deep inside a dependency; make
        # sure the headers survive that path too.
        resp = client.get("/admin/user-stats")
        assert resp.status_code == 401
        assert resp.headers.get("X-Content-Type-Options") == "nosniff"


class TestProductionValidation:
    """Settings.validate_for_production guards the deploy configuration."""

    def test_empty_jwt_secret_is_fatal_in_production(self):
        # Explicit kwargs so the local backend/.env cannot change the outcome.
        prod = Settings(ENVIRONMENT="production", JWT_SECRET_KEY="")
        assert prod.is_production is True
        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY"):
            prod.validate_for_production()

    def test_signing_key_set_passes_in_production(self):
        prod = Settings(ENVIRONMENT="production", JWT_SECRET_KEY="a" * 64)
        prod.validate_for_production()  # must not raise

    def test_development_tolerates_a_missing_secret(self):
        # The suite itself runs without a signing key in CI, so this must stay
        # permissive outside production.
        dev = Settings(
            ENVIRONMENT="development",
            JWT_SECRET_KEY="",
            DATABASE_URL="",
            PROD_DATABASE_URL="",
        )
        assert dev.is_production is False
        dev.validate_for_production()  # must not raise


class TestPublicUserProjection:
    """The anonymous /users routes must not expose accounts' email addresses."""

    def test_user_list_hides_email_and_role(self, client, test_user):
        resp = client.get("/users/")
        assert resp.status_code == 200
        assert test_user["email"] not in resp.text
        assert '"is_admin"' not in resp.text
        assert '"email"' not in resp.text

    def test_user_detail_hides_email_and_role(self, client, test_user):
        resp = client.get("/users/1")
        assert resp.status_code == 200
        body = resp.json()
        assert body["name"] == "Test User"
        assert test_user["email"] not in resp.text
        assert "email" not in body
        assert "is_admin" not in body

    def test_user_profile_hides_email_but_keeps_progress(self, client, test_user):
        resp = client.get("/users/1/profile")
        assert resp.status_code == 200
        body = resp.json()
        assert "progress" in body
        assert test_user["email"] not in resp.text

    def test_public_profile_is_unchanged(self, client, test_user):
        # The one route the frontend does call; it must keep working.
        resp = client.get("/users/1/public")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test User"


class TestDirectUserCreation:
    """POST /users/ bypasses /register's rate limit and OTP mail."""

    NEW_USER = {
        "name": "Direct User",
        "email": "direct@example.com",
        "password": "StrongPass123!",
    }

    def test_anonymous_creation_is_rejected(self, client):
        resp = client.post("/users/", json=self.NEW_USER)
        assert resp.status_code == 401

    def test_non_admin_creation_is_rejected(self, client, auth_headers):
        resp = client.post("/users/", json=self.NEW_USER, headers=auth_headers)
        assert resp.status_code == 403

    def test_admin_creation_still_works(self, client, admin_headers):
        resp = client.post("/users/", json=self.NEW_USER, headers=admin_headers)
        assert resp.status_code == 201
        assert resp.json()["name"] == "Direct User"
        # The response is a public projection, so it must not echo the address.
        assert "email" not in resp.json()


class TestDotenvLoader:
    """app/routes/contests.py loads backend/.env into os.environ at import."""

    def test_env_file_resolves_to_the_backend_directory(self):
        # The loader's target must be the directory that contains app/, i.e.
        # backend/. It was previously backend/app, so the file never existed and
        # REDIS_* from .env never reached os.getenv() in redis_client.py.
        assert contests.ENV_FILE.parent == Path(contests.__file__).resolve().parents[2]
        assert (contests.ENV_FILE.parent / "app").is_dir()
        assert contests.ENV_FILE.name == ".env"

    def test_loader_does_not_override_existing_environment(self, monkeypatch, tmp_path):
        env_file = tmp_path / ".env"
        env_file.write_text("ALGOVERSE_LOADER_PROBE=from-file\n", encoding="utf-8")
        monkeypatch.setenv("ALGOVERSE_LOADER_PROBE", "from-process")
        monkeypatch.setattr(contests, "ENV_FILE", env_file)
        monkeypatch.setattr(contests, "os", __import__("os"))

        contests._load_dotenv_into_environ()

        assert __import__("os").environ["ALGOVERSE_LOADER_PROBE"] == "from-process"

    def test_loader_reads_values_not_already_set(self, monkeypatch, tmp_path):
        env_file = tmp_path / ".env"
        env_file.write_text("ALGOVERSE_LOADER_PROBE_2=from-file\n", encoding="utf-8")
        monkeypatch.delenv("ALGOVERSE_LOADER_PROBE_2", raising=False)
        monkeypatch.setattr(contests, "ENV_FILE", env_file)
        monkeypatch.setattr(contests, "os", __import__("os"))

        contests._load_dotenv_into_environ()

        assert __import__("os").environ["ALGOVERSE_LOADER_PROBE_2"] == "from-file"
