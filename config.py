from passlib.context import CryptContext
import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def validate_password(password: str) -> bool:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one digit")
    if not any(char in "!@#$%^&*()-_=+[]{}|;:'\",.<>?/`~" for char in password):
        raise ValueError("Password must contain at least one special character")
    return True

def hash_password(password):
    return pwd_context.hash(password)  

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def check_username(username, db):
    user = db.query(models.User).filter(models.User.name == username).first()
    if user:
        return True
    else:
        return False
    
def check_email(email, db):
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return True
    else:
        return False