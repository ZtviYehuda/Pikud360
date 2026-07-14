"""
Reports module base processor.
Defines template method and validation interface for format-specific processors.
"""
from abc import ABC, abstractmethod
import time
from typing import Dict, Any, Tuple, List

from app.modules.reports.models import ReportRequest, ReportType
from app.modules.reports.storage import ReportStorage
from app.modules.reports.utils import generate_filename
from app.database.connection import get_db_connection

class ReportProcessor(ABC):
    """Abstract base class for all report processors."""

    def __init__(self):
        self.storage = ReportStorage()

    @abstractmethod
    def validate(self, report: ReportRequest) -> None:
        """Validate report parameters and structure."""
        pass

    @abstractmethod
    def generate(self, report: ReportRequest) -> bytes:
        """Generate report binary bytes."""
        pass

    def save(self, report: ReportRequest, data: bytes) -> Dict[str, Any]:
        """Save report data to storage and return storage metadata."""
        ext = report.format.value.lower()
        filename = generate_filename(report.report_type.value, ext)
        return self.storage.save_report(report.tenant_id, filename, data)

    def process(self, report: ReportRequest) -> Dict[str, Any]:
        """Execute validation, generation, and storage, returning execution metadata."""
        start_time = time.time()
        
        self.validate(report)
        data = self.generate(report)
        result = self.save(report, data)
        
        duration_ms = int((time.time() - start_time) * 1000)
        result["duration_ms"] = duration_ms
        return result

    def _fetch_data(self, report: ReportRequest) -> Tuple[List[str], List[List[Any]]]:
        """Fetch report data from database based on report type and scope."""
        org_unit_id = report.org_unit_id
        tenant_id = report.tenant_id
        
        descendant_ids = []
        if org_unit_id:
            from app.modules.analytics.repositories import AnalyticsRepository
            repo = AnalyticsRepository()
            descendant_ids = repo.load_organization_subtree(org_unit_id)
            
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                # 1. MANPOWER SUMMARY
                if report.report_type == ReportType.MANPOWER_SUMMARY:
                    headers = ["Employee Number", "First Name", "Last Name", "Rank", "Position", "Service Type", "Status"]
                    if descendant_ids:
                        query = """
                            SELECT employee_number, first_name, last_name, rank, position, service_type, status
                            FROM workforce.employees
                            WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL
                            ORDER BY last_name, first_name;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT employee_number, first_name, last_name, rank, position, service_type, status
                            FROM workforce.employees
                            WHERE tenant_id = %s AND deleted_at IS NULL
                            ORDER BY last_name, first_name;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    
                # 2. ALERT LOG
                elif report.report_type == ReportType.ALERT_LOG:
                    headers = ["Alert Type", "Severity", "Message", "Status", "Created At", "Resolved At"]
                    if descendant_ids:
                        query = """
                            SELECT alert_type, severity, message, status, created_at, resolved_at
                            FROM core.alerts
                            WHERE organization_unit_id = ANY(%s)
                            ORDER BY created_at DESC;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT alert_type, severity, message, status, created_at, resolved_at
                            FROM core.alerts
                            WHERE tenant_id = %s
                            ORDER BY created_at DESC;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    
                # 3. SCHEDULE DETAILS
                elif report.report_type == ReportType.SCHEDULE_DETAILS:
                    headers = ["Employee Number", "First Name", "Last Name", "Schedule Date", "Status Name", "Start Time", "End Time", "Notes"]
                    if descendant_ids:
                        query = """
                            SELECT e.employee_number, e.first_name, e.last_name, s.schedule_date, ss.name, s.start_time, s.end_time, s.notes
                            FROM workforce.employee_daily_schedule s
                            JOIN workforce.employees e ON s.employee_id = e.id
                            JOIN workforce.schedule_statuses ss ON s.status_id = ss.id
                            WHERE s.organization_unit_id = ANY(%s)
                            ORDER BY s.schedule_date DESC, e.last_name;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT e.employee_number, e.first_name, e.last_name, s.schedule_date, ss.name, s.start_time, s.end_time, s.notes
                            FROM workforce.employee_daily_schedule s
                            JOIN workforce.employees e ON s.employee_id = e.id
                            JOIN workforce.schedule_statuses ss ON s.status_id = ss.id
                            WHERE s.tenant_id = %s
                            ORDER BY s.schedule_date DESC, e.last_name;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    
                # 4. ORGANIZATION SUMMARY
                elif report.report_type == ReportType.ORGANIZATION_SUMMARY:
                    headers = ["Unit Name", "Unit Code", "Description", "Is Active", "Parent Unit Name"]
                    if descendant_ids:
                        query = """
                            SELECT o.name, o.code, o.description, o.is_active, p.name
                            FROM core.organization_units o
                            LEFT JOIN core.organization_units p ON o.parent_id = p.id
                            WHERE o.id = ANY(%s) AND o.deleted_at IS NULL
                            ORDER BY o.name;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT o.name, o.code, o.description, o.is_active, p.name
                            FROM core.organization_units o
                            LEFT JOIN core.organization_units p ON o.parent_id = p.id
                            WHERE o.tenant_id = %s AND o.deleted_at IS NULL
                            ORDER BY o.name;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    
                # 5. ATTENDANCE STATISTICS
                elif report.report_type == ReportType.ATTENDANCE_STATISTICS:
                    headers = ["Schedule Date", "Status Name", "Count"]
                    if descendant_ids:
                        query = """
                            SELECT s.schedule_date, ss.name, COUNT(*)
                            FROM workforce.employee_daily_schedule s
                            JOIN workforce.schedule_statuses ss ON s.status_id = ss.id
                            WHERE s.organization_unit_id = ANY(%s)
                            GROUP BY s.schedule_date, ss.name
                            ORDER BY s.schedule_date DESC, ss.name;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT s.schedule_date, ss.name, COUNT(*)
                            FROM workforce.employee_daily_schedule s
                            JOIN workforce.schedule_statuses ss ON s.status_id = ss.id
                            WHERE s.tenant_id = %s
                            GROUP BY s.schedule_date, ss.name
                            ORDER BY s.schedule_date DESC, ss.name;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                    
                # 6. PERSONNEL DISTRIBUTION
                elif report.report_type == ReportType.PERSONNEL_DISTRIBUTION:
                    headers = ["Rank", "Service Type", "Count"]
                    if descendant_ids:
                        query = """
                            SELECT rank, service_type, COUNT(*)
                            FROM workforce.employees
                            WHERE org_unit_id = ANY(%s) AND deleted_at IS NULL
                            GROUP BY rank, service_type
                            ORDER BY rank, service_type;
                        """
                        cur.execute(query, (descendant_ids,))
                    else:
                        query = """
                            SELECT rank, service_type, COUNT(*)
                            FROM workforce.employees
                            WHERE tenant_id = %s AND deleted_at IS NULL
                            GROUP BY rank, service_type
                            ORDER BY rank, service_type;
                        """
                        cur.execute(query, (tenant_id,))
                    rows = cur.fetchall()
                else:
                    headers = ["Data"]
                    rows = []
                    
                return headers, rows
