# SkillSwap — The Neighbourhood Knowledge Network

SkillSwap is a local skill-sharing platform designed to help community members trade their skills, knowledge, and hobbies. As the tagline highlights: **"Trade what you know for what you want to learn, with good people around you."**

This repository contains the complete codebase for the SkillSwap application. The project is designed with a decoupled architecture, isolating the frontend application from future backend and database implementations.

---

## 📂 Project Structure

The project is structured to keep teams and concerns independent. The folder structure is laid out as follows:

- **[`frontend/`](file:///c:/Users/lahar/Desktop/cp/SkillSwap/frontend)**: Contains the React, TypeScript, and Vite-powered user interface.
- **`backend/`** *(Future)*: Planned directory for server-side APIs, routing, and business logic.
- **`database/`** *(Future)*: Planned directory for database schemas, migration files, and seeding scripts.

---

## 💻 Frontend Application

The frontend is a modern single-page application (SPA) optimized for performance and aesthetic excellence.

### Key Features
*   **Authentication Flow**: Demo-ready sign-in and sign-up interfaces with clientside validation and session storage.
*   **Protected Routing**: Access control based on user roles (`admin` vs `user`), automatically redirecting unauthorized attempts.
*   **Admin Dashboard**: A comprehensive interface for organizers showing community metrics, growth insights (recharts), new member lists, and pending exchange requests.
*   **Member Dashboard**: A personalized dashboard for members to discover nearby neighbors, search for specific skills, and track progress along their learning path.

### 🛠️ Tech Stack & Dependencies

*   **Framework**: [React 19](https://react.dev/) & [Vite](https://vitejs.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS v3](https://tailwindcss.com/)
*   **Routing**: [React Router DOM v7](https://reactrouter.com/)
*   **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Charts**: [Recharts](https://recharts.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---


### Color Palette
- **Ink (`#211b47`)**: Deep dark violet/purple used for high-contrast headers, text, and main containers.
- **Violet (`#6558e8`)**: Vibrant brand purple used for main call-to-action buttons, links, and highlighting active states.
- **Mint (`#bdf4d1`)**: Fresh green accent color representing growth, success statuses, and dashboard highlights.
- **Coral (`#ff937f`)**: Dynamic warm orange used for warnings, notifications, and alert statuses.
- **Sand (`#f7f5f2`)**: Light cream background color providing a soft, high-end editorial feel compared to generic greys.

### Typography
- **Display Font**: Georgia/Serif for an elegant, editorial aesthetic.
- **Sans Font**: Inter / System-Sans for readable and functional body layouts.
- **Mono Font**: DM Mono for indicators, eyebrows, and status badges.

---

## 🚀 Getting Started

To run the frontend application locally, follow these steps:

### 1. Installation
Navigate into the frontend directory and install the dependencies:
```bash
cd frontend
npm install
```

### 2. Development Server
Start the Vite local development server:
```bash
npm run dev
```

### 3. Build & Production Check
To build the application and check for TypeScript errors:
```bash
npm run build
```

---


