# AlgoVerse

**AlgoVerse** is an educational platform designed to help users learn algorithms through interactive lessons and visualizations. It provides a robust **FastAPI** backend with CRUD operations for users, algorithms, algorithm types, and user progress tracking, as well as a database schema (SQLite by default) to store and manage data.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Installation](#installation)
5. [Usage](#usage)
6. [API Endpoints](#api-endpoints)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features

- **User Management**  
  Create, read, update, and delete users, each with a unique username, email, and hashed password.

- **Algorithm Types**  
  Categorize algorithms (e.g., Searching, Sorting, Graph) for easy organization and retrieval.

- **Algorithms**  
  Store algorithm details like name, description, complexity, and associate them with an algorithm type.

- **User Progress**  
  Track user progress on various algorithms (e.g., completed steps, last accessed time).

- **FastAPI Endpoints**  
  Automatically generated Swagger UI at `/docs` and Redoc at `/redoc` for testing and documentation.

- **SQLite Integration**  
  Default local database (`algoverse.db`) for quick setup and testing.

---

## Tech Stack

- **Backend**: [FastAPI](https://fastapi.tiangolo.com/)  
- **Database**: [SQLite](https://www.sqlite.org/index.html) (local by default)  
- **ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)  
- **Password Hashing**: [passlib](https://passlib.readthedocs.io/en/stable/) (bcrypt)  
- **Python Version**: 3.11 (recommended)

---

## Project Structure

AlgoVerse/ ├── algoverse.db # SQLite database file (auto-generated) ├── database.py # Sets up SQLAlchemy engine & session ├── models.py # Database models (User, Algorithm, etc.) ├── crud.py # CRUD operations for each model ├── schemas.py # Pydantic schemas for request/response validation ├── main.py # FastAPI entry point with endpoints ├── requirements.txt # Project dependencies ├── .gitignore # Excludes venv, cache, etc. └── venv/ # (Excluded from git) Virtual environment folder

yaml<br>
Copy<br>
Edit<br>

---

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MHKhanCou/AlgoVerse.git
   cd AlgoVerse
Create & Activate a Virtual Environment (recommended):

bash<br>
Copy<br>
Edit<br>
python -m venv venv<br>
# Windows:
venv\Scripts\activate<br>
# macOS / Linux:
source venv/bin/activate<br>
Install Dependencies:<br>

bash<br>
Copy<br>
Edit<br>
pip install -r requirements.txt<br>
Usage<br>
Initialize / Update the Database:<br>

By default, running the FastAPI app will create algoverse.db if it doesn’t exist.<br>
If you make changes to models, consider using a migration tool like Alembic.<br>
Run the FastAPI Server:<br>

bash<br>
Copy<br>
Edit<br>
uvicorn main:app --reload<br>
The app will be available at http://127.0.0.1:8000.<br>
Test Endpoints:<br>

Swagger UI: http://127.0.0.1:8000/docs<br>
Redoc: http://127.0.0.1:8000/redoc<br>

API Endpoints<br>
Users<br>

POST /users/ - Create a new user<br>
GET /users/{user_id} - Get a specific user<br>
GET /users/ - Get all users (with pagination)<br>
PUT /users/{user_id} - Update a user’s email<br>
DELETE /users/{user_id} - Delete a user<br>

Algorithm Types<br>

POST /algorithm-types/ - Create an algorithm type<br>
GET /algorithm-types/{type_id} - Get a specific algorithm type<br>
GET /algorithm-types/ - Get all algorithm types<br>
PUT /algorithm-types/{type_id} - Update an algorithm type<br>
DELETE /algorithm-types/{type_id} - Delete an algorithm type<br>

Algorithms<br>

POST /algorithms/ - Create an algorithm<br>
GET /algorithms/{algorithm_id} - Get a specific algorithm<br>
GET /algorithms/ - Get all algorithms<br>
PUT /algorithms/{algorithm_id} - Update an algorithm<br>
DELETE /algorithms/{algorithm_id} - Delete an algorithm<br>

User Progress<br>

POST /user-progress/ - Create a progress record<br>
GET /user-progress/{progress_id} - Get a specific progress record<br>
GET /user-progress/by-user/{user_id} - Get all progress for a user<br>
PUT /user-progress/{progress_id} - Update user progress<br>
DELETE /user-progress/{progress_id} - Delete a progress record<br>

Contributing<br>
Fork the repository on GitHub.<br>
Create a feature branch (git checkout -b feature/my-feature).
Commit your changes (git commit -m 'Add some feature').<br>
Push to the branch (git push origin feature/my-feature).<br>
Create a new Pull Request on GitHub.<br>

License<br>
This project is currently unlicensed.<br>

Thank you for using AlgoVerse!<br>
