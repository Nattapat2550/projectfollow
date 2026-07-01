# Project Overview: Illegal Immigrants & Repatriated Persons Management System

## Project Purpose
This project is a management system designed to track and monitor illegal immigrants and repatriated persons. It provides tools for data entry (individual and bulk via Excel), statistical visualization through a dashboard, and storage of related documents and photos.

---

## 1. Data Structures & Schema Design

### Database Tables (defined in `/database.sql`)

#### 1. `users`
Represents administrators who manage records in the system.
* `id`: `UUID` (Primary Key, default `gen_random_uuid()`)
* `name`: `VARCHAR(50)` (Unique login username)
* `password`: `VARCHAR(255)` (Bcrypt hashed password)
* `role`: `VARCHAR(20)` (Access level, default `'user'`)
* `color`: `VARCHAR(7)` (UI hex color code for highlight avatar display)

#### 2. `illegal_immigrants`
Tracks illegal immigrants who are apprehended entry-side.
* `id`: `UUID` (Primary Key, default `gen_random_uuid()`)
* **Personal Data:** `first_name_th`, `middle_name_th`, `last_name_th`, `first_name_en`, `middle_name_en`, `last_name_en` (`VARCHAR(255)`), `gender` (`VARCHAR(50)`), `date_of_birth` (`DATE`), `age` (`INT`), `national_id` (`VARCHAR(50)`), `passport_id` (`VARCHAR(255)`), `nationality` (`VARCHAR(255)`)
* **Assets:** `photo_url` (`TEXT`), `passport_photo_url` (`TEXT`)
* **Specific Data:**
  * `detected_location_details`: `TEXT`
  * `detected_location_sub_district`, `detected_location_district`, `detected_location_province`: `VARCHAR(255)`
  * `is_victim`: `BOOLEAN` (Human trafficking victim status)
  * `detected_date`: `DATE`
  * `workplace`: `VARCHAR(255)`
  * `screening_details`: `TEXT`
  * `note`: `TEXT` (Internal notes)
* **Metadata:** `created_at`, `updated_at` (`TIMESTAMP`), `created_by` (`UUID` referencing `users.id`)

#### 3. `repatriated_persons`
Tracks persons processed for deportation/repatriation.
* `id`: `UUID` (Primary Key, default `gen_random_uuid()`)
* **Personal Data:** Same demographic fields as `illegal_immigrants`, with `national_id` enforced as NOT NULL.
* **Assets:** `photo_url` (`TEXT`), `passport_photo_url` (`TEXT`)
* **Specific Data:**
  * `address_details`: `TEXT`
  * `sub_district`, `district`, `province`, `building`, `floor`, `room`: `VARCHAR(255)`
  * `job_type`, `role`: `VARCHAR(255)`
  * `salary`: `VARCHAR(100)`
  * `paid_by`, `payment_method`: `VARCHAR(255)`
  * `number_of_case`: `INT` (Default `0`)
  * `number_of_warrant`: `INT` (Default `0`)
  * `is_victim`: `victim_status_enum` (Enum values: `'YES'`, `'NO'`, `'PENDING'`)
  * `responsible_agency`: `VARCHAR(255)`
  * `return_date`: `DATE`
  * `channel`: `VARCHAR(255)` (Repatriation pathway)
  * `note`: `TEXT`
* **Metadata:** `created_at`, `updated_at` (`TIMESTAMP`), `created_by` (`UUID` referencing `users.id`)

---

### TypeScript Interfaces (defined in `/frontend/src/lib/model`)

#### `ImmigrantData` (`immigrant.d.ts`)
```typescript
interface ImmigrantData {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender: "male" | "female";
  nationality: string;
  passport_id?: string | null;
  detected_location: string;
  detected_date?: string | null;
  is_victim?: boolean | null;
  creator_name?: string | null;
  creator_color?: string | null;
}
```

