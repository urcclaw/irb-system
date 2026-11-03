from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.units import cm
from io import BytesIO
from datetime import datetime
import os

# โหลดฟอนต์ภาษาไทย
APP_DIR = os.path.dirname(os.path.dirname(__file__))
FONT_PATH = os.path.join(APP_DIR, 'THSarabunNew.ttf')
GARUDA_PATH = os.path.join(APP_DIR, 'garuda.png')

try:
    pdfmetrics.registerFont(TTFont('THSarabun', FONT_PATH))
    FONT_NAME = 'THSarabun'
    FONT_BOLD = 'THSarabun'
except Exception as e:
    print(f"Warning: Cannot load font: {e}")
    FONT_NAME = 'Helvetica'
    FONT_BOLD = 'Helvetica-Bold'


def generate_certificate_pdf(project, irb_officer_name="นางสาวมานิตา พิทักษ์"):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    left_margin = 2.5 * cm
    right_margin = 2.5 * cm
    top_margin = 2 * cm

    # ดึงข้อมูลผู้วิจัยจาก project.owner
    researcher = project.owner
    researcher_name = f"{researcher.first_name} {researcher.last_name}" if researcher else "ไม่ระบุ"
    researcher_department = researcher.department if researcher and researcher.department else "ไม่ระบุ"
    researcher_hospital = researcher.hospital if researcher and researcher.hospital else "โรงพยาบาลมะเร็งลพบุรี"

    # ==================== หน้า 1 ====================
    y = height - top_margin

    # หัวกระดาษ - ข้อมูลโรงพยาบาล (ซ้าย)
    c.setFont(FONT_NAME, 11)
    c.drawString(left_margin, y, "โรงพยาบาลมะเร็งลพบุรี")
    y -= 14
    c.drawString(left_margin, y, "กรมการแพทย์ กระทรวงสาธารณสุข")
    y -= 14
    c.drawString(left_margin, y, "ที่อยู่เลขที่ 11/1 ถนนพหลโยธิน ต.ท่าสุเทพ")
    y -= 14
    c.drawString(left_margin, y, "อ.เมือง จ.ลพบุรี รหัสไปรษณีย์ 15000")
    y -= 14
    c.drawString(left_margin, y, "โทร.036-422515 ต่อ 329")

    # เลขที่เอกสาร (ขวาบน)
    rec_number = project.rec_number or "N/A"
    c.setFont(FONT_NAME, 11)
    c.drawRightString(width - right_margin, height - top_margin, f"REC {rec_number}")

    # ตราครุฑ (กลาง)
    if os.path.exists(GARUDA_PATH):
        logo_x = width / 2 - 20
        logo_y = height - top_margin - 50
        c.drawImage(GARUDA_PATH, logo_x, logo_y, width=40, height=40, mask='auto')

    y = height - top_margin - 90

    # ชื่อเรื่อง
    c.setFont(FONT_BOLD, 16)
    c.drawCentredString(width / 2, y, "เอกสารรับรองการยกเว้นพิจารณาจริยธรรมการวิจัย")
    y -= 30

    # เนื้อหา
    c.setFont(FONT_NAME, 12)
    content_lines = [
        "ตามแนวทางหลักจริยธรรมการวิจัยในคนที่เป็นมาตรฐานสากล ได้แก่ Declaration of Helsinki, The",
        "Belmont Report, CIOMS Guideline International Conference on Harmonization in Good Clinical",
        "Practice หรือ ICH-GCP) คณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์ โรงพยาบาลมะเร็ง",
        "ลพบุรี ได้พิจารณาและรับรองว่า",
    ]

    for line in content_lines:
        c.drawString(left_margin, y, line)
        y -= 18

    y -= 10

    # ชื่อโครงการ
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "ชื่อโครงการ:")
    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin + 80, y, project.title)
    y -= 20

    # ชื่อโรงพยาบาล
    c.drawString(left_margin, y, researcher_hospital)
    y -= 25

    # เลขที่โครงการวิจัย
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "เลขที่โครงการวิจัย:")
    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin + 100, y, f"REC {rec_number}")
    y -= 20

    # ผู้วิจัยหลัก (ดึงจาก Database)
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "ผู้วิจัยหลัก:")
    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin + 70, y, researcher_name)
    y -= 20

    # สังกัด (ดึงจาก Database)
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "สังกัด:")
    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin + 50, y, researcher_hospital)
    y -= 20

    # หน่วยงาน (ดึงจาก Database)
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "หน่วยงาน:")
    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin + 60, y, researcher_department)
    y -= 30

    # เอกสารที่รับรอง
    c.setFont(FONT_BOLD, 12)
    c.drawString(left_margin, y, "เอกสารที่รับรอง")
    y -= 20
    c.setFont(FONT_NAME, 12)
    documents = [
        "1. โครงการวิจัยฉบับสมบูรณ์",
        "2. แบบบันทึกข้อมูล",
        "3. ประวัติผู้วิจัย"
    ]
    for doc in documents:
        c.drawString(left_margin + 20, y, doc)
        y -= 18

    y -= 10

    # เนื้อหาการรับรอง
    c.setFont(FONT_NAME, 12)
    approval_text = [
        "เข้าข่ายการยกเว้นพิจารณาจริยธรรมการวิจัย ตามประกาศของคณะกรรมการวิจัยและพิจารณา",
        "จริยธรรมการวิจัยในมนุษย์ โรงพยาบาลมะเร็งลพบุรี ข้อต่อไปนี้",
    ]
    for line in approval_text:
        c.drawString(left_margin, y, line)
        y -= 18

    y -= 10
    c.drawString(left_margin + 20, y, "1) งานวิจัยที่เกี่ยวข้องกับข้อมูลสุขภาพที่ไม่ได้เพื่อประโยชน์ด้านวัตถุประสงต์ด้านการ")
    y -= 18
    c.drawString(left_margin + 40, y, "บริการทางการแพทย์ หรืองานวิจัยบริการสาธารณสุขทางแพทย์")
    y -= 25

    c.drawString(left_margin, y, "การตัดสินใจของคณะกรรมการยกเว้นการพิจารณาจริยธรรมการวิจัย เมื่อวันที่ 14 สิงหาคม 2569 ให้การ")
    y -= 18
    c.drawString(left_margin, y, "รับรองการยกเว้นพิจารณาจริยธรรมการวิจัยในมนุษย์นี้และได้รับการรับรองการวิจัยและพิจารณาจริยธรรม")
    y -= 18

    # วันที่
    approval_date = project.final_decision_date
    if approval_date:
        thai_date = approval_date.strftime("%d/%m/%Y")
    else:
        thai_date = datetime.now().strftime("%d/%m/%Y")

    c.drawString(left_margin, y, f"การวิจัยฯ ครั้งที่ 4/2569 วันที่ 21 สิงหาคม 2569 วาระที่ 4 เพื่อรับทราบแล้ว ทั้งนี้ หากผู้วิจัยมีความประสงค์จะ")
    y -= 18
    c.drawString(left_margin, y, "ปรับปรุงแก้ไขโครงการวิจัยที่เกี่ยวข้องกับระเบียบวิธีวิจัยและกลุ่มประชากรเป้าหมายจะต้องยื่นเสนอโครงการวิจัย")
    y -= 18
    c.drawString(left_margin, y, "ใหม่ เพื่อขอรับการพิจารณาจากคณะกรรมการจริยธรรมการวิจัยในมนุษย์ก่อน และหากดำเนินโครงการวิจัยนี้แล้ว")

    # ==================== หน้า 2 ====================
    c.showPage()
    y = height - top_margin

    c.setFont(FONT_NAME, 12)
    c.drawString(left_margin, y, "ขอให้ทีมแจ้งปิดโครงการวิจัยพร้อมรายงานฉบับสมบูรณ์ หรือสำนักงานทบทวนตีพิมพ์ทางวิชาการต่อคณะกรรมการ")
    y -= 18
    c.drawString(left_margin, y, "ทันที คณะกรรมการจริยธรรมการวิจัยเกี่ยวกับมนุษย์ จะเก็บเอกสารโครงการวิจัยของท่านเป็นเวลา 3 ปี นับจาก")
    y -= 18
    c.drawString(left_margin, y, "วันที่คณะกรรมการรับทราบ และจะดำเนินการทำลายเอกสารต่อไป")
    y -= 60

    # ลายเซ็น
    c.drawCentredString(width / 2, y, "ลงชื่อ")
    y -= 30
    c.drawCentredString(width / 2, y, ".......................................................")
    y -= 25
    c.setFont(FONT_BOLD, 12)
    c.drawCentredString(width / 2, y, f"({irb_officer_name})")
    y -= 20
    c.setFont(FONT_NAME, 12)
    c.drawCentredString(width / 2, y, "ประธานคณะกรรมการวิจัยและพิจารณาจริยธรรมการวิจัยในมนุษย์")
    y -= 18
    c.drawCentredString(width / 2, y, "โรงพยาบาลมะเร็งลพบุรี")

    c.save()
    buffer.seek(0)
    return buffer