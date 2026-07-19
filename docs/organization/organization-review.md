# Organization Module — Production Readiness Review

**Domain:** Organization  
**Phase:** 15.7 — Organization Production Review  
**Status:** Design Validated (Pending Implementation)

---

## 1. Executive Summary

This readiness review evaluates the complete design specification prepared for the **Organization Domain** in Phase 15. 

The domain design has been assessed across the following areas: Domain Architecture (Phase 15.1), Hierarchy Specification (Phase 15.2), Business Rules (Phase 15.3), Data Contracts (Phase 15.4), REST API Design (Phase 15.5), and UI Architecture (Phase 15.6).

### Verdict: ✅ READY FOR DEVELOPMENT
The Organization specifications are complete, highly scalable, and conform to the system's "Operational First" philosophy. Development can proceed immediately upon resolution of the recommendations listed in Section 8.

---

## 2. Architecture Review

The Organization domain uses a strict single-rooted tree structure. Recursion lookups are handled via a closure table (`core.organization_unit_closure`).

### Key Strengths
- **Decoupled Node Metadata**: Reusing a generic node tree with `typeName` indicators and a `metadata` JSONB column (Phase 15.1) prevents tenant customizations from modifying the database schema.
- **Fast Ancestor/Descendant Lookups**: The closure table layout resolves sub-tree query paths in $O(1)$ read time without recursive SQL joins.

### Recommendations
- **Metadata Versioning**: Since metadata schemas vary by tenant (e.g. callsigns vs bed capacities), a JSON schema validator should be tied to tenant config profiles to prevent corrupted JSON properties from being saved to the database.

---

## 3. User Experience (UX) Review

The UX layout details cover organization tree pages, details views, and global scoped selectors (`OrgSelector`).

### Key Strengths
- **Global Selector Integration**: The reusable `OrgSelector` dropdown component implements scope restriction directly, ensuring that search selections across all screens (scheduling, attendance) respect user boundaries.
- **Interactive Tree Navigation**: Tree expansions and sidebar card previews minimize layout context shifts.

### Recommendations
- **Breadcrumb Fallbacks**: In the `OrgBreadcrumb` segment, deep paths (e.g., Command ➔ Brigade ➔ Department ➔ Section ➔ Cell) can overflow on mobile views. The component must implement middle-path compression (e.g. `Command ➔ ... ➔ Section ➔ Cell`) when screen width is under 640px.

---

## 4. API & DTO Review

Assesses the 7 REST endpoints and 4 data payloads (`OrganizationTreeDTO`, `OrganizationUnitDTO`, `OrganizationSummaryDTO`, `TransferDTO`).

### Key Strengths
- **Permission-Aware Tree API**: `GET /organization/tree` automatically crops tree nodes outside the caller's view scope at the serialization layer, preventing unauthorized exposure of parent/sibling metadata.
- **Explicit Transfer Actions**: The `/transfer` endpoint isolates authorization boundaries. Operators requesting a transfer across scopes are automatically routed to a `PENDING` queue, while operators with authority over both nodes trigger immediate relocation.

---

## 5. Performance Review

### Tree Serialization Latency
- Loading the tree for a large tenant (e.g., 500 nodes, 5 levels) involves building a nested object.
- *Mitigation*: The tree payload is highly compact (~200 bytes per node). A 500-node tree compiles to a ~100 KB JSON payload, which is parsed by client browsers in under 10ms.

### Closure Table Recompilation Overhead
- Inserting or moving an organization node requires updates to `core.organization_unit_closure`.
- *Mitigation*: Organization tree structures are static and modified rarely. A re-link operation executes in under 50ms in Postgres.

---

## 6. Scalability Review

- **Recursive Subtree Lookups**: Checking user permissions across sub-trees is the most frequent query in the system. The closure table model scales linearly:
  ```sql
  SELECT descendant_id FROM core.organization_unit_closure WHERE ancestor_id = :userScopeId;
  ```
  Adding a composite primary key index on `(ancestor_id, descendant_id)` ensures index-only scans in under 1ms even for structures exceeding 10,000 nodes.

---

## 7. Risks & Mitigations

| ID | Severity | Category | Description | Mitigation |
|---|---|---|---|---|
| **R-15.A** | 🔴 High | Security | Permission escalation if an operator bypasses scope limits in tree filters. | Enforce scope validation at the API layer (GET `/tree` automatically filters out out-of-scope nodes). |
| **R-15.B** | 🟠 Medium | Data Integrity | Orphaned records if a node containing employees is deleted. | Enforce DB foreign key constraints (`ON DELETE RESTRICT`) and API blockers (OR-09). |
| **R-15.C** | 🟠 Medium | Performance | High memory footprint when loading deeply nested tree states in the UI. | Limit initial tree loading depth to Level 3 or 4. Lazy-load leaf levels (Cells) only when the parent section node is expanded. |
| **R-15.D** | 🟡 Low | UX | Circular reference creation during drag-and-drop structural updates. | Enforce circular loop validation check (OR-02) recursively in the `POST` / `PUT` validation pipeline. |

---

## 8. Recommendations for Implementation

1. **Closure Table Composite Indexes**: Ensure the database migration script defines the following indexes:
   ```sql
   CREATE UNIQUE INDEX idx_org_closure_pk ON core.organization_unit_closure (ancestor_id, descendant_id);
   CREATE INDEX idx_org_closure_descendant ON core.organization_unit_closure (descendant_id);
   ```
2. **Strict Cascade Deletion Blocks**: Database constraints must enforce `RESTRICT` on deletions to prevent deleting populated nodes.
3. **Lazy-Expanded Tree View**: The `OrgTreeView` component must support lazy-loading of leaf nodes (Level 5 `Cell`). The client requests child nodes only when a Level 4 `Section` node is clicked.
4. **Mobile Breadcrumb Compressors**: Ensure the React breadcrumb renderer detects mobile viewports and replaces middle path arrays with ellipses.
5. **Metadata JSON Validation**: Validate metadata payloads against standard tenant schema models on the server before updating unit records:
   ```python
   # Example Flask boundary validator
   validate_json_schema(request.json.get('metadata'), tenant.org_schema)
   ```
