"""Blog moderation rules.

What must hold for launch:
- a new post is pending: invisible on every public surface until an admin
  approves it (list, detail, user page, search)
- the author and admins can still read it (review workflow)
- an author's edit of a live post sends it back to review; an admin's edit
  does not unpublish it
- update/delete do not 500 for the common cases (they used to: the routes
  read `user_id` off a dict)
"""
from tests.conftest import TestSession

from app.models import User


def _register_verified(client, name, email, password="OtherPass123!"):
    """Register a fresh account and mark it verified, like the fixtures do."""
    client.post("/register", json={"name": name, "email": email, "password": password})
    db = TestSession()
    user = db.query(User).filter(User.email == email).first()
    assert user is not None, "registration did not create the user"
    user.is_verified = True
    db.commit()
    user_id = user.id
    db.close()
    resp = client.post("/login", data={"username": email, "password": password})
    headers = {"Authorization": f"Bearer {resp.json()['access_token']}"}
    return user_id, headers


def _user_id(email):
    db = TestSession()
    try:
        return db.query(User).filter(User.email == email).first().id
    finally:
        db.close()


def _create_post(client, headers, title="A useful post", body="Line one.\n\nLine two."):
    resp = client.post("/blogs/", json={"title": title, "body": body}, headers=headers)
    assert resp.status_code == 200, resp.text
    return resp.json()


def _approve(client, admin_headers, blog_id):
    resp = client.post(
        f"/admin/blogs/{blog_id}/moderate",
        json={"status": "approved", "admin_feedback": None},
        headers=admin_headers,
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


class TestPendingIsPrivate:
    def test_create_returns_pending(self, client, auth_headers):
        blog = _create_post(client, auth_headers)
        assert blog["status"] == "pending"

    def test_pending_post_missing_from_public_list_and_user_page(self, client, auth_headers):
        blog = _create_post(client, auth_headers)
        listing = client.get("/blogs/").json()
        assert all(b["id"] != blog["id"] for b in listing)
        user_page = client.get(f"/blogs/user/{_user_id('test@example.com')}").json()
        assert all(b["id"] != blog["id"] for b in user_page)

    def test_pending_detail_404_for_anonymous_and_strangers(self, client, auth_headers):
        blog = _create_post(client, auth_headers)
        assert client.get(f"/blogs/{blog['id']}").status_code == 404
        _, other_headers = _register_verified(client, "Other User", "other@example.com")
        assert client.get(f"/blogs/{blog['id']}", headers=other_headers).status_code == 404

    def test_pending_detail_visible_to_author_and_admin(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers)
        owner_view = client.get(f"/blogs/{blog['id']}", headers=auth_headers)
        assert owner_view.status_code == 200
        assert owner_view.json()["status"] == "pending"
        assert client.get(f"/blogs/{blog['id']}", headers=admin_headers).status_code == 200


class TestApproval:
    def test_approval_publishes_post_everywhere(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers)
        approved = _approve(client, admin_headers, blog["id"])
        assert approved["status"] == "approved"
        assert len(client.get("/blogs/").json()) == 1
        assert client.get(f"/blogs/{blog['id']}").status_code == 200

    def test_search_only_returns_approved(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers, title="Unique Kangaroo Post")
        assert client.get("/blogs/search/kangaroo").json() == []
        _approve(client, admin_headers, blog["id"])
        hits = client.get("/blogs/search/kangaroo").json()
        assert [b["id"] for b in hits] == [blog["id"]]

    def test_rejection_records_feedback_for_the_author(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers)
        resp = client.post(
            f"/admin/blogs/{blog['id']}/moderate",
            json={"status": "rejected", "admin_feedback": "Please add an example."},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        mine = client.get(
            "/profile/my-blogs",
            params={"status_filter": "rejected"},
            headers=auth_headers,
        ).json()
        assert mine[0]["admin_feedback"] == "Please add an example."
        assert client.get(f"/blogs/{blog['id']}").status_code == 404


class TestEditRules:
    def test_author_edit_of_approved_post_returns_to_review(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers)
        _approve(client, admin_headers, blog["id"])
        resp = client.put(
            f"/blogs/{blog['id']}",
            json={"title": blog["title"], "body": "Rewritten body."},
            headers=auth_headers,
        )
        assert resp.status_code == 200, resp.text
        updated = resp.json()
        assert updated["status"] == "pending"
        assert updated["approved_at"] is None
        # And it is no longer public.
        assert client.get(f"/blogs/{blog['id']}").status_code == 404

    def test_admin_edit_keeps_post_published(self, client, auth_headers, admin_headers):
        blog = _create_post(client, auth_headers)
        _approve(client, admin_headers, blog["id"])
        resp = client.put(
            f"/admin/blogs/{blog['id']}",
            json={"body": "Admin tidy-up."},
            headers=admin_headers,
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "approved"
        assert client.get(f"/blogs/{blog['id']}").status_code == 200

    def test_stranger_cannot_edit_or_delete(self, client, auth_headers):
        blog = _create_post(client, auth_headers)
        _, other_headers = _register_verified(client, "Other User", "other@example.com")
        resp = client.put(f"/blogs/{blog['id']}", json={"body": "hijack"}, headers=other_headers)
        assert resp.status_code == 403
        assert client.delete(f"/blogs/{blog['id']}", headers=other_headers).status_code == 403

    def test_author_can_delete_own_post(self, client, auth_headers):
        blog = _create_post(client, auth_headers)
        assert client.delete(f"/blogs/{blog['id']}", headers=auth_headers).status_code == 204
        assert client.get(f"/blogs/{blog['id']}", headers=auth_headers).status_code == 404
