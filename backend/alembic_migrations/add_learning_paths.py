"""
Database migration to add Learning Paths feature tables.

This migration creates the following tables:
1. learning_paths - Main learning path definitions
2. path_steps - Individual steps within each path
3. user_path_progress - User enrollment and progress tracking for paths
4. user_step_progress - User progress on individual steps
5. path_recommendations - AI/algorithm-generated path recommendations

Run this after ensuring your database is backed up.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text
from datetime import datetime

def upgrade():
    """Create learning paths tables"""
    
    # Create learning_paths table
    op.create_table(
        'learning_paths',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('difficulty', sa.Enum('beginner', 'intermediate', 'advanced', 'expert', name='pathdifficulty'), nullable=False),
        sa.Column('estimated_hours', sa.Integer(), default=0),
        sa.Column('prerequisites', sa.Text()),  # JSON array of prerequisite path IDs
        
        # Visual and metadata
        sa.Column('icon', sa.String(50), default='🎯'),
        sa.Column('color', sa.String(7), default='#3B82F6'),
        sa.Column('thumbnail_url', sa.String(500)),
        
        # Content organization
        sa.Column('is_featured', sa.Boolean(), default=False),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('sort_order', sa.Integer(), default=0),
        
        # Statistics
        sa.Column('enrollment_count', sa.Integer(), default=0),
        sa.Column('completion_rate', sa.Float(), default=0.0),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('created_by', sa.Integer(), sa.ForeignKey('users.id')),
    )
    
    # Create path_steps table
    op.create_table(
        'path_steps',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('path_id', sa.Integer(), sa.ForeignKey('learning_paths.id'), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text()),
        
        # Content references
        sa.Column('algorithm_id', sa.Integer(), sa.ForeignKey('algorithms.id'), nullable=True),
        sa.Column('external_url', sa.String(500), nullable=True),
        sa.Column('content_type', sa.String(20), default='algorithm'),
        
        # Requirements
        sa.Column('is_required', sa.Boolean(), default=True),
        sa.Column('estimated_minutes', sa.Integer(), default=30),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
    )
    
    # Create user_path_progress table
    op.create_table(
        'user_path_progress',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('path_id', sa.Integer(), sa.ForeignKey('learning_paths.id'), nullable=False),
        
        # Progress tracking
        sa.Column('status', sa.Enum('not_started', 'in_progress', 'completed', 'paused', name='pathstatus'), default='not_started'),
        sa.Column('progress_percentage', sa.Float(), default=0.0),
        sa.Column('current_step_id', sa.Integer(), sa.ForeignKey('path_steps.id'), nullable=True),
        
        # Time tracking
        sa.Column('total_time_spent', sa.Integer(), default=0),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('last_accessed', sa.DateTime(), default=datetime.utcnow),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow),
    )
    
    # Create user_step_progress table
    op.create_table(
        'user_step_progress',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('step_id', sa.Integer(), sa.ForeignKey('path_steps.id'), nullable=False),
        sa.Column('path_progress_id', sa.Integer(), sa.ForeignKey('user_path_progress.id'), nullable=False),
        
        # Progress
        sa.Column('is_completed', sa.Boolean(), default=False),
        sa.Column('time_spent', sa.Integer(), default=0),
        
        # Optional feedback
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        
        # Timestamps
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
    )
    
    # Create path_recommendations table
    op.create_table(
        'path_recommendations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('path_id', sa.Integer(), sa.ForeignKey('learning_paths.id'), nullable=False),
        
        # Recommendation details
        sa.Column('confidence_score', sa.Float(), default=0.0),
        sa.Column('reason', sa.Text()),
        sa.Column('recommendation_type', sa.String(50), default='ai_generated'),
        
        # Status
        sa.Column('is_viewed', sa.Boolean(), default=False),
        sa.Column('is_dismissed', sa.Boolean(), default=False),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
    )
    
    # Create indexes for better performance
    op.create_index('idx_path_steps_path_order', 'path_steps', ['path_id', 'step_order'])
    op.create_index('idx_user_path_progress_user', 'user_path_progress', ['user_id'])
    op.create_index('idx_user_step_progress_user', 'user_step_progress', ['user_id'])
    op.create_index('idx_path_recommendations_user', 'path_recommendations', ['user_id'])
    op.create_index('idx_learning_paths_featured', 'learning_paths', ['is_featured', 'sort_order'])
    op.create_index('idx_learning_paths_difficulty', 'learning_paths', ['difficulty'])

def downgrade():
    """Remove learning paths tables"""
    
    # Drop indexes first
    op.drop_index('idx_learning_paths_difficulty')
    op.drop_index('idx_learning_paths_featured')
    op.drop_index('idx_path_recommendations_user')
    op.drop_index('idx_user_step_progress_user')
    op.drop_index('idx_user_path_progress_user')
    op.drop_index('idx_path_steps_path_order')
    
    # Drop tables in reverse order (to respect foreign key constraints)
    op.drop_table('path_recommendations')
    op.drop_table('user_step_progress')
    op.drop_table('user_path_progress')
    op.drop_table('path_steps')
    op.drop_table('learning_paths')
    
    # Drop custom enum types
    op.execute('DROP TYPE IF EXISTS pathstatus')
    op.execute('DROP TYPE IF EXISTS pathdifficulty')

if __name__ == "__main__":
    """
    Direct execution method for environments without Alembic
    """
    import sys
    import os
    
    # Add the parent directory to Python path to import our modules
    sys.path.append(os.path.dirname(os.path.dirname(__file__)))
    
    from db import engine
    from sqlalchemy import text
    
    print("🚀 Starting Learning Paths migration...")
    
    with engine.connect() as conn:
        # Create enum types first
        try:
            conn.execute(text("""
                CREATE TYPE pathdifficulty AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
            """))
            print("✅ Created PathDifficulty enum")
        except Exception as e:
            print(f"⚠️ PathDifficulty enum might already exist: {e}")
        
        try:
            conn.execute(text("""
                CREATE TYPE pathstatus AS ENUM ('not_started', 'in_progress', 'completed', 'paused');
            """))
            print("✅ Created PathStatus enum")
        except Exception as e:
            print(f"⚠️ PathStatus enum might already exist: {e}")
        
        conn.commit()
    
    # Now run the table creation
    try:
        upgrade()
        print("✅ Learning Paths migration completed successfully!")
        print("📊 Created tables:")
        print("   - learning_paths")
        print("   - path_steps") 
        print("   - user_path_progress")
        print("   - user_step_progress")
        print("   - path_recommendations")
        print("📈 Created performance indexes")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print("💡 You might need to run this with Alembic or check your database connection.")
        sys.exit(1)
