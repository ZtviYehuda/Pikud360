"""
Reports module PDF processor.
Generates styled PDF files using ReportLab.
"""
import io
from datetime import datetime
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from app.modules.reports.models import ReportRequest
from app.modules.reports.processors.base import ReportProcessor

class NumberedCanvas(canvas.Canvas):
    """Custom canvas that performs two-pass rendering to compute total page count in the footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 9)
        self.setFillColor(colors.HexColor("#555555"))
        
        # Header text
        self.drawString(54, 750, "Pikud360 System Report")
        self.drawRightString(558, 750, datetime.now().strftime("%Y-%m-%d %H:%M"))
        
        # Header rule
        self.setStrokeColor(colors.HexColor("#CCCCCC"))
        self.setLineWidth(0.5)
        self.line(54, 742, 558, 742)
        
        # Footer rule
        self.line(54, 50, 558, 50)
        self.drawString(54, 35, "CONFIDENTIAL — FOR INTERNAL USE ONLY")
        self.drawRightString(558, 35, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


class PDFReportProcessor(ReportProcessor):
    """Processes PDF report generation using ReportLab SimpleDocTemplate."""

    def validate(self, report: ReportRequest) -> None:
        # Check standard properties if required
        pass

    def generate(self, report: ReportRequest) -> bytes:
        headers, rows = self._fetch_data(report)
        
        buffer = io.BytesIO()
        # Top margin adjusted to leave room for NumberedCanvas header
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            leftMargin=54,
            rightMargin=54,
            topMargin=72,
            bottomMargin=72
        )
        
        styles = getSampleStyleSheet()
        
        # Define clean, professional corporate typography
        title_style = ParagraphStyle(
            "ReportTitle",
            parent=styles["Heading1"],
            fontSize=22,
            leading=26,
            textColor=colors.HexColor("#1A365D"),
            spaceAfter=8
        )
        
        meta_style = ParagraphStyle(
            "ReportMeta",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#4A5568"),
            spaceAfter=15
        )
        
        header_cell_style = ParagraphStyle(
            "TableHeaderCell",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=colors.white
        )
        
        cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#2D3748")
        )
        
        story = []
        
        # 1. Report Title
        report_display_name = report.report_type.value.replace("_", " ").title()
        story.append(Paragraph(f"{report_display_name} Report", title_style))
        
        # 2. Meta Info (Organization Unit, Tenant, Timestamp)
        meta_text = (
            f"<b>Organization Unit ID:</b> {report.org_unit_id or 'All Units'}<br/>"
            f"<b>Tenant ID:</b> {report.tenant_id}<br/>"
            f"<b>Generated At:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>"
            f"<b>Total Records:</b> {len(rows)}"
        )
        story.append(Paragraph(meta_text, meta_style))
        story.append(Spacer(1, 10))
        
        # 3. Tables Rendering
        if not rows:
            no_data_style = ParagraphStyle(
                "NoData",
                parent=styles["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=10,
                leading=14,
                textColor=colors.HexColor("#A0AEC0")
            )
            story.append(Paragraph("No records found for this unit scope.", no_data_style))
        else:
            # Build report table
            table_data = []
            
            # Append styled header row
            table_data.append([Paragraph(h, header_cell_style) for h in headers])
            
            # Append styled data rows
            for row in rows:
                formatted_row = []
                for val in row:
                    val_str = str(val) if val is not None else ""
                    if isinstance(val, (datetime, datetime.date)):
                        val_str = val.isoformat()
                    formatted_row.append(Paragraph(val_str, cell_style))
                table_data.append(formatted_row)
                
            # Equal layout width within print margins (504 pt available)
            col_widths = [504 / len(headers)] * len(headers)
            
            t = Table(table_data, colWidths=col_widths, repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1A365D")),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7FAFC")]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ]))
            story.append(t)
            
        doc.build(story, canvasmaker=NumberedCanvas)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
