# Event and Notification Module — Production Readiness Review

**Domain:** Events, Auditing & Notifications  
**Phase:** 16.8 — Event & Notification Production Review  
**Status:** Design Validated (Pending Implementation)

---

## 1. Executive Summary

This readiness review evaluates the complete design specification prepared for the **Event & Notification Domain** in Phase 16. 

The domain design has been assessed across the following areas: Event Catalog (Phase 16.1), Notification Channels (Phase 16.2), Notification Routing Rules (Phase 16.3), Template System (Phase 16.4), Event Bus Architecture (Phase 16.5), Audit Logging Event Map (Phase 16.6), and User Notification Preferences (Phase 16.7).

### Verdict: ✅ READY FOR DEVELOPMENT
The asynchronous, outbox-driven Event Bus and multi-channel notification engine specifications provide a highly resilient and secure integration foundation. Development can proceed immediately upon resolving the recommendations in Section 8.

---

## 2. Architecture Review

The architecture uses the **Transactional Outbox Pattern** to decouple API requests from downstream integrations (SMS, WhatsApp, Email, Webhooks), ensuring transaction boundary consistency.

### Key Strengths
- **Decoupled Emitters**: Service modules (e.g. Workforce, Scheduling) write event payloads to `core.outbox_messages` in the same transaction as state commits, preventing partial success states.
- **Dynamic Subscription Registry**: Minimizes inter-domain dependencies. The notification engine is a passive consumer, listening for events without requiring direct service references.

### Recommendations
- **Outbox Pruning Daemon**: Un-pruned outbox tables can grow rapidly. Implement a secondary clean-up worker that permanently deletes rows marked `PROCESSED` that are older than 24 hours to prevent slow index-scans on the outbox table.

---

## 3. Scalability Review

### Call-Up Throttling
- During an emergency, releasing a weekly schedule or launching a manual emergency call-up triggers notifications for hundreds of employees simultaneously.
- E-mail and messaging APIs (such as WhatsApp/Meta or Twilio) enforce rate limits (e.g. 50 messages/second).
- *Mitigation*: The Event Bus consumer queue must implement token-bucket throttling. High-priority SMS/Push call-ups bypass limits, while medium-priority WhatsApp schedules are throttled to fit provider rate limits.

### Log Volume Scalability
- High check-in and scheduling frequency compiled over a year generates millions of events.
- *Mitigation*: The Audit log table (`core.audit_logs`) must be partition-indexed in Postgres by event timestamp month ranges (e.g., monthly partitions) to keep audit search times under 100ms.

---

## 4. Performance Review

### Outbox Sweeper Polling Latency
- The outbox sweeper daemon scans the pending table every 500ms.
- To prevent locking bottlenecks in multi-instance environments, the sweeper query must use explicit limits and locking bypasses:
  ```sql
  SELECT * FROM core.outbox_messages 
  WHERE status = 'PENDING' 
  ORDER BY created_at ASC 
  LIMIT 100 
  FOR UPDATE SKIP LOCKED;
  ```
  This keeps DB transaction times under 5ms, avoiding locks on active API threads.

### Serializer Overhead
- Rebuilding HTML templates or wrapping webhook structures with cryptographic signatures adds latency.
- *Mitigation*: Execute all template rendering, localization, and HMAC-SHA256 signature calculations asynchronously inside background worker thread pools, completely outside the web server's request context.

---

## 5. Reliability & DLQ Management

- **At-Least-Once Delivery**: The system guarantees event delivery, but network drops can trigger duplicate deliveries.
- **Idempotency Locks**: The proposed verification schema (`core.processed_events` constraint checks) is verified to resolve duplicates at database-level.
- **DLQ Reprocessing Limits**: Messages routed to the Dead Letter Queue due to persistent downstream errors must carry an expiration TTL (e.g. 14 days) to prevent the database from filling with dead payloads.

---

## 6. Security & Privacy Review

- **PII Leakage Prevention**: The audit logging mapping (Phase 16.6) enforces strict controls:
  - Excludes raw phone numbers, emails, national IDs, and exact medical descriptions from `core.audit_logs`.
  - Cryptographically hashes or deletes un-needed PII properties.
- **Credential Leak Prevention**: A regex scanner intercepts failed login usernames and masks passwords accidentally typed into login inputs as `[CLASSIFIED_PASS_STRING]` before logging.
- **Signature Headers on Webhooks**: Webhook payloads are signed using HMAC-SHA256 with tenant secret tokens, preventing spoofing attempts on receiver endpoints.

---

## 7. Risks & Mitigations

| ID | Severity | Category | Description | Mitigation |
|---|---|---|---|---|
| **R-16.A** | 🔴 High | Security | Leak of sensitive call-up alerts to wrong telephone numbers. | Enforce phone validation (E.164 formats) and WhatsApp opt-in verification message codes before activation. |
| **R-16.B** | 🔴 High | Reliability | Outbox daemon crash locks system event routing, causing silent workflow freezes. | Set up critical health-check heartbeats for the outbox sweeper daemon. Fire system administrator email/SMS alerts if the daemon goes silent for over 5 minutes. |
| **R-16.C** | 🟠 Medium | Performance | Downstream API outages queue thousands of messages, exhausting worker resources. | Implement circuit-breaker rules. If the WhatsApp API returns 503 repeatedly, temporarily disable the channel, route queue events to the DLQ immediately, and flag administrators. |
| **R-16.D** | 🟡 Low | UX | User alert fatigue if deduplication rules fail to aggregate multiple shifts updates. | Enforce Section-level 15-minute coalescing rules in the routing processor. |

---

## 8. Recommendations for Implementation

1. **Outbox Indices**: Add indexing migrations during database setup:
   ```sql
   CREATE INDEX idx_outbox_pending ON core.outbox_messages (status, created_at) WHERE status = 'PENDING';
   ```
2. **Circuit Breaker Integration**: The notification router client must wrap Meta and Twilio API clients with a circuit breaker pattern (e.g. opening the breaker after 10 consecutive connection failures).
3. **Outbox Deletion Policy**: Set up a daily cron cleanup job to hard-delete processed outbox logs older than 24 hours:
   ```sql
   DELETE FROM core.outbox_messages WHERE status = 'PROCESSED' AND processed_at < NOW() - INTERVAL '1 day';
   ```
4. **Idempotency Unique Key**: The processed events mapping table must hold a unique composite key on `(event_id, consumer_name)`.
5. **Mobile Push masking fallback**: Push notification payload handlers must verify user preferences and replace push text with generic descriptors if previews are set to `false`.
