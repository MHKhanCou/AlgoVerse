# AlgoVerse

**AlgoVerse** is an educational platform designed to help users learn algorithms through interactive lessons and progress tracking. Built with FastAPI, it provides a comprehensive backend for algorithm management, user authentication, progress tracking, and a blog system.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Features

- **User Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (admin/regular users)
  - Secure password hashing

- **Algorithm Management**
  - Categorize algorithms by types
  - Track algorithm difficulty and complexity
  - Detailed algorithm descriptions

- **Progress Tracking**
  - Monitor user progress on algorithms
  - Track completion status
  - Generate user statistics

- **Blog System**
  - Create and share algorithm-related content
  - Search functionality
  - User-specific blog management

- **Admin Dashboard**
  - User management
  - Algorithm type and content management
  - Progress monitoring

## Tech Stack

- **Backend:** FastAPI
- **Database:** SQLite (with SQLAlchemy ORM)
- **Authentication:** JWT tokens
- **Documentation:** Swagger UI and ReDoc

## Project Structure

```plaintext
AlgoVerse/
├── auth/                  # Authentication related code
├── db/                    # Database configuration
│   ├── database.py        # SQLAlchemy setup
│   └── algoverse.db       # SQLite database
├── middleware/            # Custom middleware
├── models/                # Database models
├── repositories/          # Data access layer
├── routes/                # API endpoints
├── schemas/               # Pydantic schemas
├── .env                   # Environment variables
├── .gitignore             # Git ignore file
├── main.py                # Application entry point
└── requirements.txt       # Project dependencies
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
