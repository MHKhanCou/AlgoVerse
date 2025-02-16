from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, get_db
import crud, models, schemas

app = FastAPI()

# Create database tables
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "🚀 FastAPI is running with SQLite!"}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"message": "✅ Database connection successful!"}
    except Exception as e:
        return {"error": str(e)}

# ------------- USER ENDPOINTS -------------

@app.post("/users/", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    if crud.get_user_by_username(db, user.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db, user.username, user.password, user.email)

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.get("/users/", response_model=list[schemas.UserResponse])
def get_all_users(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_all_users(db, skip, limit)

@app.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(user_id: int, new_email: str, db: Session = Depends(get_db)):
    user = crud.update_user_email(db, user_id, new_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    if not crud.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

# ------------- ALGORITHM TYPE ENDPOINTS -------------

@app.post("/algorithm-types/", response_model=schemas.AlgorithmTypeResponse)
def create_algorithm_type(algorithm_type: schemas.AlgorithmTypeCreate, db: Session = Depends(get_db)):
    return crud.create_algorithm_type(db, algorithm_type.name, algorithm_type.description)

@app.get("/algorithm-types/{type_id}", response_model=schemas.AlgorithmTypeResponse)
def get_algorithm_type(type_id: int, db: Session = Depends(get_db)):
    algorithm_type = crud.get_algorithm_type(db, type_id)
    if algorithm_type is None:
        raise HTTPException(status_code=404, detail="Algorithm type not found")
    return algorithm_type

@app.get("/algorithm-types/", response_model=list[schemas.AlgorithmTypeResponse])
def get_all_algorithm_types(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_all_algorithm_types(db, skip, limit)

@app.put("/algorithm-types/{type_id}", response_model=schemas.AlgorithmTypeResponse)
def update_algorithm_type(type_id: int, algorithm_type: schemas.AlgorithmTypeCreate, db: Session = Depends(get_db)):
    updated_type = crud.update_algorithm_type(db, type_id, algorithm_type.name, algorithm_type.description)
    if not updated_type:
        raise HTTPException(status_code=404, detail="Algorithm Type not found")
    return updated_type

@app.delete("/algorithm-types/{type_id}")
def delete_algorithm_type(type_id: int, db: Session = Depends(get_db)):
    if not crud.delete_algorithm_type(db, type_id):
        raise HTTPException(status_code=404, detail="Algorithm Type not found")
    return {"message": "Algorithm Type deleted successfully"}

# ------------- ALGORITHM ENDPOINTS -------------

@app.post("/algorithms/", response_model=schemas.AlgorithmResponse)
def create_algorithm(algorithm: schemas.AlgorithmCreate, db: Session = Depends(get_db)):
    # Check if the AlgorithmType exists
    alg_type = crud.get_algorithm_type(db, algorithm.type_id)
    if not alg_type:
        raise HTTPException(status_code=400, detail="AlgorithmType with given type_id does not exist")
    return crud.create_algorithm(db, algorithm.name, algorithm.description, algorithm.complexity, algorithm.type_id)

@app.get("/algorithms/{algorithm_id}", response_model=schemas.AlgorithmResponse)
def read_algorithm(algorithm_id: int, db: Session = Depends(get_db)):
    algorithm = crud.get_algorithm(db, algorithm_id)
    if algorithm is None:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return algorithm

@app.get("/algorithms/", response_model=list[schemas.AlgorithmResponse])
def get_all_algorithms(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return crud.get_all_algorithms(db, skip, limit)

@app.put("/algorithms/{algorithm_id}", response_model=schemas.AlgorithmResponse)
def update_algorithm(algorithm_id: int, algorithm: schemas.AlgorithmCreate, db: Session = Depends(get_db)):
    updated_algorithm = crud.update_algorithm(db, algorithm_id, algorithm.name, algorithm.description, algorithm.complexity, algorithm.type_id)
    if not updated_algorithm:
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return updated_algorithm

@app.delete("/algorithms/{algorithm_id}")
def delete_algorithm(algorithm_id: int, db: Session = Depends(get_db)):
    if not crud.delete_algorithm(db, algorithm_id):
        raise HTTPException(status_code=404, detail="Algorithm not found")
    return {"message": "Algorithm deleted successfully"}

# ------------- USER PROGRESS ENDPOINTS -------------

@app.post("/user-progress/", response_model=schemas.UserProgressResponse)
def create_user_progress(progress: schemas.UserProgressCreate, db: Session = Depends(get_db)):
    return crud.create_user_progress(db, progress.user_id, progress.algorithm_id, progress.completed_steps)

@app.get("/user-progress/{progress_id}", response_model=schemas.UserProgressResponse)
def read_user_progress(progress_id: int, db: Session = Depends(get_db)):
    user_progress = crud.get_user_progress(db, progress_id)
    if user_progress is None:
        raise HTTPException(status_code=404, detail="User progress not found")
    return user_progress

@app.get("/user-progress/by-user/{user_id}", response_model=list[schemas.UserProgressResponse])
def read_user_progress_by_user(user_id: int, db: Session = Depends(get_db)):
    return crud.get_user_progress_by_user(db, user_id)

@app.put("/user-progress/{progress_id}", response_model=schemas.UserProgressResponse)
def update_user_progress(progress_id: int, progress: schemas.UserProgressCreate, db: Session = Depends(get_db)):
    updated_progress = crud.update_user_progress(db, progress_id, progress.attempts, progress.solved)
    if not updated_progress:
        raise HTTPException(status_code=404, detail="User Progress not found")
    return updated_progress

@app.delete("/user-progress/{progress_id}")
def delete_user_progress(progress_id: int, db: Session = Depends(get_db)):
    if not crud.delete_user_progress(db, progress_id):
        raise HTTPException(status_code=404, detail="User Progress not found")
    return {"message": "User Progress deleted successfully"}
