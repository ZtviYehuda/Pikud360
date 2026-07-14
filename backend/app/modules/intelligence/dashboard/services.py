import logging
from typing import List, Dict, Optional
from datetime import datetime, date, timedelta
from app.database.connection import get_db_connection
from app.core.authorization import resolve_access_scope, AccessDeniedError
from app.modules.workforce_schedule.repositories import WorkforceScheduleRepository
from app.modules.intelligence.alerts.services import AlertsService

logger = logging.getLogger("pikud360.modules.intelligence.dashboard.services")

class DashboardService:
    def __init__(self):
        self._schedule_repo = WorkforceScheduleRepository()
        self._alerts_service = AlertsService()

    def get_dashboard_summary(
        self,
        unit_id: str,
        date_str: str,
        range_str: str,
        tenant_id: str,
        operator_id: str
    ) -> Dict:
        # 1. Access validation
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "dashboard.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks dashboard.view permission.")

        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks view access to this organization unit.")

        # 2. Date parsing and ranges calculations
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        if range_str == "week":
            start_date = target_date - timedelta(days=6)
            end_date = target_date
        elif range_str == "month":
            start_date = target_date - timedelta(days=29)
            end_date = target_date
        else: # day
            start_date = target_date
            end_date = target_date

        num_days = (end_date - start_date).days + 1

        # 3. Settings & Thresholds loading
        settings = self._schedule_repo.get_settings(unit_id)
        unassigned_threshold = float(settings.unassigned_threshold) if settings else 10.0
        sick_threshold = float(settings.sick_threshold) if settings else 5.0
        shortage_threshold = float(settings.shortage_threshold) if settings else 70.0

        # 4. Resolve descendant unit IDs
        descendant_ids = self._get_descendant_unit_ids(unit_id)

        # 5. Aggregate KPIs over date range
        total_personnel = self._get_total_personnel(descendant_ids)
        total_slots = total_personnel * num_days

        schedules = self._get_schedules_in_range(descendant_ids, start_date, end_date)
        statuses_list = self._schedule_repo.list_statuses(tenant_id)
        status_category_map = {s.id: s.category.upper() for s in statuses_list}
        status_code_map = {s.id: s.code.upper() for s in statuses_list}

        assigned_slots = len(schedules)
        available_slots = 0
        sick_slots = 0
        training_slots = 0
        mission_slots = 0
        unavailable_slots = 0

        status_distribution = {}
        for s in statuses_list:
            status_distribution[s.code.upper()] = 0.0

        for s in schedules:
            category = status_category_map.get(s.status_id)
            code = status_code_map.get(s.status_id)
            if code:
                status_distribution[code] = status_distribution.get(code, 0.0) + 1.0

            if category == "AVAILABLE":
                available_slots += 1
            elif category == "SICK":
                sick_slots += 1
            elif category == "TRAINING":
                training_slots += 1
            elif category == "MISSION":
                mission_slots += 1
            elif category in ["UNAVAILABLE", "VACATION"]:
                unavailable_slots += 1

        # Calculate daily averages
        assigned_avg = round(assigned_slots / num_days, 1)
        unassigned_avg = round(max(0.0, total_personnel - assigned_avg), 1)

        for code in status_distribution:
            status_distribution[code] = round(status_distribution[code] / num_days, 1)

        # Compute percentages
        availability_pct = round((available_slots / total_slots * 100), 1) if total_slots > 0 else 0.0
        sick_pct = round((sick_slots / total_slots * 100), 1) if total_slots > 0 else 0.0
        training_pct = round((training_slots / total_slots * 100), 1) if total_slots > 0 else 0.0
        mission_pct = round((mission_slots / total_slots * 100), 1) if total_slots > 0 else 0.0
        shortage_index = round(100.0 - availability_pct, 1)

        # 6. Evaluation of Alert Thresholds (based on today's single-day numbers)
        self._evaluate_and_update_alerts(
            tenant_id=tenant_id,
            unit_id=unit_id,
            descendant_ids=descendant_ids,
            target_date=target_date,
            total_personnel=total_personnel,
            status_category_map=status_category_map,
            unassigned_threshold=unassigned_threshold,
            sick_threshold=sick_threshold,
            shortage_threshold=shortage_threshold
        )

        active_alerts = self._alerts_service.get_active_alerts(unit_id, tenant_id)

        # 7. Immediate child units summary list recursion
        child_units_breakdown = self._compile_child_units_summary(unit_id, target_date, start_date, end_date, num_days, status_category_map, status_code_map)

        # 8. Pending transfers/history counts (try-except database fallback)
        transfers_count = self._get_pending_transfers_count(unit_id)

        return {
            "total_personnel": total_personnel,
            "assigned": assigned_avg,
            "unassigned": unassigned_avg,
            "availability_percentage": availability_pct,
            "sick_percentage": sick_pct,
            "training_percentage": training_pct,
            "mission_percentage": mission_pct,
            "shortage_index": shortage_index,
            "status_distribution": status_distribution,
            "child_units": child_units_breakdown,
            "alerts": active_alerts,
            "transfers_count": transfers_count
        }

    # --- Helpers ---

    def _get_descendant_unit_ids(self, unit_id: str) -> List[str]:
        query = "SELECT descendant_id FROM core.organization_unit_closure WHERE ancestor_id = %s;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id,))
                    return [row[0] for row in cur.fetchall()]
        except Exception:
            return [unit_id]

    def _get_total_personnel(self, descendant_ids: List[str]) -> int:
        query = "SELECT COUNT(*) FROM workforce.employees WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL;"
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids,))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception:
            return 0

    def _get_schedules_in_range(self, descendant_ids: List[str], start_date: date, end_date: date) -> List:
        query = """
            SELECT id, tenant_id, employee_id, organization_unit_id, schedule_date, status_id, shift_type_id, start_time, end_time, notes
            FROM workforce.employee_daily_schedule
            WHERE organization_unit_id = ANY(%s) AND schedule_date BETWEEN %s AND %s;
        """
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (descendant_ids, start_date, end_date))
                    for row in cur.fetchall():
                        results.append(self._schedule_repo._row_to_schedule(row))
        except Exception as e:
            logger.error(f"Error fetching schedules in range: {e}")
        return results

    def _evaluate_and_update_alerts(
        self,
        tenant_id: str,
        unit_id: str,
        descendant_ids: List[str],
        target_date: date,
        total_personnel: int,
        status_category_map: Dict,
        unassigned_threshold: float,
        sick_threshold: float,
        shortage_threshold: float
    ) -> None:
        if total_personnel == 0:
            return

        # Fetch today's schedules
        today_schedules = self._get_schedules_in_range(descendant_ids, target_date, target_date)
        today_assigned = len(today_schedules)
        today_unassigned = max(0, total_personnel - today_assigned)
        today_unassigned_pct = (today_unassigned / total_personnel) * 100

        today_sick = sum(1 for s in today_schedules if status_category_map.get(s.status_id) == "SICK")
        today_sick_pct = (today_sick / total_personnel) * 100

        today_avail = sum(1 for s in today_schedules if status_category_map.get(s.status_id) == "AVAILABLE")
        today_avail_pct = (today_avail / total_personnel) * 100

        # Rule 1: Unassigned threshold check
        if today_unassigned_pct > unassigned_threshold:
            msg = f"Unassigned personnel rate is at {today_unassigned_pct:.1f}%, exceeding the configuration limit of {unassigned_threshold:.1f}%."
            self._alerts_service.create_or_keep_alert(tenant_id, unit_id, "UNASSIGNED_THRESHOLD_EXCEEDED", "WARNING", msg)
        else:
            self._alerts_service.resolve_alert(tenant_id, unit_id, "UNASSIGNED_THRESHOLD_EXCEEDED")

        # Rule 2: Sick rate threshold check
        if today_sick_pct > sick_threshold:
            msg = f"Sick rate is at {today_sick_pct:.1f}% ({today_sick} personnel), exceeding threshold limit of {sick_threshold:.1f}%."
            self._alerts_service.create_or_keep_alert(tenant_id, unit_id, "SICK_THRESHOLD_EXCEEDED", "CRITICAL", msg)
        else:
            self._alerts_service.resolve_alert(tenant_id, unit_id, "SICK_THRESHOLD_EXCEEDED")

        # Rule 3: Availability Shortage target check
        if today_avail_pct < shortage_threshold:
            msg = f"Workforce availability drop to {today_avail_pct:.1f}%, representing a manpower shortage below target {shortage_threshold:.1f}%."
            self._alerts_service.create_or_keep_alert(tenant_id, unit_id, "MANPOWER_SHORTAGE", "CRITICAL", msg)
        else:
            self._alerts_service.resolve_alert(tenant_id, unit_id, "MANPOWER_SHORTAGE")

        # Rule 4: Sudden decrease compared to yesterday
        yesterday_date = target_date - timedelta(days=1)
        yesterday_schedules = self._get_schedules_in_range(descendant_ids, yesterday_date, yesterday_date)
        yesterday_avail = sum(1 for s in yesterday_schedules if status_category_map.get(s.status_id) == "AVAILABLE")
        yesterday_avail_pct = (yesterday_avail / total_personnel) * 100

        if (yesterday_avail_pct - today_avail_pct) >= 5.0:
            drop = yesterday_avail_pct - today_avail_pct
            msg = f"Sudden availability drop detected: available count decreased by {drop:.1f}% compared to yesterday."
            self._alerts_service.create_or_keep_alert(tenant_id, unit_id, "SUDDEN_AVAILABILITY_DROP", "WARNING", msg)
        else:
            self._alerts_service.resolve_alert(tenant_id, unit_id, "SUDDEN_AVAILABILITY_DROP")

    def _compile_child_units_summary(
        self,
        unit_id: str,
        target_date: date,
        start_date: date,
        end_date: date,
        num_days: int,
        status_category_map: Dict,
        status_code_map: Dict
    ) -> List[Dict]:
        child_query = "SELECT id, name FROM core.organization_units WHERE parent_id = %s AND deleted_at IS NULL;"
        results = []
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(child_query, (unit_id,))
                    children = cur.fetchall()

            for child in children:
                child_id = child[0]
                child_name = child[1]

                # Recurse descendants of child unit
                child_descendant_ids = self._get_descendant_unit_ids(child_id)
                child_personnel = self._get_total_personnel(child_descendant_ids)
                child_slots = child_personnel * num_days

                child_schedules = self._get_schedules_in_range(child_descendant_ids, start_date, end_date)
                child_assigned_slots = len(child_schedules)

                child_assigned_avg = round(child_assigned_slots / num_days, 1)
                child_unassigned_avg = round(max(0.0, child_personnel - child_assigned_avg), 1)

                child_distribution = {}
                for s in child_schedules:
                    code = status_code_map.get(s.status_id)
                    if code:
                        child_distribution[code] = child_distribution.get(code, 0.0) + 1.0
                
                for code in child_distribution:
                    child_distribution[code] = round(child_distribution[code] / num_days, 1)

                results.append({
                    "unit_id": child_id,
                    "unit_name": child_name,
                    "total_personnel": child_personnel,
                    "assigned": child_assigned_avg,
                    "unassigned": child_unassigned_avg,
                    "status_distribution": child_distribution
                })
        except Exception as e:
            logger.error(f"Error compiling child units summary: {e}")
        return results

    def _get_pending_transfers_count(self, unit_id: str) -> int:
        query = """
            SELECT COUNT(*) FROM workforce.transfer_requests
            WHERE (source_org_unit_id = %s OR target_org_unit_id = %s) AND status = 'PENDING';
        """
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, (unit_id, unit_id))
                    row = cur.fetchone()
                    return row[0] if row else 0
        except Exception:
            return 0
