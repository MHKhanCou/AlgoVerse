"""add token_version to users

Revision ID: c3f1a9b27d64
Revises: fe2e1da5e73f
Create Date: 2026-10-21 12:00:00.000000

Password changes need to invalidate access tokens that were issued earlier.
Existing rows start at 0; every new token carries the row's value as a `ver`
claim and the auth dependency rejects a mismatch.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "c3f1a9b27d64"
down_revision = "fe2e1da5e73f"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "token_version",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "token_version")
