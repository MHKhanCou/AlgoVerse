"""
Migration: Add codeforces_handle column to users table
Date: 2024-01-01
Description: Adds an optional codeforces_handle field to the users table for CF analytics integration
"""

import sqlite3
import os
from pathlib import Path

def run_migration():
    """Add codeforces_handle column to users table"""
    
    # Get the database path
    db_path = Path(__file__).parent.parent / 'db' / 'algoverse.db'
    
    if not db_path.exists():
        print(f"Database not found at {db_path}")
        return False
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute('PRAGMA table_info(users)')
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'codeforces_handle' in columns:
            print("Column 'codeforces_handle' already exists in users table")
            return True
        
        # Add the column
        print("Adding 'codeforces_handle' column to users table...")
        cursor.execute('ALTER TABLE users ADD COLUMN codeforces_handle TEXT')
        
        # Commit the changes
        conn.commit()
        print("Successfully added 'codeforces_handle' column to users table")
        
        # Verify the column was added
        cursor.execute('PRAGMA table_info(users)')
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'codeforces_handle' in columns:
            print("Migration completed successfully!")
            return True
        else:
            print("Migration failed - column not found after addition")
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