# Reporting Module — Production Readiness Review

**Domain:** Reporting & Analytics  
**Phase:** 17.6 — Reporting Production Review  
**Status:** Design Validated (Pending Implementation)

---

## 1. Executive Summary

This readiness review evaluates the complete design specification prepared for the **Reporting Domain** in Phase 17. 

The domain design has been assessed across the following areas: Reporting Domain Architecture (Phase 17.1), Report Catalog (Phase 17.2), Reusable Filters (Phase 17.3), Export Formats (Phase 17.4), and Scheduled Reports (Phase 17.5).

### Verdict: ✅ READY FOR DEVELOPMENT
The asynchronous compilation lifecycle, scope-locked closure tree queries, and strict file pruning policies provide a highly performant and secure foundation. Development can proceed immediately upon resolving the recommendations in Section 8.

---

## 2. Architecture Review

The Reporting domain implements an asynchronous compilation pipeline, separating long-running analytical queries from transactional API routes.

### Key Strengths
- **Decoupled Lifecycle**: Storing pre-compiled reports in object storage with short-lived, signed URLs prevents memory exhaustion on the web servers and shields primary databases from query traffic.
- **Reusable Filter Models**: Defining uniform filter contracts (Date Range, Brigade, Department, Section, Cell) simplifies endpoint development and ensures UI form reusability.

### Recommendations
- **Pruning Verification Loop**: The cron pruning daemon must verify that files are deleted from the storage bucket (e.g. S3) *before* marking database request rows as `EXPIRED`, preventing orphaned storage assets.

---

## 3. UX Review

### RTL PDF Alignments
- Generating PDFs in Hebrew (RTL) frequently introduces character reversal bugs (e.g. text showing as `יול יוסי` instead of `יוסי לוי`) and alignment issues.
- *Mitigation*: The PDF rendering engine must use native RTL CSS layout configurations (such as standard flexbox layouts with `direction: rtl`) and bundle web-safe fonts that support full Hebrew character sets.
- *Visual Design*: Scheduled PDF tables should feature alternating row backgrounds (zebra striping) and bold total summaries for readability.

### Dependent Dropdowns
- In the filter layout, selection of `departmentId` must automatically trigger a refresh of child `sectionId` inputs to prevent invalid parent-child query parameter combinations.

---

## 4. Performance Review

### Memory Footprint during Massive Exports
- Compiling a monthly attendance spreadsheet for an entire Brigade (Level 2) involves querying and formatting tens of thousands of rows, which can easily trigger Node memory leaks or gateway timeouts.
- *Mitigation*:
  - **Streaming Outputs**: The compilation service must use database cursor streams (e.g., PostgreSQL cursors) to write rows directly to the storage bucket in small chunks (e.g. 500 rows/chunk).
  - **Memory Limits**: The background report compiler must execute inside a queue worker container limited to 512MB RAM.

### Query Indexing
- High-volume tables (`attendance.attendance_records` and `workforce_schedule.shift_assignments`) are queried repeatedly during report compilation.
- *Mitigation*: Add composite indexes to speed up scope filtering (see Section 8).

---

## 5. Scalability Review

### Closure Table Aggregation
- Calculating subtree metrics (e.g., checking late check-in counts for an entire Brigade by summing all child Departments, Sections, and Cells) relies on joining the `core.organization_unit_closure` table.
- As the organization tree grows, deep subtrees can slow down joins.
- *Mitigation*: Restrict maximum hierarchy depth to 5 levels (Organization ➔ Brigade ➔ Department ➔ Section ➔ Cell) as defined in the Organization Hierarchy spec.

---

## 6. Security & Privacy Review

### Cross-Scope Leaks
- A Section Head (Level 4) could modify the `scopeNodeId` query parameter to download reports for a sibling Section.
- *Mitigation*: The backend reporting service must validate that the target query `scopeNodeId` lies within the caller's authorized scope closure path (retrieved from JWT credentials).

### PII Data Protection
- Exported files (especially Excel and CSV files containing contact details) are frequently left in unencrypted local download folders by users.
- *Mitigation*:
  - **Masking at Serialization**: The export serializer must mask birth years and ages in the Birthday Report, and omit personal phone numbers/emails from Workforce summaries.
  - **Signed Link Expiration**: Downloads must require dynamic, signed URLs that expire within 15 minutes.

---

## 7. Risks & Mitigations

| ID | Severity | Category | Description | Mitigation |
|---|---|---|---|---|
| **R-17.A** | 🔴 High | Security | Unauthorized download of full workforce PII files by unauthorized operators. | Enforce scope validation and restrict Excel/CSV export rights to Section Heads and above. |
| **R-17.B** | 🔴 High | Performance | Massive query timeouts during concurrent exports of large datasets. | Enforce query rate limits (max 2 concurrent compilation jobs per tenant) and limit date ranges to 366 days. |
| **R-17.C** | 🟠 Medium | UX | Hebrew text rendering garbled or reversed in exported PDF tables. | Enforce native RTL direction properties in HTML-to-PDF compilers. |
| **R-17.D** | 🟡 Low | Storage | Storage bucket exhaustion due to failure in the 7-day pruning daemon. | Enforce bucket-level lifecycle policies in AWS S3 (e.g. auto-delete objects prefix `reports/` older than 7 days). |

---

## 8. Recommendations for Implementation

1. **Database Indexing Migrations**:
   Add composite indexes to support reporting queries:
   ```sql
   -- Index for attendance compliance reports
   CREATE INDEX idx_reporting_attendance ON attendance.attendance_records (unit_id, date, status);
   
   -- Index for shift coverage queries
   CREATE INDEX idx_reporting_shifts ON workforce_schedule.shift_assignments (unit_id, date);
   ```
2. **S3 Bucket Lifecycle Policy**:
   Configure the object storage bucket to auto-expire files, providing a fallback safety net if the application-level pruning daemon fails:
   ```json
   {
     "Rules": [
       {
         "ID": "AutoDeleteExpiredReports",
         "Status": "Enabled",
         "Filter": { "Prefix": "reports/" },
         "Expiration": { "Days": 7 }
       }
     ]
   }
   ```
3. **BOM Enforcer for CSV Output**:
   The CSV serializer must write the UTF-8 BOM bytes (`0xEF, 0xBB, 0xBF`) at the very beginning of the output file stream:
   ```typescript
   const BOM = "\uFEFF";
   const csvContent = BOM + csvRows.join("\n");
   ```
4. **Export Limit Validation**:
   Enforce a maximum Date Range constraint validation check inside the reporting endpoint:
   ```typescript
   if (daysBetween(startDate, endDate) > 366) {
     throw new BadRequestException("טווח תאריכים מירבי לדוח מפורט הוא שנה אחת (366 ימים)");
   }
   ```
