#!/usr/bin/env python3
"""
Test script to check admin functionality
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Use SQLite database
DATABASE_URL = "sqlite:///./algoverse.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_admin_status():
    """Check admin status of users in database"""
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name, email, is_admin FROM users"))
        users = result.fetchall()
        
        print("=== User Admin Status ===")
        for user in users:
            admin_status = "ADMIN" if user[3] else "USER"
            print(f"ID: {user[0]}, Name: {user[1]}, Email: {user[2]}, Status: {admin_status}")
        
        print(f"\nTotal users: {len(users)}")
        print(f"Admin users: {sum(1 for user in users if user[3])}")
        
        # Test specific user
        test_email = "mhkhancou@gmail.com"
        test_user = None
        for user in users:
            if user[2] == test_email:
                test_user = user
                break
        
        if test_user:
            print(f"\n=== Testing user: {test_user} ===")
            print(f"Is admin: {test_user[3]}")
            if not test_user[3]:
                print("❌ This user should be admin but is not!")
            else:
                print("✅ This user is correctly marked as admin")
        else:
            print(f"\n❌ Test user {test_email} not found in database")

if __name__ == "__main__":
    check_admin_status()
