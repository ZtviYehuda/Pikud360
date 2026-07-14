"""
Reports module CSV processor.
Generates CSV files using python's csv library.
"""
import csv
import io
import codecs
from datetime import datetime, date
from typing import Dict, Any

from app.modules.reports.models import ReportRequest
from app.modules.reports.processors.base import ReportProcessor

class CSVReportProcessor(ReportProcessor):
    """Processes CSV text report generation."""

    def validate(self, report: ReportRequest) -> None:
        # Check standard properties if required
        pass

    def generate(self, report: ReportRequest) -> bytes:
        headers, rows = self._fetch_data(report)
        
        # Determine configurable delimiter
        params = report.parameters_json or {}
        delimiter = params.get("delimiter", ",")
        # Coerce to string just in case
        delimiter = str(delimiter)
        if len(delimiter) != 1:
            delimiter = ","
            
        output = io.StringIO()
        writer = csv.writer(output, delimiter=delimiter)
        
        # Write headers
        writer.writerow(headers)
        
        # Write rows
        for row in rows:
            formatted_row = []
            for val in row:
                if val is None:
                    formatted_row.append("")
                elif isinstance(val, (datetime, date)):
                    formatted_row.append(val.isoformat())
                else:
                    formatted_row.append(str(val))
            writer.writerow(formatted_row)
            
        csv_text = output.getvalue()
        output.close()
        
        # Return UTF-8 encoded bytes with BOM prefix for Excel compatibility
        return codecs.BOM_UTF8 + csv_text.encode("utf-8")
