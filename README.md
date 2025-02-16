# AlgoVerse

**AlgoVerse** is an educational platform designed to help users learn algorithms through interactive lessons and visualizations. It provides a robust FastAPI backend with CRUD operations for users, algorithms, algorithm types, and user progress tracking, as well as a database schema (SQLite by default) to store and manage data.

---

## Table of Contents

- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Project Structure](#project-structure)  
- [Installation](#installation)  
- [Usage](#usage)  
- [API Endpoints](#api-endpoints)  
- [Contributing](#contributing)  
- [License](#license)

---

## Features

- **User Management:**  
  Create, read, update, and delete users, each with a unique username, email, and hashed password.  

- **Algorithm Types:**  
  Categorize algorithms (e.g., Searching, Sorting, Graph) for easy organization and retrieval.  

- **Algorithms:**  
  Store algorithm details like name, description, complexity, and associate them with an algorithm type.  

- **User Progress:**  
  Track user progress on various algorithms (e.g., completed steps, last accessed time).  

- **FastAPI Endpoints:**  
  Automatically generated Swagger UI at `/docs` and Redoc at `/redoc` for testing and documentation.  

- **SQLite Integration:**  
  Default local database (`algoverse.db`) for quick setup and testing.

---

## Tech Stack

- **Backend:** FastAPI  
- **Database:** SQLite (local by default)  
- **ORM:** SQLAlchemy  
- **Password Hashing:** passlib (bcrypt)  
- **Python Version:** 3.11 (recommended)

---

## Project Structure

```plaintext
AlgoVerse/
├── algoverse.db         # SQLite database file (auto-generated)
├── database.py          # Sets up SQLAlchemy engine & session
├── models.py            # Database models (User, Algorithm, etc.)
├── crud.py              # CRUD operations for each model
├── schemas.py           # Pydantic schemas for request/response validation
├── main.py              # FastAPI entry point with endpoints
├── requirements.txt     # Project dependencies
├── .gitignore           # Excludes venv, cache, etc.
└── venv/                # (Excluded from git) Virtual environment folder
```

---

## Installation
### Clone the Repository
```plaintext
git clone https://github.com/MHKhanCou/AlgoVerse.git  
cd AlgoVerse
```
### Create & Activate a Virtual Environment (recommended)
```plaintext
python -m venv venv 
``` 
##### Windows:
```plaintext
venv\Scripts\activate 
``` 
##### macOS / Linux:
```plaintext
source venv/bin/activate
```
### Install Dependencies
```plaintext
pip install -r requirements.txt
```

---

## Usage
### Initialize / Update the Database
By default, running the FastAPI app will create algoverse.db if it doesn’t exist.<br>
If you make changes to models, consider using a migration tool like Alembic.
### Run the FastAPI Server
```plaintext
uvicorn main:app --reload
```
The app will be available at http://127.0.0.1:8000.
### Test Endpoints
- Swagger UI: http://127.0.0.1:8000/docs
- Redoc: http://127.0.0.1:8000/redoc
---
## API Endpoints
### Users
- POST /algorithm-types/ - Create an algorithm type
- GET /algorithm-types/{type_id} - Get a specific algorithm type
- GET /algorithm-types/ - Get all algorithm types
- PUT /algorithm-types/{type_id} - Update an algorithm type
- DELETE /algorithm-types/{type_id} - Delete an algorithm type
### Algorithms
- POST /algorithms/ - Create an algorithm
- GET /algorithms/{algorithm_id} - Get a specific algorithm
- GET /algorithms/ - Get all algorithms
- PUT /algorithms/{algorithm_id} - Update an algorithm
- DELETE /algorithms/{algorithm_id} - Delete an algorithm
- User Progress
### POST /user-progress/ - Create a progress record
- GET /user-progress/{progress_id} - Get a specific progress record
- GET /user-progress/by-user/{user_id} - Get all progress for a user
- PUT /user-progress/{progress_id} - Update user progress
- DELETE /user-progress/{progress_id} - Delete a progress record

---

## Contributing
1.  Fork the repository on GitHub.
2.  Create a feature branch:
```plaintext
git checkout -b feature/my-feature
```
3.  Commit your changes:
```plaintext
git commit -m "Add some feature"
```
4.  Push to the branch:
```plaintext
git push origin feature/my-feature
```
5.  Create a new Pull Request on GitHub.

---

## License
This project is currently unlicensed.

---

Thank you for using AlgoVerse!<br>
If you have any questions, suggestions, or issues, please open an issue or submit a pull request.
