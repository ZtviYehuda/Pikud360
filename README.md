# Pikud360 - Enterprise Workforce Management System (Foundation)

This is the architectural foundation of Pikud360, a large-scale enterprise Workforce Management System (WFM) built for employee tracking, shifts, scheduling, and live operations management. 

At this stage, the project contains no business logic or database tables. It serves as a production-ready clean architecture boilerplate.

---

## Technical Stack Overview

### Frontend
* **Core**: React 19 (Strict Mode), TypeScript, Vite 7
* **Styling**: Tailwind CSS v4, Framer Motion (animated layouts)
* **UI Controls**: Radix UI Primitives, Lucide React (icons)
* **Routing**: React Router v7
* **Data Hooks**: TanStack Query (React Query)
* **State Management**: Zustand (UI UIStore, AuthStore)
* **Http Client**: Axios (client-side interceptors)

### Backend
* **Core**: Python 3.11+, Flask (Blueprint routing structure)
* **Authentication**: Flask-JWT-Extended placeholders
* **Database Driver**: psycopg2 (Threaded Connection Pooling)
* **Configuration**: python-dotenv config manager
* **Error Handling**: Centralized exception handler and custom HTTP errors
* **Logging**: Structured console formatters and request-duration interceptors

### Infrastructure
* **Containers**: Docker and Docker Compose
* **Testing**: Pytest (Backend) and Vitest (Frontend)

---

## Documentation Directory
All detailed systems specifications are located under the `docs/` folder:

* **[Installation Guide](file:///c:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/installation_guide.md)**: Setup and run the project locally or via Docker Compose.
* **[Folder Structure](file:///c:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/folder_structure.md)**: Directory details, file rules, and layer organization.
* **[System Architecture](file:///c:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/architecture.md)**: Details on Clean Architecture rules, SOLID principles, Dependency Injection, and Repository patterns.
* **[API Documentation](file:///c:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/api_documentation.md)**: Root HTTP endpoints, parameters, and success/error envelope shapes.
* **[Developer Guide](file:///c:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/developer_guide.md)**: Coding standards, formatting guidelines, and scaling feature sets.
