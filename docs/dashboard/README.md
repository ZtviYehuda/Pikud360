# Pikud360 Commander Dashboard Specifications

This directory contains the complete operational design, structural wireframes, data contracts, and component architecture for the **Commander Dashboard** in Pikud360.

---

## 1. Documentation Index

1. **[commander-dashboard-architecture.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-architecture.md)**:
   - *Purpose*: Core operational principles, information hierarchies, widget profiles, daily operational KPIs, user workflows, and dashboard states.
2. **[commander-dashboard-wireframes.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-wireframes.md)**:
   - *Purpose*: Low-fidelity wireframe blueprints showing structural layouts and grid placements for Desktop, Tablet, and Mobile viewports without visual styling.
3. **[commander-dashboard-data-contracts.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-data-contracts.md)**:
   - *Purpose*: Mappings between UI widgets and data scopes, loading phases, and handling errors/empty scenarios.
4. **[commander-dashboard-dtos.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-dtos.md)**:
   - *Purpose*: Schema blueprints (TypeScript interfaces & JSON objects) for workforce, attendance, alerts, and activity logs.
5. **[commander-dashboard-api-contract.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-api-contract.md)**:
   - *Purpose*: Design of REST API endpoints, query structures, parameter definitions, caching policies, and authentication scopes.
6. **[commander-dashboard-components.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-components.md)**:
   - *Purpose*: React component tree configurations, parent-child flows, slot structures, and feature folder trees.
7. **[commander-dashboard-hooks.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-hooks.md)**:
   - *Purpose*: Custom React hook signatures (inputs, outputs, loading, error handlers, polling cycles).
8. **[commander-dashboard-state.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-state.md)**:
   - *Purpose*: State categorization (local vs shared vs derived vs server states) and boundary layouts.
9. **[commander-dashboard-review.md](file:///C:/Users/nafta/OneDrive/שולחן%20העבודה/Pikud360/docs/dashboard/commander-dashboard-review.md)**:
   - *Purpose*: Architecture choices, design decisions, trade-offs, and open questions.

---

## 2. Recommended Reading Path

To gain a complete understanding of the system architecture, read the files in the following order:

```
Step 1: Core Objectives & Workflows
  └── commander-dashboard-architecture.md
Step 2: Low-Fidelity Layout Blueprints
  └── commander-dashboard-wireframes.md
Step 3: API Endpoints & JSON DTO Structures
  ├── commander-dashboard-data-contracts.md
  ├── commander-dashboard-dtos.md
  └── commander-dashboard-api-contract.md
Step 4: React Modular Layout & State Boundaries
  ├── commander-dashboard-components.md
  ├── commander-dashboard-hooks.md
  └── commander-dashboard-state.md
Step 5: Trade-offs & Recommendations
  └── commander-dashboard-review.md
```

---

## 3. Relationships & Implementation Roadmap

These specifications form a complete operational blueprint:
- **Architecture** defines *what* and *why*.
- **Wireframes** map out the *structural layout rules* before visuals are considered.
- **Data Contracts** shape the *backend communication models*.
- **Component Architecture** structures the *React modules* and hooks before coding.
- **Future UI Implementation** (next phases) implements React components following the blueprints exactly.
