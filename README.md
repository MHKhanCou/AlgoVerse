# AlgoVerse

**AlgoVerse** is an educational platform to learn algorithms and competitive programming. It features interactive lessons, progress tracking, and a blog system with a responsive UI and an admin dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#usage)
  - [Running the Backend](#running-the-backend)
  - [Running the Frontend](#running-the-frontend)
- [Database](#database)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Algorithm Types](#algorithm-types)
  - [Algorithms](#algorithms)
  - [Progress](#progress)
  - [Blogs](#blogs)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### User Authentication
- JWT-based login/registration  
- Role-based access (student, admin)  
- Profile settings management  

### Algorithm Management
- Filter and search by category/difficulty  
- Detailed algorithm pages  
- Paginated listings

### Progress Tracking
- Statuses: Not Started, Enrolled, Completed  
- A dedicated "My Progress" page with tabs  
- Personalized user statistics  

### Blog System
- Create, edit, and delete blogs  
- Search functionality  
- User-specific blog management  

### Admin Dashboard
- Manage users, algorithms, and blogs  
- Monitor overall progress  
- Perform bulk actions and notifications  

### Frontend
- Responsive UI with light/dark mode  
- Card-based design  
- Pages include: Home, Algorithms, Progress, Blogs, Profile

---

## Tech Stack

- **Frontend:** ReactJS, Custom CSS, Vite  
- **Backend:** FastAPI  
- **Database:** SQLite, SQLAlchemy  
- **Authentication:** JWT  
- **Documentation:** Swagger UI, ReDoc

---

## Project Structure

```plaintext
AlgoVerse/
├── backend/                   # FastAPI backend
│   ├── api/                   # API routes
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── algorithms.py      # Algorithm endpoints
│   │   ├── blogs.py           # Blog endpoints
│   │   ├── progress.py        # Progress endpoints
│   │   └── admin.py           # Admin endpoints
│   ├── core/                  # Configuration and settings
│   │   └── config.py          # App configuration
│   ├── db/                    # Database files
│   │   ├── database.py        # SQLAlchemy setup
│   │   └── algoverse.db       # SQLite database
│   ├── models/                # Database models
│   ├── schemas/               # Pydantic schemas
│   ├── repositories/          # Data access layer
│   ├── .env                   # Environment variables
│   ├── main.py                # FastAPI application entry
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React frontend
│   ├── src/                   # React source code
│   │   ├── assets/            # Images and icons
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API calls
│   │   ├── styles/            # Custom CSS files
│   │   └── App.jsx            # Main React app
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
├── .gitignore                 # Git ignore file
└── README.md                  # Project documentation
```

---

## Installation

### Clone the Repository
```bash
git clone https://github.com/MHKhanCou/AlgoVerse.git
cd AlgoVerse
```

---

### Backend Setup

1. **Create & Activate a Virtual Environment**
  
   **Windows:**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
   
   **macOS / Linux:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

---

### Frontend Setup

1. **Install Node Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

---

## Usage

### Running the Backend

1. **Start the FastAPI Server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Access the API:**
   - **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Running the Frontend

1. **Start the Development Server:**
   ```bash
   cd ../frontend
   npm run dev
   ```

2. **Access the Frontend App:**  
   Typically available at [http://localhost:5173](http://localhost:5173)

---

## Database

- **SQLite Database:** The `algoverse.db` file is created automatically on backend startup.
- **Migrations:** Use tools like Alembic when updating models.

---

## API Endpoints

### Authentication & Users
- **POST** `/auth/login`  
- **POST** `/auth/register`

### Algorithm Types
- **POST** `/algorithm-types/` – Create a new type *(admin only)*
- **GET** `/algorithm-types/{type_id}` – Retrieve a type by ID
- **GET** `/algorithm-types/` – List all types
- **PUT** `/algorithm-types/{type_id}` – Update a type *(admin only)*
- **DELETE** `/algorithm-types/{type_id}` – Delete a type *(admin only)*

### Algorithms
- **POST** `/algorithms/` – Create an algorithm *(admin only)*
- **GET** `/algorithms/{algorithm_id}` – Retrieve an algorithm by ID
- **GET** `/algorithms/` – List all algorithms (paginated)
- **PUT** `/algorithms/{algorithm_id}` – Update an algorithm *(admin only)*
- **DELETE** `/algorithms/{algorithm_id}` – Delete an algorithm *(admin only)*

### Progress
- **POST** `/user-progress/` – Create a progress record
- **GET** `/user-progress/{progress_id}` – Retrieve a progress record
- **GET** `/user-progress/by-user/{user_id}` – List progress records for a user
- **PUT** `/user-progress/{progress_id}` – Update a progress record
- **DELETE** `/user-progress/{progress_id}` – Delete a progress record

### Blogs
- **POST** `/blogs/` – Create a blog post
- **GET** `/blogs/{blog_id}` – Retrieve a blog post
- **GET** `/blogs/` – List all blogs (with search and pagination)
- **PUT** `/blogs/{blog_id}` – Update a blog post
- **DELETE** `/blogs/{blog_id}` – Delete a blog post

---

## Contributing

1. **Fork the repository** on GitHub.
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Add feature"
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/my-feature
   ```
5. **Open a Pull Request** on GitHub.

---

## License

This project is currently unlicensed.

---

Thank you for using AlgoVerse!  
For any questions, suggestions, or issues, please [open an issue](https://github.com/MHKhanCou/AlgoVerse/issues) or submit a pull request.