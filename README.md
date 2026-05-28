# StuRelief

**StuRelief** is a comprehensive, student-centric marketplace platform designed to facilitate safe, reliable, and cost-effective trading among university students. 

The platform serves as a trusted community marketplace where students can buy, sell, or exchange used goods such as textbooks, clothing, vehicles, and technology devices. By tailoring the experience to verified students, it ensures a higher level of trust and security, allowing students to conduct transactions safely—often through direct meetups on campus or at dormitories.

## 🏗️ Project Architecture

StuRelief is built as a modern **Monorepo** using npm workspaces to share code, types, and logic efficiently across the ecosystem. 

### 1. Web Application (`/web`)
*   **Framework:** Next.js (App Router) & React
*   **Styling:** Tailwind CSS, Lucide Icons (Dark mode supported)
*   **Features:** Responsive user storefront, dashboard, admin moderation panel, JWT-based authentication, and Google OAuth integration. Server-side rendering and API routes power the backend logic.

### 2. Mobile Application (`/mobile`)
*   **Framework:** React Native & Expo
*   **Features:** A cross-platform mobile app that provides students with a native experience to browse items, manage profiles, chat with sellers, and post new listings on the go.

### 3. Shared Resources (`/shared`)
*   Contains shared TypeScript interfaces, Data Transfer Objects (DTOs), domain logic, and application constants. This ensures absolute consistency and type safety between the Web and Mobile codebases.

### 4. Database & Infrastructure (`/docker`)
*   **ORM:** Prisma ORM
*   **Database:** PostgreSQL (or compatible SQL database)
*   **Deployment:** Includes Docker configurations (`docker-compose.prod.yml`) for containerized deployment and database hosting.

## ✨ Key Features

*   **Secure Authentication:** Custom JWT login/registration combined with Google OAuth, designed specifically for student identity verification.
*   **Listing Management:** Users can easily create, edit, and delete their own product listings, complete with images, prices, and condition details.
*   **Admin Moderation:** Dedicated admin workflows to review, approve, or delete inappropriate posts and monitor user activity.
*   **Clean Architecture:** Built using Domain-Driven Design (DDD) principles. The codebase strictly separates concerns using Repositories (e.g., `PrismaItemRepository`) and Use Cases (e.g., `UpdateItemUseCase`), making it highly maintainable, scalable, and testable.

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or newer recommended)
*   npm
*   Docker (optional, for running the database locally)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/StuRelief.git
   cd StuRelief
   ```

2. **Install dependencies (from the root to setup workspaces):**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Copy the example environment file and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Make sure to configure your Database URL and JWT Secrets.*

4. **Database Setup:**
   Run Prisma migrations to initialize the database:
   ```bash
   npm run db:setup
   ```

### Running the Apps

**Start the Web application:**
```bash
cd web
npm run dev
```

**Start the Mobile application:**
```bash
cd mobile
npm start
```

## 📄 License
This project is licensed under the MIT License.
