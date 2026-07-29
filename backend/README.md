# SkillSwap Backend

This backend powers the authentication and API layer for the SkillSwap application. It is built with Node.js, Express, a Database, and JSON Web Tokens (JWT) to support user registration, login, and protected access to user data.

## Overview

The backend provides a simple REST API for managing users and securing routes with JWT-based authentication. It connects to a Database and exposes endpoints for account creation and authentication.

## Features

- User registration and sign-in through Supabase Auth
- Secure user login with JWT token generation
- Protected routes for authenticated users
- Input validation using Zod
- PostgreSQL integration through Supabase
- CORS enabled for frontend communication

## Tech Stack

- Node.js
- Express.js
- Supabase PostgreSQL + Supabase Auth (`@supabase/supabase-js`)
- JWT (jsonwebtoken)
- Zod for validation
- dotenv for environment configuration

## Project Structure

- server.js: main Express server entry point
- routes/authRoutes.js: authentication API routes
- controllers/authController.js: register/login/user profile logic
- middleware/auth.js: JWT authentication middleware
- middleware/validate.js: request validation middleware
- utils/authValidation.js: Zod validation schemas
- config/db.js: shared Supabase client setup

## Installation

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file and configure the following variables:
   ```env
   PORT=5000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key
   JWT_SECRET=your_secret_key
   ```

## Running the Server

Start the development server:

```bash
npm run dev
```

The API will run on:

```text
http://localhost:5000
```

## API Endpoints

### Authentication

- POST /api/auth/register - Create a new user account
- POST /api/auth/login - Authenticate a user and return a JWT
- GET /api/auth/me - Get the authenticated user's profile

## Notes

This backend is designed to work alongside the frontend of the SkillSwap project and provides the core authentication flow for the application.
