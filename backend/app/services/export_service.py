import io
import csv
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

class RecruiterExportService:
    def export_candidates_csv(self, candidates: List[Dict[str, Any]], job_title: str) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Rank", "Name", "Email", "Experience (Years)",
            "Overall Fit Score", "ATS Score", "Required Skills Score",
            "Experience Score", "Projects Score", "Recommendation", "Shortlisted"
        ])
        
        for idx, cand in enumerate(candidates, 1):
            cat = cand.get("category_scores", {})
            writer.writerow([
                idx,
                cand.get("name", "Candidate"),
                cand.get("email", ""),
                cand.get("experience_years", 0),
                cand.get("overall_fit_score", 0),
                cand.get("ats_score", 0),
                cat.get("required_skills", 0),
                cat.get("experience", 0),
                cat.get("projects", 0),
                cand.get("recommendation", ""),
                "Yes" if cand.get("shortlisted") else "No"
            ])
            
        return output.getvalue()

    def export_candidates_pdf(self, candidates: List[Dict[str, Any]], job_title: str) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=landscape(letter),
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=10
        )
        sub_style = ParagraphStyle(
            'ReportSub',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=15
        )
        cell_style = ParagraphStyle(
            'ReportCell',
            parent=styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1e293b")
        )
        
        story = []
        story.append(Paragraph(f"<b>Candidate Screening Report: {job_title}</b>", title_style))
        story.append(Paragraph(f"Total Evaluated: {len(candidates)} candidates | Evaluated via Deterministic Multidimensional AI Engine", sub_style))

        # Table data
        table_data = [
            ["Rank", "Candidate Name", "Exp", "Fit Score", "ATS", "Key Skills", "Recommendation", "Status"]
        ]
        
        for idx, c in enumerate(candidates[:50], 1):
            skills_str = ", ".join(c.get("skills", [])[:3])
            status_str = "Shortlisted" if c.get("shortlisted") else "Review"
            table_data.append([
                str(idx),
                c.get("name", "Candidate")[:22],
                f"{c.get('experience_years', 0)}y",
                f"{c.get('overall_fit_score', 0)}/100",
                f"{c.get('ats_score', 0)}/100",
                skills_str[:25],
                c.get("recommendation", "")[:15],
                status_str
            ])
            
        t = Table(table_data, colWidths=[35, 140, 45, 65, 55, 180, 95, 75])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 8),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(t)
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

export_service = RecruiterExportService()
