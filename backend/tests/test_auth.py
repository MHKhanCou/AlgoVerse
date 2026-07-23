"""Tests for authentication endpoints."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post(
            "/register",
            json={
                "name": "New User",
                "email": "new@example.com",
                "password": "StrongPass123!",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["success"] is True
        assert "email_sent" in data

    def test_register_duplicate_email(self, client, test_user):
        resp = client.post(
            "/register",
            json={
                "name": "Another User",
                "email": test_user["email"],
                "password": "StrongPass123!",
            },
        )
        assert resp.status_code == 400


class TestLogin:
    def test_login_success(self, client, test_user):
        resp = client.post(
            "/login",
            data={"username": test_user["email"], "password": test_user["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        resp = client.post(
            "/login",
            data={"username": test_user["email"], "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post(
            "/login",
            data={"username": "nonexistent@example.com", "password": "password"},
        )
        assert resp.status_code == 401


class TestAdminLogin:
    def test_admin_login_success(self, client, admin_user):
        resp = client.post(
            "/admin/login",
            data={"username": admin_user["email"], "password": admin_user["password"]},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data

    def test_admin_login_non_admin(self, client, test_user):
        resp = client.post(
            "/admin/login",
            data={"username": test_user["email"], "password": test_user["password"]},
        )
        assert resp.status_code == 403


class TestHealthCheck:
    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "uptime_seconds" in data
        assert "version" in data
        # Should NOT expose database or SMTP details
        assert "database" not in data
        assert "smtp" not in data


class TestAdminEndpointsProtection:
    def test_user_stats_no_auth(self, client):
        resp = client.get("/admin/user-stats")
        assert resp.status_code == 401

    def test_user_stats_non_admin(self, client, auth_headers):
        resp = client.get("/admin/user-stats", headers=auth_headers)
        assert resp.status_code == 403

    def test_user_stats_admin(self, client, admin_headers):
        resp = client.get("/admin/user-stats", headers=admin_headers)
        assert resp.status_code == 200

    def test_cleanup_otps_no_auth(self, client):
        resp = client.post("/admin/cleanup-otps")
        assert resp.status_code == 401

    def test_cleanup_otps_non_admin(self, client, auth_headers):
        resp = client.post("/admin/cleanup-otps", headers=auth_headers)
        assert resp.status_code == 403

    def test_cleanup_users_no_auth(self, client):
        resp = client.post("/admin/cleanup-users")
        assert resp.status_code == 401

    def test_cleanup_users_non_admin(self, client, auth_headers):
        resp = client.post("/admin/cleanup-users", headers=auth_headers)
        assert resp.status_code == 403
