"""
Analytics module business logic services.
Implements SummaryCalculator, TrendCalculator, SnapshotGenerator, AlertEvaluator,
and the orchestrating AnalyticsService.
"""
import logging
import operator
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

from app.modules.analytics.repositories import AnalyticsRepository, SnapshotRepository, AlertRepository
from app.modules.analytics.models import AlertRule, DashboardSnapshot, TrendPeriod
from app.core.authorization import resolve_access_scope, AccessDeniedError

logger = logging.getLogger("pikud360.modules.analytics.services")

# Python Operator mapping for AlertEvaluator
OPERATORS = {
    ">": operator.gt,
    ">=": operator.ge,
    "<": operator.lt,
    "<=": operator.le,
    "=": operator.eq,
    "!=": operator.ne
}


class SummaryCalculator:
    """Aggregates active workforce schedules and calculates summary statistics recursively."""

    def __init__(self, analytics_repo: AnalyticsRepository):
        self._repo = analytics_repo

    def calculate_summary(self, tenant_id: str, unit_id: str, start_date: date, end_date: date) -> Dict[str, Any]:
        """Aggregate personnel schedules recursively and compute percentages and distributions."""
        descendant_ids = self._repo.load_organization_subtree(unit_id)
        total_personnel = self._repo.load_employee_counts(descendant_ids)
        num_days = (end_date - start_date).days + 1
        total_slots = total_personnel * num_days

        # Fetch configured statuses to ensure dynamic non-hardcoded list
        statuses = self._repo.load_schedule_statuses(tenant_id)
        status_category_map = {s["id"]: s["category"].upper() for s in statuses}
        status_code_map = {s["id"]: s["code"].upper() for s in statuses}

        # Fetch aggregated status counts directly from SQL
        db_status_counts = self._repo.load_status_counts(descendant_ids, start_date, end_date)

        assigned_slots = 0
        available_slots = 0
        sick_slots = 0
        vacation_slots = 0
        training_slots = 0
        mission_slots = 0
        reinforcement_slots = 0
        other_slots = 0

        status_counts = {s["code"].upper(): 0 for s in statuses}

        for status in statuses:
            status_id = status["id"]
            code = status["code"].upper()
            category = status_category_map.get(status_id)
            count = db_status_counts.get(status_id, 0)

            if count > 0:
                assigned_slots += count
                status_counts[code] = count

                if category == "AVAILABLE":
                    available_slots += count
                elif category == "SICK":
                    sick_slots += count
                elif category == "VACATION":
                    vacation_slots += count
                elif category == "TRAINING":
                    training_slots += count
                elif category == "MISSION":
                    mission_slots += count
                elif category == "REINFORCEMENT":
                    reinforcement_slots += count
                else:
                    other_slots += count

        unavailable_slots = assigned_slots - available_slots
        unassigned_slots = max(0, total_slots - assigned_slots)

        # Computations of averages
        assigned_avg = round(assigned_slots / num_days, 2) if num_days > 0 else 0.0
        unassigned_avg = round(unassigned_slots / num_days, 2) if num_days > 0 else 0.0
        available_avg = round(available_slots / num_days, 2) if num_days > 0 else 0.0
        unavailable_avg = round(unavailable_slots / num_days, 2) if num_days > 0 else 0.0

        # Percentages
        assigned_pct = round((assigned_slots / total_slots * 100), 2) if total_slots > 0 else 0.0
        availability_pct = round((available_slots / total_slots * 100), 2) if total_slots > 0 else 0.0
        absence_pct = round(((sick_slots + vacation_slots) / total_slots * 100), 2) if total_slots > 0 else 0.0
        unassigned_pct = round((unassigned_slots / total_slots * 100), 2) if total_slots > 0 else 0.0

        # Detailed status distribution list
        status_distribution = []
        for s in statuses:
            code = s["code"].upper()
            count = status_counts.get(code, 0)
            status_distribution.append({
                "status": code,
                "count": count,
                "percentage": round((count / total_slots * 100), 2) if total_slots > 0 else 0.0
            })

        # Fetch active shifts counts from shift assignments
        active_shifts = self._repo.load_active_shifts_count(descendant_ids, start_date, end_date)

        # Compile summaries for immediate child units (recursive summary metrics per child)
        child_units = self._repo.load_child_units(unit_id)
        child_summaries = []
        for child in child_units:
            child_summary = self.calculate_summary(tenant_id, child["id"], start_date, end_date)
            child_summaries.append({
                "unit_id": child["id"],
                "unit_name": child["name"],
                "total_personnel": child_summary["total_personnel"],
                "assigned": child_summary["assigned"],
                "unassigned": child_summary["unassigned"],
                "status_distribution": child_summary["status_distribution"]
            })

        return {
            "total_personnel": total_personnel,
            "assigned": assigned_avg,
            "unassigned": unassigned_avg,
            "available": available_avg,
            "unavailable": unavailable_avg,
            "assigned_percentage": assigned_pct,
            "availability_percentage": availability_pct,
            "absence_percentage": absence_pct,
            "unassigned_percentage": unassigned_pct,
            "active_shift_count": active_shifts,
            "organization_units": child_summaries,
            "child_units": child_summaries,
            "status_distribution": status_distribution,
            "alerts_count": 0  # Coordinated at service level
        }


