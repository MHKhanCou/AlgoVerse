# AlgoVerse Frontend

This is the frontend for AlgoVerse, built with React 18 and Vite.

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the API base URL if needed:
     ```
     VITE_API_BASE_URL=http://localhost:8000
     ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The app will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/      # React context providers
├── pages/         # Page components
├── services/      # API service functions
└── styles/        # CSS modules and global styles
```

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Development

- Uses Vite for fast development with HMR
- ESLint and Prettier for code quality
- React Router for navigation
- Context API for state management

## 🔐 Authentication

The app uses JWT for authentication. See `src/contexts/AuthContext.jsx` for implementation details.

## 📝 Environment Variables

Create a `.env` file in the frontend directory with:
```
VITE_API_BASE_URL=your_api_url_here
```

## 🔄 Deployment

Build for production:
```bash
npm run build
```

The built files will be in the `dist` directory, ready to be served by any static file server.
