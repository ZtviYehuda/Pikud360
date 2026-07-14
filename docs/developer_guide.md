# Developer Guide

Welcome to the Pikud360 developer guide. This document details our engineering requirements, naming standards, typings, and guidelines for extending the system.

---

## Coding Standards

### Backend (Python)
* **Code Formatting**: Use standard PEP 8 rules. Format files using `black`.
* **Typing**: All functions, variables, parameters, and return signatures must have explicit Python type annotations.
  * **Incorrect**: `def fetch_user(user_id):`
  * **Correct**: `def fetch_user(user_id: str) -> Optional[User]:`
* **SOLID Compliance**:
  * Business rules go into the `services/` layer.
  * Data storage details go into the `repositories/` layer.
  * Controllers reside under the `api/` blueprints layer.

### Frontend (TypeScript)
* **TypeScript Strict Mode**: Set to `true` in `tsconfig.json`. Ensure no implicit `any` variables exist. Avoid using `@ts-ignore` overrides.
* **Component Design**:
  * Keep React components small and modular.
  * Store shared utilities in `utils/`.
  * Group modular page components in `features/` or `pages/`.
* **React 19 Hooks**:
  * Utilize standard hooks: `useState`, `useEffect`, `useMemo`, `useCallback`.
  * Keep side-effects isolated and avoid duplicate render loops.
* **State Management**:
  * Global UI/layout settings go into Zustand's `uiStore`.
  * User context, roles, and permissions go into Zustand's `authStore`.
  * External REST payloads and remote queries are queried using TanStack Query hooks in `services/`.

---

## Designing and Adding New Features

Follow this standard flow to build new features:

### Step 1: Backend Setup
1. Define your data models in `app/models/`.
2. Define a repository contract in `app/repositories/` and implement database queries using `psycopg2`.
3. Create a business logic service in `app/services/` that accepts the repository interface in its constructor.
4. Establish input/output models using Pydantic or validation rules in `app/schemas/`.
5. Register route URLs under a blueprint in `app/api/v1/`.

### Step 2: Frontend Setup
1. Declare your TypeScript interface schemas in `src/types/`.
2. Add endpoints querying the backend inside the Axios `apiClient` mapping.
3. Configure a query hook inside `src/services/` using TanStack Query `useQuery` or `useMutation`.
4. Configure state settings inside a feature page or custom component.
5. Setup routing mappings in `src/routes/` to display your page.
