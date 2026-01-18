"""
Database Migration Runner
Runs all pending migrations in the migrations folder
"""

import os
import sys
import importlib.util
from pathlib import Path

def run_all_migrations():
    """Run all migration files in the migrations directory"""
    
    migrations_dir = Path(__file__).parent / 'migrations'
    
    if not migrations_dir.exists():
        print("Migrations directory not found")
        return False
    
    # Get all Python files in migrations directory
    migration_files = sorted([f for f in migrations_dir.glob('*.py') if f.name != '__init__.py'])
    
    if not migration_files:
        print("No migration files found")
        return True
    
    print(f"Found {len(migration_files)} migration file(s)")
    
    success_count = 0
    
    for migration_file in migration_files:
        print(f"\n--- Running migration: {migration_file.name} ---")
        
        try:
            # Import the migration module
            spec = importlib.util.spec_from_file_location("migration", migration_file)
            migration_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(migration_module)
            
            # Run the migration
            if hasattr(migration_module, 'run_migration'):
                result = migration_module.run_migration()
                if result:
                    success_count += 1
                    print(f"✓ Migration {migration_file.name} completed successfully")
                else:
                    print(f"✗ Migration {migration_file.name} failed")
            else:
                print(f"✗ Migration {migration_file.name} does not have run_migration function")
                
        except Exception as e:
            print(f"✗ Error running migration {migration_file.name}: {e}")
    
    print(f"\n--- Migration Summary ---")
    print(f"Total migrations: {len(migration_files)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {len(migration_files) - success_count}")
    
    return success_count == len(migration_files)

if __name__ == "__main__":
    print("AlgoVerse Database Migration Runner")
    print("=" * 40)
    
    success = run_all_migrations()
    
    if success:
        print("\n🎉 All migrations completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some migrations failed. Please check the logs above.")
        sys.exit(1)