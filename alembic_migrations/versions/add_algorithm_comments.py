"""Add algorithm comments table

Revision ID: add_algorithm_comments
Revises: 
Create Date: 2025-01-11 18:58:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_algorithm_comments'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Create algorithm_comments table
    op.create_table('algorithm_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('algorithm_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column('is_edited', sa.Boolean(), nullable=True, default=False),
        sa.Column('likes', sa.Integer(), nullable=True, default=0),
        sa.ForeignKeyConstraint(['algorithm_id'], ['algorithms.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['algorithm_comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for better query performance
    op.create_index(op.f('ix_algorithm_comments_id'), 'algorithm_comments', ['id'], unique=False)
    op.create_index(op.f('ix_algorithm_comments_algorithm_id'), 'algorithm_comments', ['algorithm_id'], unique=False)
    op.create_index(op.f('ix_algorithm_comments_user_id'), 'algorithm_comments', ['user_id'], unique=False)
    op.create_index(op.f('ix_algorithm_comments_parent_id'), 'algorithm_comments', ['parent_id'], unique=False)
    op.create_index(op.f('ix_algorithm_comments_created_at'), 'algorithm_comments', ['created_at'], unique=False)

def downgrade():
    # Drop indexes
    op.drop_index(op.f('ix_algorithm_comments_created_at'), table_name='algorithm_comments')
    op.drop_index(op.f('ix_algorithm_comments_parent_id'), table_name='algorithm_comments')
    op.drop_index(op.f('ix_algorithm_comments_user_id'), table_name='algorithm_comments')
    op.drop_index(op.f('ix_algorithm_comments_algorithm_id'), table_name='algorithm_comments')
    op.drop_index(op.f('ix_algorithm_comments_id'), table_name='algorithm_comments')
    
    # Drop table
    op.drop_table('algorithm_comments')