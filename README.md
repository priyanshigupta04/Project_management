# Ether AI Project

Ether AI is a full-stack project management application with authentication, project, and task management features. It uses a Node.js/Express backend with MongoDB and a React frontend styled with Tailwind CSS.

## Project Structure

```
render.yaml
backend/
    package.json
    server.js
    config/
        db.js
    controllers/
        authController.js
        dashboardController.js
        projectController.js
        taskController.js
    middleware/
        auth.js
        roleCheck.js
    models/
        Project.js
        Task.js
        User.js
    routes/
        auth.js
        dashboard.js
        projects.js
        tasks.js
frontend/
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    vite.config.js
    src/
        App.jsx
        index.css
        main.jsx
        api/
            axios.js
        components/
            Layout.jsx
            Sidebar.jsx
        context/
            AuthContext.jsx
        pages/
            Dashboard.jsx
            Login.jsx
            ProjectDetail.jsx
            Projects.jsx
            Register.jsx
```

## Getting Started

### Backend
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (see `.env.example` if available) and set your environment variables.
4. Start the backend server:
   ```bash
   npm start
   ```

### Frontend
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

## Features
- User authentication (register/login)
- Project management (CRUD)
- Task management (CRUD)
- Dashboard overview
- Role-based access control

## Technologies Used
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend:** React, Vite, Tailwind CSS, Axios

## License
This project is for educational purposes.
