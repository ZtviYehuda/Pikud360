# Folder Structure Documentation

This document describes the directory tree and file architecture of the Pikud360 enterprise Workforce Management System.

## Project Root Layout
```
Pikud360/
├── backend/             # Python Flask application source and test suites
├── frontend/            # React 19 / Vite 7 / Tailwind CSS v4 source
├── docker/              # Docker configuration files and database initialization scripts
├── docs/                # System architecture, developer guides, and templates
├── scripts/             # Developer environment bootstrap and automation scripts
└── docker-compose.yml   # Multi-container local orchestration manifest
```

---

## Backend Directory Details
Located under `backend/`.

* **`app/`**: Core package containing the Flask application factory.
  * **`api/v1/`**: Routing blueprints divided by API versions. Contains path endpoints definitions.
  * **`auth/`**: Placeholders for token extraction, decoding, and JWT extensions configurations.
  * **`config/`**: System configuration manager (`settings.py`) pulling typed environment variables.
  * **`core/`**: Critical runtime plumbing including centralized `logging.py`, `errors.py` (exception filter interceptors), and `responses.py` (global envelope layout).
  * **`database/`**: Database connection pooler managing PostgreSQL connections.
  * **`middleware/`**: Cross-cutting HTTP interceptors (CORS rules, API request duration logging).
  * **`models/`**: Domain schemas and abstract Python data definitions.
  * **`repositories/`**: Database CRUD interfaces following the Repository Pattern.
  * **`services/`**: Business logic layer injecting repository contracts following Dependency Injection.
  * **`schemas/`**: User input formatting, data validation policies, or payload checkers.
  * **`utils/`**: Shared static formatting, hashing, or validation helpers.
* **`tests/`**: Pytest testing suites.
* **`requirements.txt`**: Declares backend library dependencies and versions.
* **`run.py`**: Local development entry point.

---

## Frontend Directory Details
Located under `frontend/`.

* **`public/`**: Static site asset distribution (favicon, manifest, assets).
* **`src/`**: React application source.
  * **`api/`**: Axios instance client pre-configured with interceptors to inject JWT headers and language states.
  * **`assets/`**: Images, logos, SVG illustrations, and icons.
  * **`components/`**: Shared components (collapsible animated Sidebar, Top Bar, Radix dialogs).
  * **`features/`**: Modular sub-sections grouped by domain (auth widgets, timesheet grids, shifts views).
  * **`hooks/`**: Custom React hooks (theme helpers, event listeners).
  * **`layouts/`**: Container configurations wrapping page routing, flex grid adapters, and RTL/LTR supports.
  * **`pages/`**: View endpoints (Dashboard, Employees, Attendance, Settings).
  * **`routes/`**: React Router v7 navigation configurations.
  * **`services/`**: TanStack Query server-state hook interfaces.
  * **`stores/`**: Zustand client state management (Layout UI store, Auth store).
  * **`styles/`**: Global stylesheets configuring Tailwind CSS v4 variables.
  * **`types/`**: Strict TypeScript interfaces and API schemas.
  * **`utils/`**: String helpers, date parsers, and numbers formatting.
* **`package.json`**: NPM package manifest and scripts.
* **`tsconfig.json`**: TypeScript compiler parameters.
* **`vite.config.ts`**: Vite 7 server compilation rules.