#### `RepatriateData` (`deport.d.ts`)
```typescript
interface RepatriateData {
  id: string;
  first_name_th: string;
  middle_name_th?: string | null;
  last_name_th: string;
  first_name_en: string;
  middle_name_en?: string | null;
  last_name_en: string;
  gender: "male" | "female";
  national_id: string;
  passport_id?: string | null;
  birth_day: number;
  birth_month: number;
  birth_year: number;
  address: string;
  image_url?: string | null;
  number_of_case: number;
  number_of_warrant: number;
  is_victim?: boolean | null;
}
```

---

## 2. API Endpoints Map & Handler Methods

All route files are registered under `/api/v1` prefix in `/backend/app.js`.

### 1. Authentication Controller (`/backend/controllers/auth.js`)
Methods handling authentication, password, and profile updates.
* **`register(req, res)`** [`POST /auth/register`]: Creates a user account with hashed password and returns signed JWT.
* **`login(req, res)`** [`POST /auth/login`]: Authenticates user, signs JWT with expiration, and saves it inside an HttpOnly cookie named `token`.
* **`logout(req, res)`** [`GET /auth/logout`]: Clears the HTTP cookie.
* **`getMe(req, res)`** [`GET /auth/me`]: Retrieves details of the requesting user.
* **`updateProfile(req, res)`** [`PUT /auth/profile`]: Modifies user display name and profile display color.
* **`updatePassword(req, res)`** [`PUT /auth/password`]: Validates current password and updates it in the DB.

### 2. Immigrant & Repatriation Controllers (`/backend/controllers/*`)
* **`immigrantController.js`:**
  * **`getAllData(req, res)`** [`GET /immigrants/`]: Queries combined rows from both tables.
  * **`getDashboardData(req, res)`** [`GET /immigrants/dashboard`]: Paginates, searches, and sorts records for the main listings.
* **`illegalController.js`:**
  * **`getIllegalById(req, res)`** [`GET /immigrants/illegal/:id`]: Fetches detailed illegal immigrant profile.
  * **`createIllegal(req, res)`** [`POST /immigrants/illegal`]: Saves entry, uploads images via `googleDriveService` and records the creator.
  * **`updateIllegal(req, res)`** [`PUT /immigrants/illegal/:id`]: Updates DB columns, replaces Drive assets if file buffers are provided.
  * **`deleteIllegal(req, res)`** [`DELETE /immigrants/illegal/:id`]: Cleans up DB row and deletes files from Drive.
  * **`uploadExcelIllegal(req, res)`** [`POST /immigrants/upload-excel-illegal`]: Handles chunked file parsing, validates inputs, and launches async insert queries, saving job status inside a server cache.
  * **`getUploadProgress(req, res)`** [`GET /immigrants/upload-progress/:jobId`]: Reports Excel upload progress.
* **`repatriatedController.js`:**
  * Maps matching CRUD controllers for repatriated profiles (`getRepatriatedById`, `createRepatriated`, `updateRepatriated`, `deleteRepatriated`).

### 3. Dashboard Controller (`/backend/controllers/dashboardController.js`)
* **`getDashboardStats(req, res)`** [`GET /dashboard`]: Aggregates totals and generates values for charts segmented by gender, nationality, location, victims, and return channels.

---

## 3. Page Features (Next.js Routes)

### 1. Landing / Overview (`/`)
* **Features:**
  * Real-time metrics counters displaying total entries.
  * Visual distribution summary charts (Donut SVG charts) mapping nationalities and return channels.
  * Responsive layout styled dynamically for Light and Dark themes.
  * Direct action buttons to register records or view dashboards.

### 2. Dashboard (`/dashboard`)
* **Features:**
  * Sidebar panel with granular criteria filter dropdowns (type, nationality, location, gender, victim status, creators, dates).
  * Dynamic stacked bar charts rendering data fractions.
  * Configurable dashboard settings overlay that permits toggling specific charts visibility (stored in cookies).
  * Direct table listing integration reflecting filters, supporting global search, column sorting, and pagination.

