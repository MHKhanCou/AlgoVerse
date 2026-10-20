"""Regression tests for the production-readiness fixes tracked in ROADMAP.md.

Each class here corresponds to a concrete defect that is invisible in a
happy-path request: a response that overstates what happened, a liveness probe
that is green with a dead database, and log lines that carry account data.
"""

from app.auth.email_utils import get_token_expiry_time
from app.auth.jwt_token import create_access_token
from app.db import get_db
from app.main import app
from app.models import User
from app.routes import authentication

import logging

from sqlalchemy.exc import SQLAlchemyError


def _register(client, email, name="New User"):
    return client.post(
        "/register",
        json={"name": name, "email": email, "password": "StrongPass123!"},
    )


def _login(client, email, password):
    resp = client.post("/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


class TestRegistrationEmailHonesty:
    """ROADMAP P0 #3: /register must not claim a code was sent unconditionally."""

    def test_reports_failure_when_delivery_fails(self, client, monkeypatch):
        monkeypatch.setattr(
            authentication, "send_verification_otp_email", lambda *a, **k: False
        )

        resp = _register(client, "email-fails@example.com")

        assert resp.status_code == 200
        body = resp.json()
        assert body["email_sent"] is False
        assert "could not be sent" in body["message"].lower()

    def test_reports_success_when_delivery_succeeds(self, client, monkeypatch):
        monkeypatch.setattr(
            authentication, "send_verification_otp_email", lambda *a, **k: True
        )

        resp = _register(client, "email-works@example.com")

        assert resp.status_code == 200
        body = resp.json()
        assert body["email_sent"] is True
        assert "has been sent" in body["message"].lower()

    def test_resend_reports_failure(self, client, monkeypatch):
        monkeypatch.setattr(
            authentication, "send_verification_otp_email", lambda *a, **k: True
        )
        first = _register(client, "resend@example.com")
        assert first.json()["email_sent"] is True

        monkeypatch.setattr(
            authentication, "send_verification_otp_email", lambda *a, **k: False
        )
        second = _register(client, "resend@example.com")

        assert second.status_code == 200
        assert second.json()["email_sent"] is False


class TestRateLimitStorage:
    """ROADMAP P1 #9: counters must be shareable across workers."""

    def test_explicit_storage_uri_wins(self, monkeypatch):
        from app.middleware import rate_limit

        monkeypatch.setenv("RATE_LIMIT_STORAGE_URI", "redis://cache:6379/2")
        assert rate_limit._resolve_storage_uri() == "redis://cache:6379/2"

    def test_redis_url_is_used_when_present(self, monkeypatch):
        from app.middleware import rate_limit

        monkeypatch.delenv("RATE_LIMIT_STORAGE_URI", raising=False)
        monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_STORAGE_URI", None)
        monkeypatch.setenv("REDIS_URL", "redis://cache:6379/1")
        assert rate_limit._resolve_storage_uri() == "redis://cache:6379/1"

    def test_memory_is_the_default(self, monkeypatch):
        from app.middleware import rate_limit

        monkeypatch.delenv("RATE_LIMIT_STORAGE_URI", raising=False)
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.setattr(rate_limit.settings, "RATE_LIMIT_STORAGE_URI", None)
        assert rate_limit._resolve_storage_uri() == "memory://"


class TestWriteEndpointRateLimits:
    """ROADMAP P1 #9: content writes must not be bulk-spammable."""

    def test_blog_creation_is_rate_limited(
        self, client, auth_headers, rate_limits_active
    ):
        statuses = [
            client.post(
                "/blogs/",
                json={"title": f"Rate limit {i}", "body": "A short body."},
                headers=auth_headers,
            ).status_code
            for i in range(11)
        ]

        assert statuses[:10] == [200] * 10
        assert statuses[10] == 429


class TestTokenRevocation:
    """ROADMAP P0 #4: a changed password must invalidate issued tokens."""

    def test_password_reset_revokes_existing_tokens(self, client, test_user, db_session):
        old_token = _login(client, test_user["email"], test_user["password"])
        assert client.get("/profile/me", headers=_auth(old_token)).status_code == 200

        user = db_session.query(User).filter(User.email == test_user["email"]).one()
        user.reset_token = "654321"
        user.reset_token_expires = get_token_expiry_time(10)
        db_session.commit()

        reset = client.post(
            "/reset-password",
            json={"token": "654321", "new_password": "NewPass123!"},
        )
        assert reset.status_code == 200, reset.text

        assert client.get("/profile/me", headers=_auth(old_token)).status_code == 401

        new_token = _login(client, test_user["email"], "NewPass123!")
        assert client.get("/profile/me", headers=_auth(new_token)).status_code == 200

    def test_password_change_revokes_existing_tokens(self, client, test_user, auth_headers):
        changed = client.put(
            "/profile/update-password",
            json={
                "old_password": test_user["password"],
                "new_password": "NewPass123!",
            },
            headers=auth_headers,
        )
        assert changed.status_code == 200, changed.text

        assert client.get("/profile/me", headers=auth_headers).status_code == 401

    def test_token_without_version_claim_is_rejected(self, client, test_user):
        token = create_access_token({"sub": test_user["email"]})

        assert client.get("/profile/me", headers=_auth(token)).status_code == 401


class TestHealthReadiness:
    """ROADMAP P1 #6: /health must fail when the database is unreachable."""

    def test_health_is_ok_with_a_working_database(self, client):
        resp = client.get("/health")

        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    def test_health_returns_503_when_database_is_unreachable(self, client):
        class BrokenSession:
            def execute(self, *args, **kwargs):
                raise SQLAlchemyError("database is down")

        def broken_db():
            yield BrokenSession()

        original = app.dependency_overrides.get(get_db)
        app.dependency_overrides[get_db] = broken_db
        try:
            resp = client.get("/health")
        finally:
            if original is not None:
                app.dependency_overrides[get_db] = original

        assert resp.status_code == 503
        assert resp.json()["detail"] == "database unavailable"


class TestLoginLogging:
    """ROADMAP P1 #8: authentication logs must not carry account identifiers."""

    def test_failed_login_does_not_log_the_email(self, client, caplog):
        caplog.clear()
        with caplog.at_level(logging.DEBUG):
            resp = client.post(
                "/login",
                data={"username": "ghost@example.com", "password": "WrongPass123!"},
            )

        assert resp.status_code == 401
        assert "ghost@example.com" not in caplog.text

    def test_successful_login_does_not_log_the_email(self, client, test_user, caplog):
        caplog.clear()
        with caplog.at_level(logging.DEBUG):
            resp = client.post(
                "/login",
                data={
                    "username": test_user["email"],
                    "password": test_user["password"],
                },
            )

        assert resp.status_code == 200
        assert test_user["email"] not in caplog.text
