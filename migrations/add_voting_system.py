"""
Add voting system for algorithm comments and blog posts
"""

import sqlite3
from datetime import datetime

def upgrade():
    """Add voting system tables and update existing models"""
    
    # Connect to database
    conn = sqlite3.connect('algoverse.db')
    cursor = conn.cursor()
    
    try:
        # Create votes table for algorithm comments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS algorithm_comment_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                comment_id INTEGER NOT NULL,
                vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES algorithm_comments (id) ON DELETE CASCADE,
                UNIQUE(user_id, comment_id)
            )
        ''')
        
        # Create votes table for blog posts
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blog_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                blog_id INTEGER NOT NULL,
                vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (blog_id) REFERENCES blog (id) ON DELETE CASCADE,
                UNIQUE(user_id, blog_id)
            )
        ''')
        
        # Create votes table for blog comments
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blog_comment_votes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                comment_id INTEGER NOT NULL,
                vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES blog_comments (id) ON DELETE CASCADE,
                UNIQUE(user_id, comment_id)
            )
        ''')
        
        # Add vote counts to algorithm_comments table
        cursor.execute('''
            ALTER TABLE algorithm_comments 
            ADD COLUMN upvotes INTEGER DEFAULT 0
        ''')
        
        cursor.execute('''
            ALTER TABLE algorithm_comments 
            ADD COLUMN downvotes INTEGER DEFAULT 0
        ''')
        
        # Add vote counts to blog table
        cursor.execute('''
            ALTER TABLE blog 
            ADD COLUMN upvotes INTEGER DEFAULT 0
        ''')
        
        cursor.execute('''
            ALTER TABLE blog 
            ADD COLUMN downvotes INTEGER DEFAULT 0
        ''')
        
        # Add vote counts to blog_comments table
        cursor.execute('''
            ALTER TABLE blog_comments 
            ADD COLUMN upvotes INTEGER DEFAULT 0
        ''')
        
        cursor.execute('''
            ALTER TABLE blog_comments 
            ADD COLUMN downvotes INTEGER DEFAULT 0
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_algorithm_comment_votes_user_id ON algorithm_comment_votes(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_algorithm_comment_votes_comment_id ON algorithm_comment_votes(comment_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_votes_user_id ON blog_votes(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_votes_blog_id ON blog_votes(blog_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_comment_votes_user_id ON blog_comment_votes(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_blog_comment_votes_comment_id ON blog_comment_votes(comment_id)')
        
        # Create triggers to automatically update vote counts
        
        # Algorithm comment vote triggers
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_algorithm_comment_votes_on_insert
            AFTER INSERT ON algorithm_comment_votes
            BEGIN
                UPDATE algorithm_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.comment_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_algorithm_comment_votes_on_update
            AFTER UPDATE ON algorithm_comment_votes
            BEGIN
                UPDATE algorithm_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.comment_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_algorithm_comment_votes_on_delete
            AFTER DELETE ON algorithm_comment_votes
            BEGIN
                UPDATE algorithm_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM algorithm_comment_votes 
                    WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'
                )
                WHERE id = OLD.comment_id;
            END
        ''')
        
        # Blog vote triggers
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_votes_on_insert
            AFTER INSERT ON blog_votes
            BEGIN
                UPDATE blog 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = NEW.blog_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = NEW.blog_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.blog_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_votes_on_update
            AFTER UPDATE ON blog_votes
            BEGIN
                UPDATE blog 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = NEW.blog_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = NEW.blog_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.blog_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_votes_on_delete
            AFTER DELETE ON blog_votes
            BEGIN
                UPDATE blog 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = OLD.blog_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_votes 
                    WHERE blog_id = OLD.blog_id AND vote_type = 'downvote'
                )
                WHERE id = OLD.blog_id;
            END
        ''')
        
        # Blog comment vote triggers
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_comment_votes_on_insert
            AFTER INSERT ON blog_comment_votes
            BEGIN
                UPDATE blog_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.comment_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_comment_votes_on_update
            AFTER UPDATE ON blog_comment_votes
            BEGIN
                UPDATE blog_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = NEW.comment_id AND vote_type = 'downvote'
                )
                WHERE id = NEW.comment_id;
            END
        ''')
        
        cursor.execute('''
            CREATE TRIGGER IF NOT EXISTS update_blog_comment_votes_on_delete
            AFTER DELETE ON blog_comment_votes
            BEGIN
                UPDATE blog_comments 
                SET upvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = OLD.comment_id AND vote_type = 'upvote'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM blog_comment_votes 
                    WHERE comment_id = OLD.comment_id AND vote_type = 'downvote'
                )
                WHERE id = OLD.comment_id;
            END
        ''')
        
        conn.commit()
        print("✅ Voting system migration completed successfully!")
        
    except sqlite3.Error as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

def downgrade():
    """Remove voting system (for rollback)"""
    
    conn = sqlite3.connect('algoverse.db')
    cursor = conn.cursor()
    
    try:
        # Drop triggers
        cursor.execute('DROP TRIGGER IF EXISTS update_algorithm_comment_votes_on_insert')
        cursor.execute('DROP TRIGGER IF EXISTS update_algorithm_comment_votes_on_update')
        cursor.execute('DROP TRIGGER IF EXISTS update_algorithm_comment_votes_on_delete')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_votes_on_insert')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_votes_on_update')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_votes_on_delete')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_comment_votes_on_insert')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_comment_votes_on_update')
        cursor.execute('DROP TRIGGER IF EXISTS update_blog_comment_votes_on_delete')
        
        # Drop vote tables
        cursor.execute('DROP TABLE IF EXISTS algorithm_comment_votes')
        cursor.execute('DROP TABLE IF EXISTS blog_votes')
        cursor.execute('DROP TABLE IF EXISTS blog_comment_votes')
        
        # Note: SQLite doesn't support DROP COLUMN, so we can't remove the vote count columns
        # They will remain but won't be updated
        
        conn.commit()
        print("✅ Voting system rollback completed!")
        
    except sqlite3.Error as e:
        print(f"❌ Error during rollback: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    upgrade()