### 3. Record Lists (`/immigrants/illegal` and `/immigrants/repatriated`)
* **Features:**
  * Simplified global search bar implementing query string splits (e.g. searching "Somchai Myanmar" searches both name and nationality columns).
  * Dynamic rows showing key indicators (victim badges, profile avatar, timestamp, creator info).
  * Pagination footer with jumping controls.
  * Sorting headers toggle.

### 4. Create Record (`/immigrants/illegal/create` and `/immigrants/repatriated/create`)
* **Features:**
  * Multipart entry forms with validation checking.
  * Dual drag-and-drop attachment zones for photos and passports.
  * Smart address selector dropdown chain (selecting Province filters Districts, which filters Sub-Districts).
  * Integrated Google Drive upload hook.

### 5. Detail & Edit View (`/immigrants/[id]`)
* **Features:**
  * Renders `UniversalImmigrantCard` with Apple-Card styling based on the record type (`illegal` / `repatriated`).
  * Side notes panel enabling user-specific log inputs.
  * Edit mode toggle displaying prefilled `ImmigrantEditForm` with live photo swap previews.

---

## 4. Frontend Page Dependencies Map

| Page / Route Path | Client/Server Mode | Custom Hooks Used | Components Imported | Key API Endpoints Called |
|-------------------|-------------------|-------------------|---------------------|--------------------------|
| `/` (Landing) | Server Component | None | `HomeCard`, `DonutChart` | `GET /api/v1/dashboard?type=illegal`<br>`GET /api/v1/dashboard?type=repatriated` |
| `/login` | Client Component | None | `LoginForm`, `Button`, `Input` | `POST /api/v1/auth/login` |
| `/user` | Client Component | None | `Button`, `Input` | `PUT /api/v1/auth/profile`<br>`PUT /api/v1/auth/password` |
| `/dashboard` | Client Component | `useDashboard` | `BarChart`, `IllegalTable`, `RepatriatedTable` | `GET /api/v1/dashboard?type=...` |
| `/immigrants/illegal` | Client Component | None | `IllegalTable` | `GET /api/v1/immigrants/dashboard?type=illegal` |
| `/immigrants/repatriated` | Client Component | None | `RepatriatedTable` | `GET /api/v1/immigrants/dashboard?type=repatriated` |
| `/immigrants/[id]` | Client Component | `useImmigrantDetail` | `UniversalImmigrantCard`, `RightPanel`, `ImmigrantEditForm` | `GET /api/v1/immigrants/illegal/:id`<br>`GET /api/v1/immigrants/repatriated/:id`<br>`PUT /api/v1/immigrants/*`<br>`DELETE /api/v1/immigrants/*` |
| `/immigrants/illegal/create` | Client Component | `useAddressOptions` | `Button`, `Input`, `Select` | `POST /api/v1/immigrants/illegal` |
| `/immigrants/repatriated/create` | Client Component | `useAddressOptions` | `Button`, `Input`, `Select` | `POST /api/v1/immigrants/repatriated` |
| `/help` | Client Component | None | Accordion layouts | None |

### Shared Client Contexts & Layout Dependencies
* **[layout.tsx](file:///G:/m/chula/Class/1/1_3/intern/police%202nd/projectfollow-mark/frontend/src/app/layout.tsx):**
  * `ThemeProvider` (`next-themes`): Wraps the HTML root, sets data-theme attribute class.
  * `ServerAwaker`: Fires a ping to the backend root URL (`GET /`) upon initial component mount.
  * `TopBar`: Placed globally; reads localStorage JWT token to retrieve authenticated user profile via `/api/v1/auth/me`.
* **[middleware.ts](file:///G:/m/chula/Class/1/1_3/intern/police%202nd/projectfollow-mark/frontend/src/middleware.ts):**
  * Evaluates cookie header for `token`. Protects all non-public paths (redirects to `/login?callbackUrl=...`).