class TrendCalculator:
    """Compiles chronological series of daily, weekly, or monthly historical statistics."""

    def __init__(self, analytics_repo: AnalyticsRepository, summary_calc: SummaryCalculator):
        self._repo = analytics_repo
        self._summary_calc = summary_calc

    def calculate_trends(
        self, tenant_id: str, unit_id: str, start_date: date, end_date: date, period: TrendPeriod
    ) -> List[Dict[str, Any]]:
        """Calculate trend data points divided by the specified period (daily, weekly, monthly)."""
        data_points = []
        current_date = start_date

        while current_date <= end_date:
            # Determine sub-range end date based on period
            if period == TrendPeriod.DAILY:
                step_end = current_date
                next_date = current_date + timedelta(days=1)
            elif period == TrendPeriod.WEEKLY:
                step_end = min(current_date + timedelta(days=6), end_date)
                next_date = current_date + timedelta(days=7)
            elif period == TrendPeriod.MONTHLY:
                # Find last day of current month or end_date
                next_month = current_date.month % 12 + 1
                next_year = current_date.year + (current_date.month // 12)
                step_end = min(date(next_year, next_month, 1) - timedelta(days=1), end_date)
                next_date = date(next_year, next_month, 1)
            else:
                step_end = current_date
                next_date = current_date + timedelta(days=1)

            # Calculate metrics for this sub-range
            summary = self._summary_calc.calculate_summary(tenant_id, unit_id, current_date, step_end)
            
            # Extract basic distribution mapping
            dist_map = {item["status"]: item["count"] for item in summary["status_distribution"]}

            data_points.append({
                "date": current_date,
                "total_personnel": summary["total_personnel"],
                "assigned": int(summary["assigned"]),
                "unassigned": int(summary["unassigned"]),
                "available": int(summary["available"]),
                "unavailable": int(summary["unavailable"]),
                "readiness_percentage": summary["availability_percentage"],
                "status_distribution": dist_map
            })

            current_date = next_date

        return data_points


class SnapshotGenerator:
    """Calculates, aggregates, and saves single point-in-time snapshots for organization units."""

    def __init__(self, analytics_repo: AnalyticsRepository, snapshot_repo: SnapshotRepository):
        self._repo = analytics_repo
        self._snapshot_repo = snapshot_repo

    def generate_snapshot(self, tenant_id: str, unit_id: str, snapshot_date: date, snapshot_hour: int) -> Dict[str, Any]:
        """Aggregate current statuses for a unit and write/upsert the snapshot."""
        start_time = datetime.now()
        descendant_ids = self._repo.load_organization_subtree(unit_id)
        total_personnel = self._repo.load_employee_counts(descendant_ids)

        statuses = self._repo.load_schedule_statuses(tenant_id)
        status_category_map = {s["id"]: s["category"].upper() for s in statuses}
        status_code_map = {s["id"]: s["code"].upper() for s in statuses}

        # Fetch aggregated status counts directly from SQL for the single snapshot date
        db_status_counts = self._repo.load_status_counts(descendant_ids, snapshot_date, snapshot_date)

        assigned_employees = 0
        available_count = 0
        sick_count = 0
        vacation_count = 0
        training_count = 0
        mission_count = 0
        reinforcement_count = 0
        other_count = 0

        status_counts = {s["code"].upper(): 0 for s in statuses}

        for status in statuses:
            status_id = status["id"]
            code = status["code"].upper()
            category = status_category_map.get(status_id)
            count = db_status_counts.get(status_id, 0)

            if count > 0:
                assigned_employees += count
                status_counts[code] = count

                if category == "AVAILABLE":
                    available_count += count
                elif category == "SICK":
                    sick_count += count
                elif category == "VACATION":
                    vacation_count += count
                elif category == "TRAINING":
                    training_count += count
                elif category == "MISSION":
                    mission_count += count
                elif category == "REINFORCEMENT":
                    reinforcement_count += count
                else:
                    other_count += count

        unassigned_employees = max(0, total_personnel - assigned_employees)
        readiness_percentage = round((available_count / total_personnel * 100), 2) if total_personnel > 0 else 100.00

        snapshot_payload = {
            "tenant_id": tenant_id,
            "org_unit_id": unit_id,
            "snapshot_date": snapshot_date,
            "snapshot_hour": snapshot_hour,
            "total_employees": total_personnel,
            "assigned_employees": assigned_employees,
            "unassigned_employees": unassigned_employees,
            "available_count": available_count,
            "sick_count": sick_count,
            "vacation_count": vacation_count,
            "training_count": training_count,
            "mission_count": mission_count,
            "reinforcement_count": reinforcement_count,
            "other_count": other_count,
            "readiness_percentage": readiness_percentage,
            "status_distribution": status_counts
        }

        # Perform database upsert
        self._snapshot_repo.upsert_snapshot(snapshot_payload)

        duration_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        return {
            "success": True,
            "generated_at": datetime.now(),
            "duration_ms": duration_ms,
            "records_processed": total_personnel,
            "unit_id": unit_id,
            "snapshot_date": snapshot_date
        }


class AlertEvaluator:
    """Evaluates metrics against alert rules over specific timeframes."""

    def __init__(self, analytics_repo: AnalyticsRepository, alert_repo: AlertRepository, summary_calc: SummaryCalculator):
        self._repo = analytics_repo
        self._alert_repo = alert_repo
        self._summary_calc = summary_calc

    def evaluate_alerts(self, tenant_id: str, unit_id: str, reference_date: date) -> List[Dict[str, Any]]:
        """Evaluate seeded alert rules against recursive unit statistics."""
        rules = self._alert_repo.load_alert_rules(tenant_id, unit_id)
        results = []

        for rule in rules:
            # Determine date range based on evaluation_period
            if rule.evaluation_period == "TODAY":
                start_date = reference_date
            elif rule.evaluation_period == "LAST_7_DAYS":
                start_date = reference_date - timedelta(days=6)
            elif rule.evaluation_period == "LAST_30_DAYS":
                start_date = reference_date - timedelta(days=29)
            else:
                start_date = reference_date

            # Calculate summary stats for the rule period
            summary = self._summary_calc.calculate_summary(tenant_id, unit_id, start_date, reference_date)
            
            # Map metric name to summary stats
            metric_val = 0.0
            if rule.metric_name == "SICK_PERCENTAGE":
                # Find sick percentage from summary distribution or compute it
                total_slots = summary["total_personnel"] * ((reference_date - start_date).days + 1)
                sick_item = next((item for item in summary["status_distribution"] if item["status"] == "SICK"), None)
                sick_count = sick_item["count"] if sick_item else 0
                metric_val = round((sick_count / total_slots * 100), 2) if total_slots > 0 else 0.0
            elif rule.metric_name == "AVAILABILITY_PERCENTAGE":
                metric_val = summary["availability_percentage"]
            elif rule.metric_name == "UNASSIGNED_PERCENTAGE":
                metric_val = summary["unassigned_percentage"]
            else:
                # Custom status code percentage checks
                total_slots = summary["total_personnel"] * ((reference_date - start_date).days + 1)
                status_item = next((item for item in summary["status_distribution"] if item["status"] == rule.metric_name), None)
                status_count = status_item["count"] if status_item else 0
                metric_val = round((status_count / total_slots * 100), 2) if total_slots > 0 else 0.0

            # Evaluate constraint using mapped operator
            compare_func = OPERATORS.get(rule.operator)
            is_triggered = False
            if compare_func:
                is_triggered = compare_func(metric_val, rule.threshold_value)

            results.append({
                "rule_name": rule.name,
                "metric": rule.metric_name,
                "current_value": metric_val,
                "threshold": rule.threshold_value,
                "operator": rule.operator,
                "severity": rule.severity,
                "organization_unit": unit_id,
                "is_triggered": is_triggered
            })

        return results


class AnalyticsService:
    """Orchestrates summary, trend, alerts, and snapshot calculations."""

    def __init__(self):
        self._analytics_repo = AnalyticsRepository()
        self._snapshot_repo = SnapshotRepository()
        self._alert_repo = AlertRepository()

        self.summary_calculator = SummaryCalculator(self._analytics_repo)
        self.trend_calculator = TrendCalculator(self._analytics_repo, self.summary_calculator)
        self.snapshot_generator = SnapshotGenerator(self._analytics_repo, self._snapshot_repo)
        self.alert_evaluator = AlertEvaluator(self._analytics_repo, self._alert_repo, self.summary_calculator)

    def get_summary(self, tenant_id: str, unit_id: str, start_date: date, end_date: date, operator_id: str) -> Dict[str, Any]:
        """Fetch unified summary statistics ensuring security constraints."""
        # Validate tenant and organization scope access
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "analytics.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks analytics.view permission.")
        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks scope access to this organization unit.")

        summary = self.summary_calculator.calculate_summary(tenant_id, unit_id, start_date, end_date)
        
        # Overlay alert trigger counts
        alerts = self.alert_evaluator.evaluate_alerts(tenant_id, unit_id, end_date)
        summary["alerts_count"] = sum(1 for a in alerts if a["is_triggered"])

        return summary

    def get_trends(
        self, tenant_id: str, unit_id: str, start_date: date, end_date: date, period: TrendPeriod, operator_id: str
    ) -> List[Dict[str, Any]]:
        """Fetch trends for specified unit and time interval under RBAC check."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "analytics.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks analytics.view permission.")
        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks scope access to this organization unit.")

        return self.trend_calculator.calculate_trends(tenant_id, unit_id, start_date, end_date, period)

    def get_distribution(self, tenant_id: str, unit_id: str, start_date: date, end_date: date, operator_id: str) -> List[Dict[str, Any]]:
        """Fetch detailed status category distributions."""
        summary = self.get_summary(tenant_id, unit_id, start_date, end_date, operator_id)
        return summary["status_distribution"]

    def get_alerts(self, tenant_id: str, unit_id: str, reference_date: date, operator_id: str) -> List[Dict[str, Any]]:
        """Evaluate active rules and retrieve details for triggered items."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "analytics.view" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks analytics.view permission.")
        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks scope access to this organization unit.")

        return self.alert_evaluator.evaluate_alerts(tenant_id, unit_id, reference_date)

    def trigger_snapshot_generation(
        self, tenant_id: str, unit_id: str, snapshot_date: date, snapshot_hour: int, operator_id: str
    ) -> Dict[str, Any]:
        """Trigger point-in-time snapshot creation."""
        ctx = resolve_access_scope(operator_id, tenant_id)
        if "analytics.manage" not in ctx.permissions:
            raise AccessDeniedError("Access Denied: Lacks analytics.manage permission.")
        if ctx.scope_type != "GLOBAL" and unit_id not in ctx.organization_units:
            raise AccessDeniedError("Access Denied: Lacks scope access to this organization unit.")

        return self.snapshot_generator.generate_snapshot(tenant_id, unit_id, snapshot_date, snapshot_hour)
