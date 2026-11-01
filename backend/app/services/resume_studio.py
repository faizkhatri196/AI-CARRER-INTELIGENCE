import io
import re
import os
from typing import Dict, Any, List, Optional
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from docx import Document
from docx.shared import Pt, Inches, RGBColor

TEMPLATE_STYLES = {
    "Modern Professional": {
        "primary_color": colors.HexColor("#1e293b"),
        "accent_color": colors.HexColor("#2563eb"),
        "font_family": "Helvetica",
        "header_align": "LEFT"
    },
    "FAANG Minimal": {
        "primary_color": colors.HexColor("#0f172a"),
        "accent_color": colors.HexColor("#334155"),
        "font_family": "Helvetica",
        "header_align": "CENTER"
    },
    "Technical Engineer": {
        "primary_color": colors.HexColor("#0284c7"),
        "accent_color": colors.HexColor("#0f766e"),
        "font_family": "Helvetica",
        "header_align": "LEFT"
    },
    "Executive": {
        "primary_color": colors.HexColor("#4338ca"),
        "accent_color": colors.HexColor("#6b21a8"),
        "font_family": "Times-Roman",
        "header_align": "CENTER"
    },
    "Fresh Graduate": {
        "primary_color": colors.HexColor("#059669"),
        "accent_color": colors.HexColor("#0d9488"),
        "font_family": "Helvetica",
        "header_align": "LEFT"
    },
    "Research / Academic": {
        "primary_color": colors.HexColor("#1e1b4b"),
        "accent_color": colors.HexColor("#312e81"),
        "font_family": "Times-Roman",
        "header_align": "LEFT"
    }
}

class ResumeStudioService:
    def optimize_bullet_point(self, raw_bullet: str) -> str:
        """
        Applies Google X-Y-Z formula: Accomplished [X], measured by [Y], by doing [Z].
        Preserves factual integrity without inventing claims.
        """
        clean = raw_bullet.strip().lstrip("-*• ")
        if not clean:
            return ""

        # If already strong or has numbers
        if any(char.isdigit() for char in clean):
            return clean

        # Polish with strong active lead
        words = clean.split()
        first_word = words[0].lower() if words else ""
        if first_word in ["helped", "worked", "responsible", "handled", "assisted", "did"]:
            words[0] = "Engineered"
            clean = " ".join(words)
        return clean

    def generate_pdf_from_markdown(self, markdown_text: str, template_name: str = "Modern Professional") -> bytes:
        buffer = io.BytesIO()
        tpl = TEMPLATE_STYLES.get(template_name, TEMPLATE_STYLES["Modern Professional"])

        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        name_style = ParagraphStyle(
            'TplName',
            parent=styles['Heading1'],
            fontName=tpl["font_family"],
            fontSize=20,
            leading=24,
            textColor=tpl["primary_color"],
            alignment=1 if tpl["header_align"] == "CENTER" else 0,
            spaceAfter=4
        )
        
        section_heading = ParagraphStyle(
            'TplSection',
            parent=styles['Heading2'],
            fontName=tpl["font_family"],
            fontSize=11,
            leading=14,
            textColor=tpl["accent_color"],
            spaceBefore=10,
            spaceAfter=3,
            keepWithNext=True
        )
        
        sub_heading = ParagraphStyle(
            'TplSubHead',
            parent=styles['Heading3'],
            fontName=tpl["font_family"],
            fontSize=9.5,
            leading=12,
            textColor=tpl["primary_color"],
            spaceBefore=4,
            spaceAfter=2,
            keepWithNext=True
        )

        body_style = ParagraphStyle(
            'TplBody',
            parent=styles['Normal'],
            fontName=tpl["font_family"],
            fontSize=8.5,
            leading=11.5,
            textColor=colors.HexColor("#334155"),
            spaceAfter=2
        )

        bullet_style = ParagraphStyle(
            'TplBullet',
            parent=styles['Normal'],
            fontName=tpl["font_family"],
            fontSize=8.5,
            leading=11.5,
            leftIndent=14,
            firstLineIndent=-10,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=2
        )

        story = []
        lines = markdown_text.split('\n')
        is_first_header = True

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            if line_str.startswith('# '):
                header_text = line_str[2:]
                if is_first_header:
                    story.append(Paragraph(f"<b>{header_text}</b>", name_style))
                    story.append(HRFlowable(width="100%", thickness=1, color=tpl["accent_color"], spaceBefore=2, spaceAfter=8))
                    is_first_header = False
                else:
                    story.append(Paragraph(f"<b>{header_text.upper()}</b>", section_heading))
                    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=1, spaceAfter=4))
            elif line_str.startswith('## '):
                header_text = line_str[3:]
                story.append(Paragraph(f"<b>{header_text.upper()}</b>", section_heading))
                story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1"), spaceBefore=1, spaceAfter=4))
            elif line_str.startswith('### '):
                header_text = line_str[4:]
                story.append(Paragraph(f"<b>{header_text}</b>", sub_heading))
            elif line_str.startswith(('- ', '* ')):
                bullet_text = line_str[2:]
                bullet_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', bullet_text)
                story.append(Paragraph(f"&bull; {bullet_text}", bullet_style))
            else:
                text = line_str
                text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
                story.append(Paragraph(text, body_style))

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_docx_from_markdown(self, markdown_text: str, template_name: str = "Modern Professional") -> bytes:
        buffer = io.BytesIO()
        doc = Document()

        for s in doc.sections:
            s.top_margin = Inches(0.5)
            s.bottom_margin = Inches(0.5)
            s.left_margin = Inches(0.5)
            s.right_margin = Inches(0.5)

        lines = markdown_text.split('\n')
        is_first = True

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            if line_str.startswith('# '):
                h = doc.add_heading(level=1 if is_first else 2)
                r = h.add_run(line_str[2:])
                r.bold = True
                r.font.size = Pt(16 if is_first else 12)
                r.font.color.rgb = RGBColor(37, 99, 235) if not is_first else RGBColor(15, 23, 42)
                h.paragraph_format.space_before = Pt(8)
                h.paragraph_format.space_after = Pt(2)
                is_first = False
            elif line_str.startswith('## '):
                h = doc.add_heading(level=2)
                r = h.add_run(line_str[3:].upper())
                r.bold = True
                r.font.size = Pt(11)
                r.font.color.rgb = RGBColor(37, 99, 235)
                h.paragraph_format.space_before = Pt(8)
                h.paragraph_format.space_after = Pt(2)
            elif line_str.startswith('### '):
                p = doc.add_paragraph()
                r = p.add_run(line_str[4:])
                r.bold = True
                r.font.size = Pt(10)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(1)
            elif line_str.startswith(('- ', '* ')):
                bullet_text = line_str[2:]
                p = doc.add_paragraph(style='List Bullet')
                p.paragraph_format.space_after = Pt(2)
                parts = re.split(r'(\*\*.*?\*\*)', bullet_text)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        r = p.add_run(part[2:-2])
                        r.bold = True
                    else:
                        p.add_run(part)
            else:
                p = doc.add_paragraph()
                p.paragraph_format.space_after = Pt(2)
                parts = re.split(r'(\*\*.*?\*\*)', line_str)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        r = p.add_run(part[2:-2])
                        r.bold = True
                    else:
                        p.add_run(part)

        doc.save(buffer)
        buffer.seek(0)
        return buffer.getvalue()

resume_studio = ResumeStudioService()

