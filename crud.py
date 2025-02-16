# crud.py
from sqlalchemy.orm import Session
from models import User, Algorithm, AlgorithmType, UserProgress
from passlib.context import CryptContext

# Configure password hashing using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def create_user(db: Session, username: str, password: str, email: str) -> User:
    hashed_password = hash_password(password)
    new_user = User(username=username, password=hashed_password, email=email)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def get_user(db: Session, user_id: int) -> User:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()

def get_all_users(db: Session, skip: int = 0, limit: int = 10):
    return db.query(User).offset(skip).limit(limit).all()

def update_user_email(db: Session, user_id: int, new_email: str) -> User:
    user = get_user(db, user_id)
    if user:
        user.email = new_email
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> bool:
    user = get_user(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False

# CRUD operations for Algorithm

def create_algorithm(db: Session, name: str, description: str, complexity: str, type_id: int) -> Algorithm:
    new_algorithm = Algorithm(name=name, description=description, complexity=complexity, type_id=type_id)
    db.add(new_algorithm)
    db.commit()
    db.refresh(new_algorithm)
    return new_algorithm

def get_algorithm(db: Session, algorithm_id: int) -> Algorithm:
    return db.query(Algorithm).filter(Algorithm.id == algorithm_id).first()

def get_all_algorithms(db: Session, skip: int = 0, limit: int = 10):
    return db.query(Algorithm).offset(skip).limit(limit).all()

def update_algorithm(db: Session, algorithm_id: int, name: str, description: str, complexity: str, type_id: int) -> Algorithm:
    algorithm = get_algorithm(db, algorithm_id)
    if algorithm:
        algorithm.name = name
        algorithm.description = description
        algorithm.complexity = complexity
        algorithm.type_id = type_id
        db.commit()
        db.refresh(algorithm)
    return algorithm

def delete_algorithm(db: Session, algorithm_id: int) -> bool:
    algorithm = get_algorithm(db, algorithm_id)
    if algorithm:
        db.delete(algorithm)
        db.commit()
        return True
    return False

# CRUD operations for AlgorithmType
def create_algorithm_type(db: Session, name: str, description: str) -> AlgorithmType:
    new_type = AlgorithmType(name=name, description=description)
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return new_type

def get_algorithm_type(db: Session, type_id: int) -> AlgorithmType:
    return db.query(AlgorithmType).filter(AlgorithmType.id == type_id).first()

def get_all_algorithm_types(db: Session, skip: int = 0, limit: int = 10):
    return db.query(AlgorithmType).offset(skip).limit(limit).all()

def update_algorithm_type(db: Session, type_id: int, name: str, description: str) -> AlgorithmType:
    algorithm_type = get_algorithm_type(db, type_id)
    if algorithm_type:
        algorithm_type.name = name
        algorithm_type.description = description
        db.commit()
        db.refresh(algorithm_type)
    return algorithm_type

def delete_algorithm_type(db: Session, type_id: int) -> bool:
    algorithm_type = get_algorithm_type(db, type_id)
    if algorithm_type:
        db.delete(algorithm_type)
        db.commit()
        return True
    return False

# CRUD operations for UserProgress

def create_user_progress(db: Session, user_id: int, algorithm_id: int, completed_steps: int = 0) -> UserProgress:
    new_progress = UserProgress(user_id=user_id, algorithm_id=algorithm_id, completed_steps=completed_steps)
    db.add(new_progress)
    db.commit()
    db.refresh(new_progress)
    return new_progress

def get_user_progress(db: Session, progress_id: int) -> UserProgress:
    return db.query(UserProgress).filter(UserProgress.id == progress_id).first()

def get_user_progress_by_user(db: Session, user_id: int):
    return db.query(UserProgress).filter(UserProgress.user_id == user_id).all()

def update_user_progress(db: Session, progress_id: int, completed_steps: int) -> UserProgress:
    progress = get_user_progress(db, progress_id)
    if progress:
        progress.completed_steps = completed_steps
        db.commit()
        db.refresh(progress)
    return progress

def delete_user_progress(db: Session, progress_id: int) -> bool:
    progress = get_user_progress(db, progress_id)
    if progress:
        db.delete(progress)
        db.commit()
        return True
    return False

def get_last_accessed_progress_by_user(db: Session, user_id: int):
    return (
        db.query(UserProgress)
        .filter(UserProgress.user_id == user_id)
        .order_by(UserProgress.last_accessed.desc())
        .first()
    )
