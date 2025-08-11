"""
Migration: Add algorithm_comments table
Date: 2025-01-11
Description: Creates algorithm_comments table for discussion board functionality on algorithm pages
"""

import sqlite3
import os
from pathlib import Path

def run_migration():
    """Create algorithm_comments table"""
    
    # Get the database path
    db_path = Path(__file__).parent.parent / 'db' / 'algoverse.db'
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='algorithm_comments'
        """)
        
        if cursor.fetchone():
            print("Table 'algorithm_comments' already exists")
            return True
        
        # Create the algorithm_comments table
        print("Creating 'algorithm_comments' table...")
        cursor.execute("""
            CREATE TABLE algorithm_comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                algorithm_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                parent_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_edited BOOLEAN DEFAULT FALSE,
                likes INTEGER DEFAULT 0,
                FOREIGN KEY (algorithm_id) REFERENCES algorithms (id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES algorithm_comments (id) ON DELETE CASCADE
            )
        """)
        
        # Create indexes for better query performance
        print("Creating indexes for algorithm_comments table...")
        cursor.execute("CREATE INDEX ix_algorithm_comments_algorithm_id ON algorithm_comments (algorithm_id)")
        cursor.execute("CREATE INDEX ix_algorithm_comments_user_id ON algorithm_comments (user_id)")
        cursor.execute("CREATE INDEX ix_algorithm_comments_parent_id ON algorithm_comments (parent_id)")
        cursor.execute("CREATE INDEX ix_algorithm_comments_created_at ON algorithm_comments (created_at)")
        
        # Commit the changes
        conn.commit()
        print("Successfully created 'algorithm_comments' table with indexes")
        
        # Verify the table was created
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='algorithm_comments'
        """)
        
        if cursor.fetchone():
            print("Migration completed successfully!")
            return True
        else:
            print("Migration failed - table not found after creation")
            return False
            
    except Exception as e:
        print(f"Migration failed with error: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    success = run_migration()
    exit(0 if success else 1)