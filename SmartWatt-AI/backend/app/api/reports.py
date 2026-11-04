"""
SmartWatt AI - Reports and Data Export API
Generates daily, weekly, and monthly audited energy breakdowns.
Produces downloadable CSV and ReportLab-rendered PDF reports.
"""

from datetime import datetime, timezone, timedelta
import io
import csv
from fastapi import APIRouter, Depends, Query, Response, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.database.connection import get_db
from app.models.energy_reading import EnergyReading
from app.models.appliance import Appliance
from app.models.home import Home
from app.core.config import settings

router = APIRouter(prefix="/api/reports", tags=["Reports"])


def _get_report_data(days: int, db: Session):
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(days=days)
    home = db.query(Home).first()
    tariff = home.electricity_tariff if home else settings.DEFAULT_TARIFF
    emission_factor = settings.GRID_EMISSION_FACTOR

    appliances = db.query(Appliance).all()
    rows = []
    total_kwh = 0.0

    for app in appliances:
        kwh = (
            db.query(func.sum(EnergyReading.energy_kwh))
            .filter(EnergyReading.appliance_id == app.id)
            .filter(EnergyReading.timestamp >= start_time)
            .scalar()
        ) or 0.0
        kwh = float(kwh)
        cost = round(kwh * tariff, 2)
        co2_kg = round(kwh * emission_factor, 2)
        total_kwh += kwh

        rows.append({
            "appliance_id": app.id,
            "appliance_name": app.appliance_name,
            "rated_power": app.rated_power,
            "energy_kwh": round(kwh, 2),
            "cost": cost,
            "co2_kg": co2_kg,
        })

    total_cost = round(total_kwh * tariff, 2)
    total_co2 = round(total_kwh * emission_factor, 2)

    return {
        "period_days": days,
        "start_date": start_time.strftime("%Y-%m-%d"),
        "end_date": now.strftime("%Y-%m-%d"),
        "tariff_per_kwh": tariff,
        "emission_factor": emission_factor,
        "total_kwh": round(total_kwh, 2),
        "total_cost": total_cost,
        "total_co2_kg": total_co2,
        "appliances": sorted(rows, key=lambda x: x["energy_kwh"], reverse=True),
        "simulated": True,
    }


@router.get("/daily")
def get_daily_report(db: Session = Depends(get_db)):
    return _get_report_data(1, db)


@router.get("/weekly")
def get_weekly_report(db: Session = Depends(get_db)):
    return _get_report_data(7, db)


@router.get("/monthly")
def get_monthly_report(db: Session = Depends(get_db)):
    return _get_report_data(30, db)


@router.get("/export/csv")
def export_csv(days: int = Query(30, ge=1, le=180), db: Session = Depends(get_db)):
    data = _get_report_data(days, db)
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(["SmartWatt AI - Energy Audit & Consumption Report (Simulated Data)"])
    writer.writerow([f"Period: {data['start_date']} to {data['end_date']} ({days} Days)"])
    writer.writerow([f"Tariff: INR {data['tariff_per_kwh']} / kWh", f"Grid Emission Factor: {data['emission_factor']} kg CO2/kWh"])
    writer.writerow([])
    writer.writerow(["Appliance Name", "Rated Power (W)", "Energy (kWh)", f"Cost (INR)", "Est. CO2 (kg)"])

    for app in data["appliances"]:
        writer.writerow([
            app["appliance_name"],
            app["rated_power"],
            app["energy_kwh"],
            app["cost"],
            app["co2_kg"],
        ])

    writer.writerow([])
    writer.writerow(["TOTALS", "-", data["total_kwh"], data["total_cost"], data["total_co2_kg"]])

    output.seek(0)
    filename = f"smartwatt_energy_report_{days}d_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/export/pdf")
def export_pdf(days: int = Query(30, ge=1, le=180), db: Session = Depends(get_db)):
    data = _get_report_data(days, db)
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=6,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=14,
    )

    story = []
    story.append(Paragraph("SmartWatt AI - Household Energy & Carbon Audit", title_style))
    story.append(Paragraph(
        f"Period: <b>{data['start_date']}</b> to <b>{data['end_date']}</b> &bull; Tariff: <b>INR {data['tariff_per_kwh']}/kWh</b> &bull; <i>Simulated Smart Meter Data</i>",
        subtitle_style,
    ))

    # Metric summary table
    summary_data = [
        ["Total Energy Consumed", "Estimated Electricity Cost", "Estimated Carbon Footprint"],
        [f"{data['total_kwh']} kWh", f"INR {data['total_cost']}", f"{data['total_co2_kg']} kg CO2e"],
    ]
    summary_table = Table(summary_data, colWidths=[180, 180, 180])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#334155")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, 1), 14),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1")),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 16))

    # Appliance details table
    table_data = [["Appliance", "Rated (W)", "Usage (kWh)", "Cost (INR)", "Carbon (kg CO2)"]]
    for app in data["appliances"]:
        table_data.append([
            app["appliance_name"],
            f"{app['rated_power']:.0f} W",
            f"{app['energy_kwh']:.2f}",
            f"{app['cost']:.2f}",
            f"{app['co2_kg']:.2f}",
        ])
    table_data.append([
        "TOTAL",
        "-",
        f"{data['total_kwh']:.2f}",
        f"{data['total_cost']:.2f}",
        f"{data['total_co2_kg']:.2f}",
    ])

    app_table = Table(table_data, colWidths=[160, 90, 100, 100, 90])
    app_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 1), (-1, -2), [colors.white, colors.HexColor("#f8fafc")]),
        ("LINEBELOW", (0, -1), (-1, -1), 1.5, colors.HexColor("#0f172a")),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story.append(app_table)
    story.append(Spacer(1, 20))

    disclaimer = Paragraph(
        "<b>Important Notice:</b> All data displayed above is generated dynamically by the SmartWatt AI Python Virtual Smart Meter simulation environment. Calculations are estimated based on configured local tariff rates and regional grid emission constants.",
        ParagraphStyle("Notice", parent=styles["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#94a3b8")),
    )
    story.append(disclaimer)

    doc.build(story)
    buffer.seek(0)
    filename = f"smartwatt_audit_{days}d_{datetime.now().strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

