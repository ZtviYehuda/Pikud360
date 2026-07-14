"""
Reports module processor factory.
Maps formats to corresponding ReportProcessor subclasses.
"""
from typing import Any

from app.modules.reports.models import ReportFormat
from app.modules.reports.processors import (
    PDFReportProcessor,
    ExcelReportProcessor,
    CSVReportProcessor
)

class ReportFactory:
    """Factory to instantiate report processors based on requested format."""

    @staticmethod
    def get_processor(fmt: Any):
        """Returns the appropriate ReportProcessor for the given format."""
        if isinstance(fmt, str):
            try:
                fmt_enum = ReportFormat(fmt.upper())
            except ValueError:
                raise ValueError(f"Unsupported format '{fmt}'.")
        else:
            fmt_enum = fmt

        if fmt_enum == ReportFormat.PDF:
            return PDFReportProcessor()
        elif fmt_enum == ReportFormat.EXCEL:
            return ExcelReportProcessor()
        elif fmt_enum == ReportFormat.CSV:
            return CSVReportProcessor()
        else:
            raise ValueError(f"No processor registered for format '{fmt_enum}'.")
