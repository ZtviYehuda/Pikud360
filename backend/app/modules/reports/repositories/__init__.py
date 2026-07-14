"""
Reports repositories package exports.
"""
from app.modules.reports.repositories.template_repository import TemplateRepository
from app.modules.reports.repositories.report_repository import ReportRepository

__all__ = ["TemplateRepository", "ReportRepository"]
