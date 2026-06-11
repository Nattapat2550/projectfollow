# Project Overview: Illegal Immigrants & Deported Persons Management System

## Project Purpose
This project is a management system designed to track and monitor illegal immigrants and deported persons. It provides tools for data entry (individual and bulk via Excel), statistical visualization through a dashboard, and storage of related documents and photos.

## Project Structure

### Backend (`/backend`)
Built with **Node.js** and **Express.js**, using **Prisma** as an ORM and **PostgreSQL** for the database.

- `server.js`: Entry point of the server.
- `app.js`: Express application setup, middleware (CORS, JSON, static files), and route registration.
- `prisma/schema.prisma`: Defines the database models (`illegal_immigrants`, `deported_persons`).
- `routes/`:
  - `immigrants.js`: Routes for managing immigrant data.
  - `dashboard.js`: Routes for dashboard statistics.
  - `testUpload2.js`: Test routes for Excel uploads.
- `controllers/`:
  - `immigrantController.js`: Logic for CRUD operations and Excel processing.
  - `dashboardController.js`: Logic for calculating statistics.
  - `testUpload2Controller.js`: Logic for test Excel uploads.
- `config/`:
  - `db.js`: Database connection pool configuration.
- `uploads/`: Stores uploaded files (e.g., photos of deported persons).

### Frontend (`/frontend`)
Built with **Next.js** (App Router), **TypeScript**, and **Tailwind CSS**.

- `src/app/`: Contains the application pages.
  - `page.tsx`: Home page / Dashboard (currently a placeholder).
  - `test-upload/`, `test-upload2/`: Experimental pages for file uploading.
- `src/components/`: Reusable UI components (utilizing Shadcn UI).
- `src/lib/`: Utility functions and helpers.
- `public/`: Static assets (images, icons).

### Database (`/database.sql`)
- Contains the raw SQL schema for PostgreSQL, including Enums and Table definitions.

---

## Backend Endpoints

### Immigrants API (`/api/immigrants`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Fetch all illegal immigrants and deported persons. |
| POST | `/illegal` | Create a new illegal immigrant record. |
| POST | `/deported` | Create a new deported person record (supports photo upload). |
| POST | `/upload-excel-illegal` | Bulk upload illegal immigrant data from an Excel file. |

### Dashboard API (`/api/dashboard`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get statistical summary (Total counts, victims, passport status, deportation channels). |

### Test API (`/api/test-upload2`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload-excel` | Test endpoint for Excel file uploading. |

---

## Frontend Summary
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS 4, Lucide React (Icons).
- **UI Components:** Radix UI, Shadcn UI (Accordion, Button, Dropdown, Sheet, etc.).
- **Themes:** Supports Light/Dark mode via `next-themes`.
- **Key Features:**
  - Navigation menu for easy access.
  - Responsive design using Shadcn UI components.
  - Integration with backend APIs for data visualization and management.
