from pathlib import Path
from copy import deepcopy
from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

SRC = Path(r'C:\Users\ADMIN\Downloads\Bao-cao-ca-nhan-Vira-phan-1-2-3.docx')
OUT = Path(r'C:\Users\ADMIN\OneDrive\Desktop\Vira-project\Bao-cao-ca-nhan-Vira-hoan-chinh.docx')
doc = Document(SRC)

# Apply the supplied report rules to every section and paragraph.
for sec in doc.sections:
    sec.page_width, sec.page_height = Cm(21), Cm(29.7)
    sec.top_margin, sec.bottom_margin = Cm(2.5), Cm(2)
    sec.left_margin, sec.right_margin = Cm(3.5), Cm(2)
    sec.header_distance = Cm(1.2)
for name in ['Normal','Title','Heading 1','Heading 2','Heading 3']:
    s=doc.styles[name]
    s.font.name='Times New Roman'; s.font.size=Pt(14); s.font.color.rgb=None
    s._element.rPr.rFonts.set(qn('w:ascii'),'Times New Roman')
    s._element.rPr.rFonts.set(qn('w:hAnsi'),'Times New Roman')
    s._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
doc.styles['Normal'].paragraph_format.line_spacing=1.5
doc.styles['Normal'].paragraph_format.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
doc.styles['Normal'].paragraph_format.first_line_indent=Cm(1)
doc.styles['Normal'].paragraph_format.space_before=Pt(0)
doc.styles['Normal'].paragraph_format.space_after=Pt(0)
for n in ['Heading 1','Heading 2','Heading 3']:
    doc.styles[n].font.bold=True
    doc.styles[n].paragraph_format.keep_with_next=True
    doc.styles[n].paragraph_format.first_line_indent=Cm(0)
    doc.styles[n].paragraph_format.space_before=Pt(6)
    doc.styles[n].paragraph_format.space_after=Pt(3)

# Remove the prior title block and old opening; the report receives a formal cover and opening.
for p in list(doc.paragraphs[:4]):
    p._element.getparent().remove(p._element)

# Keep the substantive sections 1-3 while avoiding a blank tail page from the source file.
body = doc._element.body
for el in list(body):
    # Tables in the prior draft were oversized and split the narrative across pages.
    # Their essential criteria are retained in the report text and the applied checklist.
    if el.tag == qn('w:tbl'):
        body.remove(el)
        continue
    if el.tag == qn('w:p'):
        p = next((p for p in doc.paragraphs if p._p is el), None)
        if p is not None and (p.text.strip() == '' or p.text.strip().startswith('Bảng ')
                              or p.text.strip().startswith('Các mã trong bảng')):
            body.remove(el)

# Move the old references out temporarily; they will be replaced by a complete list at the end.
ref_heading = next((p for p in doc.paragraphs if p.text.strip()=='TÀI LIỆU THAM KHẢO'), None)
if ref_heading is not None:
    body=doc._element.body
    children=list(body)
    idx=children.index(ref_heading._p)
    for el in children[idx:]:
        if el.tag != qn('w:sectPr'):
            body.remove(el)

def style_run(run, size=14, bold=None, italic=None):
    run.font.name='Times New Roman'; run.font.size=Pt(size)
    run._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'Times New Roman')
    if bold is not None: run.bold=bold
    if italic is not None: run.italic=italic

def insert_p(anchor, text='', style=None, align=None, first_indent=1, bold=False, before=0, after=0, line=1.5):
    p=doc.add_paragraph(style=style)
    if text:
        r=p.add_run(text); style_run(r,bold=bold)
    p.paragraph_format.first_line_indent=Cm(first_indent)
    p.paragraph_format.space_before=Pt(before); p.paragraph_format.space_after=Pt(after)
    p.paragraph_format.line_spacing=line
    if align is not None: p.alignment=align
    p._p.getparent().remove(p._p); anchor._p.addprevious(p._p)
    return p

def add_end_p(text='', style=None, align=None, first_indent=1, bold=False, line=1.5, keep=False):
    p=doc.add_paragraph(style=style)
    if text:
        r=p.add_run(text); style_run(r,bold=bold)
    p.paragraph_format.first_line_indent=Cm(first_indent)
    p.paragraph_format.line_spacing=line
    if keep: p.paragraph_format.keep_with_next=True
    if align is not None: p.alignment=align
    return p

def add_heading(text, level):
    return add_end_p(text, style=f'Heading {level}', first_indent=0, bold=True, line=1.5, keep=True)

def add_pagebreak():
    # Use explicit pageBreakBefore on the next front-matter heading; an empty
    # break paragraph can create a blank page when the preceding text overflows.
    return None

def insert_after_text(match, texts):
    target=next((p for p in doc.paragraphs if match in p.text),None)
    if target is None: raise ValueError('Missing insertion point: '+match)
    last=target._p
    for text in texts:
        p=doc.add_paragraph()
        r=p.add_run(text); style_run(r)
        p.paragraph_format.first_line_indent=Cm(1); p.paragraph_format.line_spacing=1.5
        p.alignment=WD_ALIGN_PARAGRAPH.JUSTIFY
        last.addnext(p._p); last=p._p

# Restore the operational details that were previously presented in wide tables.
insert_after_text('Mã tài liệu sử dụng cấu trúc', [
    'Danh mục hồ sơ được đề xuất gồm: VIRA-SQA-PLN-01 (kế hoạch SQA cá nhân, xác định mục tiêu, phạm vi, tiêu chí và cách lưu); VIRA-SQA-STD-01 (quy ước rà soát mã nguồn, tập hợp coding standards và căn cứ chất lượng); VIRA-SQA-PROC-01 (quy trình rà soát, nêu vai trò, đầu vào, bước làm và điều kiện kết thúc); VIRA-SQA-CHK-01 (checklist, ghi tiêu chí, cách đánh giá, trạng thái, minh chứng và hướng xử lý); VIRA-SQA-LOG-01 (phiếu theo dõi phát hiện); và VIRA-SQA-RPT-01 (báo cáo kết quả). Đây là mã đề xuất cho nhiệm vụ cá nhân, cần điều chỉnh nếu giảng viên hoặc dự án có quy ước chính thức khác.'
])
insert_after_text('Do đây là tiểu luận cá nhân', [
    'Trong hồ sơ, người thực hiện SQA/reviewer chịu trách nhiệm xác định phạm vi, chuẩn bị căn cứ, đánh giá theo checklist và lập kết luận. Tác giả hoặc người phụ trách mã nguồn giải thích thiết kế, tiếp nhận và xử lý phát hiện theo phân công. Người hướng dẫn/phê duyệt xem xét khi học phần yêu cầu; không ghi trạng thái đã phê duyệt nếu chưa có xác nhận thực tế. Người rà soát lại xác minh việc khắc phục; nếu cá nhân tự rà soát lại, hồ sơ phải nêu rõ giới hạn về tính độc lập.'
])
insert_after_text('Mỗi phát hiện được cấp mã duy nhất', [
    'Thang mức độ được đề xuất thống nhất như sau: Nghiêm trọng khi có khả năng gây truy cập trái phép, sai lệch dữ liệu lớn hoặc hỏng chức năng trọng yếu; Cao khi ảnh hưởng đáng kể tới chức năng, quy tắc nghiệp vụ hoặc toàn vẹn dữ liệu; Trung bình khi làm giảm khả năng bảo trì, gây sai lệch một phần hoặc tăng rủi ro lỗi; Thấp khi là vấn đề nhỏ về tính nhất quán/khả năng đọc, chưa có ảnh hưởng trực tiếp đáng kể. Mức độ cần gắn với ảnh hưởng cụ thể và không được xem là phân loại chính thức của ISO/IEC 25010.'
])
insert_after_text('3.6. Đầu ra', [
    'Đầu ra bắt buộc của mỗi lượt gồm phiếu phạm vi (người thực hiện, module/file, phiên bản code và yêu cầu liên quan); checklist hoàn thành (mã tiêu chí, trạng thái, minh chứng và nhận xét); danh sách phát hiện (mã, mức độ, vị trí, căn cứ, hướng xử lý, trạng thái và kết quả rà soát lại); báo cáo kết quả (phương pháp, phạm vi, thống kê, kết luận và giới hạn); cùng liên kết commit hoặc hồ sơ thay đổi nếu có sửa mã nguồn. Hồ sơ chỉ phản ánh kết quả đã thực hiện, không ghi giả định thành minh chứng.'
])

def add_heading_pagebreaks():
    """Start each top-level numbered section and the references on a new page."""
    for p in list(doc.paragraphs):
        txt=p.text.strip()
        if (txt.startswith(('1. LỰA CHỌN','2. THIẾT LẬP','3. QUY TRÌNH','4. CHECKLIST'))
                or txt in ('KẾT LUẬN','TÀI LIỆU THAM KHẢO')):
            p.paragraph_format.page_break_before=True

def table_at_end(caption, headers, rows, widths):
    p=add_end_p(caption,align=WD_ALIGN_PARAGRAPH.CENTER,first_indent=0,bold=True,line=1.5,keep=True)
    p.paragraph_format.space_before=Pt(5); p.paragraph_format.space_after=Pt(2)
    t=doc.add_table(rows=1,cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False; t.style='Table Grid'
    for j, val in enumerate(headers):
        c=t.rows[0].cells[j]; c.width=Cm(widths[j]); c.text=val; c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
        cell_margins(c)
        shd=OxmlElement('w:shd'); shd.set(qn('w:fill'),'D9E2F3'); c._tc.get_or_add_tcPr().append(shd)
        for p0 in c.paragraphs:
            p0.alignment=WD_ALIGN_PARAGRAPH.CENTER; p0.paragraph_format.first_line_indent=Cm(0); p0.paragraph_format.line_spacing=1.05
            for r in p0.runs: style_run(r,size=10,bold=True)
    tr=t.rows[0]._tr.get_or_add_trPr(); th=OxmlElement('w:tblHeader'); th.set(qn('w:val'),'true'); tr.append(th)
    for row in rows:
        cells=t.add_row().cells
        for j,val in enumerate(row):
            c=cells[j]; c.width=Cm(widths[j]); c.text=str(val); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.TOP; cell_margins(c)
            for p0 in c.paragraphs:
                p0.paragraph_format.first_line_indent=Cm(0); p0.paragraph_format.line_spacing=1.05; p0.paragraph_format.space_after=Pt(0)
                for r in p0.runs: style_run(r,size=10)
        tr=t.rows[-1]._tr.get_or_add_trPr(); tr.append(OxmlElement('w:cantSplit'))
    return t

def cell_margins(cell):
    tcPr=cell._tc.get_or_add_tcPr(); mar=OxmlElement('w:tcMar')
    for side,val in [('top',55),('start',70),('bottom',55),('end',70)]:
        el=OxmlElement('w:'+side); el.set(qn('w:w'),str(val)); el.set(qn('w:type'),'dxa'); mar.append(el)
    tcPr.append(mar)

# Front matter, inserted before the original Section 1.
anchor=doc.paragraphs[0]
front=[]
def front_p(text='', align=None, bold=False, size=14, before=0, after=0, line=1.5, style=None, page_before=False):
    p=doc.add_paragraph(style=style)
    if text:
        r=p.add_run(text); style_run(r,size=size,bold=bold)
    p.alignment=align if align is not None else WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent=Cm(0); p.paragraph_format.space_before=Pt(before); p.paragraph_format.space_after=Pt(after); p.paragraph_format.line_spacing=line
    p.paragraph_format.page_break_before=page_before
    p._p.getparent().remove(p._p); anchor._p.addprevious(p._p); front.append(p); return p

front_p('BÀI KIỂM TRA THƯỜNG XUYÊN 2',bold=True,before=20,after=12)
front_p('ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM',bold=True,after=22)
front_p('PHẦN II. BÁO CÁO CÁ NHÂN',bold=True,after=18)
front_p('ĐỀ TÀI',bold=True,after=5)
front_p('Đảm bảo chất lượng cho dự án ứng dụng web quản lý dự án Vira',bold=True,after=18)
front_p('BÁO CÁO CÁ NHÂN',bold=True,after=4)
front_p('Thiết lập và vận dụng hệ thống đảm bảo chất lượng phần mềm\ntrọng tâm rà soát mã nguồn',bold=True,after=20)
front_p('Sinh viên: Trần Đức Ngọc',align=WD_ALIGN_PARAGRAPH.LEFT,after=4)
front_p('Mã sinh viên: 2023602056',align=WD_ALIGN_PARAGRAPH.LEFT,after=4)
front_p('Lớp: 2023DHKTPM02        Nhóm: 5',align=WD_ALIGN_PARAGRAPH.LEFT,after=4)
front_p('Số thứ tự: 045        Mã đề: TX2-10_11_12-045',align=WD_ALIGN_PARAGRAPH.LEFT,after=4)
front_p('Nhiệm vụ cá nhân: Rà soát mã nguồn; tập trung vào coding standards, tính bảo trì và phân quyền.',align=WD_ALIGN_PARAGRAPH.LEFT,before=14)
front.append(add_pagebreak())

front_p('LỜI MỞ ĐẦU',bold=True,after=8,before=0,page_before=True)
opening=[
'Chất lượng phần mềm chịu ảnh hưởng bởi cách tổ chức mã nguồn, mức độ tuân thủ quy ước lập trình, khả năng bảo trì và việc kiểm soát quyền truy cập. Rà soát mã nguồn giúp phát hiện những điểm chưa phù hợp với yêu cầu và tiêu chuẩn của dự án, qua đó hỗ trợ hạn chế lỗi và tạo thuận lợi cho việc sửa đổi phần mềm.',
'Vira là ứng dụng web hỗ trợ quản lý dự án và cộng tác công việc theo cấu trúc Workspace – Project – Task/Subtask. Hệ thống cung cấp các chức năng như Kanban, Sprint, phân công công việc và quản lý quyền thành viên. Vì vậy, hoạt động rà soát mã nguồn cần chú ý đến khả năng bảo trì và việc kiểm tra quyền tại backend.',
'Trong khuôn khổ bài kiểm tra thường xuyên 2 của học phần Đảm bảo chất lượng phần mềm, báo cáo cá nhân này tập trung thiết lập và vận dụng hoạt động SQA cho Vira. Báo cáo lựa chọn Waterfall làm mô hình tham chiếu để bố trí hoạt động kiểm soát theo giai đoạn và ISO/IEC 25010 làm cơ sở lựa chọn đặc tính chất lượng phù hợp với nhiệm vụ.',
'Nội dung báo cáo gồm lựa chọn mô hình và tiêu chuẩn chất lượng; thiết lập bộ tiêu chuẩn tài liệu SQA; xây dựng quy trình rà soát mã nguồn; và áp dụng checklist vào phạm vi mã nguồn được xem xét. Kết quả được trình bày kèm căn cứ và vị trí minh chứng. Phần rà soát mã nguồn trong tài liệu này là rà soát tĩnh; báo cáo phân biệt rõ bằng chứng trong mã nguồn với các kiểm thử chưa được thực thi trong phạm vi lập báo cáo.'
]
for txt in opening: front_p(txt,align=WD_ALIGN_PARAGRAPH.JUSTIFY,after=3,line=1.5)
front_p('DANH MỤC TỪ VIẾT TẮT',bold=True,after=4)
abbr=[('API','Giao diện lập trình ứng dụng (Application Programming Interface)'),('DTO','Đối tượng truyền dữ liệu (Data Transfer Object)'),('HTTP','Giao thức truyền tải siêu văn bản (Hypertext Transfer Protocol)'),('ISO/IEC','Tổ chức Tiêu chuẩn hóa Quốc tế / Ủy ban Kỹ thuật Điện Quốc tế'),('JWT','Mã thông báo web JSON (JSON Web Token)'),('SQA','Đảm bảo chất lượng phần mềm (Software Quality Assurance)'),('UI','Giao diện người dùng (User Interface)')]
for a,b in abbr: front_p(f'{a} — {b}',align=WD_ALIGN_PARAGRAPH.LEFT,line=1.15)
front.append(add_pagebreak())


front_p('MỤC LỤC',bold=True,after=8,page_before=True)
toc=[
('Lời mở đầu',0),('Danh mục từ viết tắt',0),
('1. Lựa chọn mô hình phát triển và tiêu chuẩn chất lượng',0),('1.1. Phạm vi và mục tiêu lựa chọn',1),('1.2. Mô hình phát triển được lựa chọn',1),('1.3. Tiêu chuẩn/mô hình chất lượng được lựa chọn',1),('1.4. Kết luận phần 1',1),
('2. Thiết lập bộ tiêu chuẩn tài liệu SQA',0),('2.1. Mục đích và phạm vi áp dụng',1),('2.2. Cấu trúc chung của tài liệu SQA',1),('2.3. Quy tắc mã và tên tài liệu',1),('2.4. Quy tắc đặt tên file và quản lý phiên bản',1),('2.5. Người soạn, người rà soát và người phê duyệt',1),('2.6. Nội dung, trình bày và bảo mật',1),('2.7. Lưu trữ, truy vết và sử dụng tài liệu',1),('2.8. Kết luận phần 2',1),
('3. Quy trình SQA phục vụ rà soát mã nguồn',0),('3.1. Mục tiêu',1),('3.2. Phạm vi',1),('3.3. Vai trò và trách nhiệm',1),('3.4. Đầu vào',1),('3.5. Trình tự thực hiện',1),
('3.6. Đầu ra',1),('3.7. Điều kiện chấp nhận và tiêu chí kết thúc',1),('3.8. Minh chứng và kiểm soát hồ sơ',1),('3.9. Hạn chế của rà soát cá nhân',1),('3.10. Kết luận phần 3',1),
('4. Checklist rà soát mã nguồn và kết quả áp dụng',0),('4.1. Phạm vi, phương pháp và quy ước đánh giá',1),('4.2. Checklist coding standards và khả năng bảo trì',1),('4.3. Checklist phân quyền và bảo mật',1),('4.4. Checklist tính đúng đắn và toàn vẹn dữ liệu',1),('4.5. Tổng hợp kết quả và phát hiện',1),('4.6. Hướng xử lý và theo dõi',1),('4.7. Giới hạn của kết quả checklist',1),('4.8. Kết luận phần 4',1),
('Kết luận',0),('Tài liệu tham khảo',0)
]
for label,level in toc:
    p=doc.add_paragraph(); p.paragraph_format.left_indent=Cm(.6*level); p.paragraph_format.first_line_indent=Cm(0); p.paragraph_format.line_spacing=1.0; p.paragraph_format.space_after=Pt(0)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(15.2),WD_TAB_ALIGNMENT.RIGHT,WD_TAB_LEADER.DOTS)
    r=p.add_run(label+'\t00'); style_run(r,size=11,bold=(level==0))
    p._p.getparent().remove(p._p); anchor._p.addprevious(p._p); front.append(p)
front.append(add_pagebreak())

# New Section 4 checklist, appended after Sections 1-3 and before final references.
add_heading('4. CHECKLIST RÀ SOÁT MÃ NGUỒN VÀ KẾT QUẢ ÁP DỤNG',1)
add_heading('4.1. Phạm vi, phương pháp và quy ước đánh giá',2)
add_end_p('Phạm vi rà soát được xác định theo nhiệm vụ cá nhân và mã nguồn backend của Vira, tập trung vào các luồng Project Member, Project/Workspace authorization và Task update. Các tệp trọng tâm gồm ProjectMemberService.java, ProjectService.java, WorkspaceService.java, TaskAuthorizationService.java, TaskService.java, TaskController.java, các request DTO, BaseEntity.java, SecurityConfig.java và ApiExceptionHandler.java. Quy tắc đối chiếu lấy từ AGENTS.md và DAC_TA_VIRA.md của dự án.')
add_end_p('Phương pháp áp dụng là rà soát tĩnh: đọc mã nguồn, lần theo lời gọi giữa controller và service, đối chiếu điều kiện phân quyền, validation, truy vấn theo projectId và quy tắc version. Bằng chứng trong checklist ghi đường dẫn và số dòng để người đọc kiểm tra lại. Tài liệu e2e/roles.spec.js và e2e/platform-flow.spec.js được xem là kịch bản kiểm thử có sẵn trong repository; các kịch bản này không được chạy trong phạm vi lập báo cáo nên không được trình bày như kết quả kiểm thử đạt.')
add_end_p('Quy ước đánh giá: Đạt khi mã nguồn có xử lý đáp ứng tiêu chí trong phạm vi xem xét; Không đạt khi thiếu xử lý hoặc có điểm chưa nhất quán cần sửa/xác nhận; Không áp dụng khi tiêu chí nằm ngoài phạm vi, kèm lý do. Mỗi mục Không đạt cần có mức độ, căn cứ và hướng xử lý. Kết quả này phản ánh một lượt rà soát tĩnh trên working tree tại ngày lập báo cáo, không thay thế kiểm thử động, kiểm thử bảo mật hoặc peer review độc lập.')

headers=['Mã','Tiêu chí và nội dung kiểm tra','Cách đánh giá','Kết quả','Minh chứng trong dự án','Hướng xử lý nếu không đạt']
widths=[1.0,3.6,3.2,1.5,4.0,2.2]
maint=[
('M01','Mã nguồn được phân chia theo miền nghiệp vụ và lớp API/application/domain.','Đối chiếu cấu trúc package và các file đại diện.','Đạt','backend/src/main/java/vn/vira/{project,task,workspace}/; AGENTS.md, mục Project Structure.','—'),
('M02','Tên phương thức phản ánh chính xác điều kiện hoặc hành vi mà phương thức thực hiện.','Đọc tên và thân hàm, so sánh với điều kiện kiểm tra thực tế.','Không đạt','TaskAuthorizationService.java:33–37 chỉ xác nhận tư cách thành viên; TaskService.java:61 gọi hàm tên requireTaskCreator.','Đổi tên thành requireTaskCreationPermission hoặc tên tương đương và cập nhật điểm gọi.'),
('M03','Các phụ thuộc service được khai báo rõ và khởi tạo theo constructor.','Kiểm tra cách khai báo dependency trong service được chọn.','Đạt','ProjectMemberService.java:25–33 dùng @RequiredArgsConstructor và final fields.','—'),
('M04','Các truy vấn chỉ đọc trong phạm vi mẫu được đánh dấu giao dịch chỉ đọc.','Kiểm tra annotation trên một số phương thức truy vấn.','Đạt','ProjectMemberService.java:34–41; ProjectService.java:82–98; TaskService.java:94–102.','—'),
('M05','Lỗi xác thực, phân quyền, validation và xung đột dữ liệu được ánh xạ tập trung.','Đối chiếu các handler và định dạng phản hồi lỗi.','Đạt','ApiExceptionHandler.java:16–72 xử lý NotFound, validation, AccessDenied và optimistic locking.','—'),
('M06','Request quan trọng có validation tại DTO và được kích hoạt ở controller.','Đối chiếu ràng buộc DTO với @Valid tại endpoint.','Đạt','CreateTaskRequest.java:12–34; ChangeTaskStatusRequest.java:6–12; MoveTaskRequest.java:7–18; TaskController.java:53–76.','—'),
('M07','API trả response DTO thay vì để lộ trực tiếp entity persistence.','Lần theo kiểu trả về và bước mapping trong service.','Đạt','TaskService.java:88–91 dùng TaskMapper; ProjectMemberService.java:58–65 trả ProjectMemberResponse.','—'),
('M08','Tên package, lớp, phương thức và biến trong mã nguồn dùng tiếng Anh theo quy ước dự án.','Đối chiếu quy ước ngôn ngữ với mã nguồn đã chọn.','Đạt','AGENTS.md, Development Conventions mục 4; các lớp ProjectMemberService, TaskService, TaskAuthorizationService.','—'),
]
add_heading('4.2. Checklist coding standards và khả năng bảo trì',2)
table_at_end('Bảng 4.1. Checklist coding standards và khả năng bảo trì',headers,maint,widths)

security=[
('S01','API yêu cầu xác thực mặc định, chỉ công khai các endpoint được khai báo rõ.','Đọc cấu hình filter chain và danh sách permitAll.','Đạt','SecurityConfig.java:29–37: auth, health và Swagger được permit; anyRequest authenticated.','—'),
('S02','Truy cập dữ liệu Project được giới hạn cho thành viên còn hoạt động.','Lần theo hàm kiểm tra thành viên trước khi trả project.','Đạt','ProjectService.java:141–150 kiểm tra membership chưa bị removed trước khi trả project đang hoạt động.','—'),
('S03','Danh sách thành viên Project yêu cầu người xem là thành viên của Project đó.','Kiểm tra service trước khi truy vấn danh sách.','Đạt','ProjectMemberService.java:34–41 gọi projectService.requireMember(projectId).','—'),
('S04','Quản lý thành viên chỉ dành cho OWNER/ADMIN; MEMBER không thể mời, đổi vai trò hoặc xóa thành viên.','Kiểm tra guard được gọi trên các thao tác quản lý.','Đạt','ProjectMemberService.java:44–47, 68–75, 88–105 kiểm tra requireAdmin.','—'),
('S05','Không thể gán vai trò OWNER cho thành viên mới hoặc nâng thành viên lên OWNER; không thể xóa/đổi vai trò OWNER.','Đối chiếu kiểm tra đầu vào và xử lý thành viên hiện tại.','Đạt','ProjectMemberService.java:47–49, 77–82, 93–95.','—'),
('S06','Cấu hình, lưu trữ và khôi phục Project chỉ do chủ sở hữu thực hiện.','Lần theo các phương thức update/archive/restore tới kiểm tra owner.','Đạt','ProjectService.java:107–128, 130–137, 168–173.','—'),
('S07','Cấu hình, lưu trữ và khôi phục Workspace chỉ do chủ sở hữu thực hiện.','Lần theo các phương thức update/archive/restore tới requireOwner.','Đạt','WorkspaceService.java:65–87; restore tại dòng 79–80 cũng gọi requireOwner.','—'),
('S08','Sửa task chỉ được phép với OWNER/ADMIN, người tạo hoặc người được giao.','Đọc điều kiện trong TaskAuthorizationService.','Đạt','TaskAuthorizationService.java:19–30 kiểm tra admin, reporter và assignee.','—'),
('S09','Tìm task theo ID phải giới hạn đồng thời theo Project và trạng thái xóa.','Kiểm tra các truy vấn lấy task theo ID.','Đạt','TaskService.java:231–234 dùng findByIdAndProjectIdAndDeletedAtIsNull.','—'),
('S10','Danh sách Project đã lưu trữ phải áp dụng chính sách hiển thị nhất quán với phạm vi thành viên Project.','So sánh danh sách đang hoạt động và danh sách archived.','Không đạt','ProjectService.java:83–97 lọc dự án đang hoạt động cho workspace owner hoặc project member; dòng 100 chỉ gọi workspaceService.requireMember rồi lấy toàn bộ archived project của workspace.','Xác định chính sách hiển thị archived project; nếu chỉ thành viên Project được xem, áp dụng bộ lọc tương ứng và bổ sung kiểm thử truy cập trái quyền.'),
('S11','Thay đổi trạng thái và di chuyển task yêu cầu version hiện tại.','Đối chiếu request DTO, service và xử lý version.','Đạt','TaskController.java:60–78; TaskService.java:150–181; request DTO có @NotNull version.','—'),
('S12','Xóa mềm và khôi phục task yêu cầu quyền quản trị cùng version hợp lệ.','Kiểm tra guard và so sánh version trước khi đổi trạng thái xóa.','Đạt','TaskService.java:197–219 gọi requireAdmin và kiểm tra version trước khi xóa/khôi phục.','—'),
]
add_heading('4.3. Checklist phân quyền và bảo mật',2)
table_at_end('Bảng 4.2. Checklist phân quyền và bảo mật',headers,security,widths)

integrity=[
('D01','Dữ liệu tạo task có ràng buộc cho tiêu đề, loại, ưu tiên và giá trị số.','Đối chiếu annotation trong request DTO.','Đạt','CreateTaskRequest.java:12–34 có NotBlank, NotNull, Size, DecimalMin và Min.','—'),
('D02','Task cha được kiểm tra thuộc cùng Project với task con.','Đọc hàm tra cứu parent theo projectId.','Đạt','TaskService.java:222–229 dùng findByIdAndProjectIdAndDeletedAtIsNull.','—'),
('D03','Sprint gán cho task phải thuộc cùng Project.','Kiểm tra truy vấn Sprint theo sprintId và projectId.','Đạt','TaskService.java:185–191 dùng findByIdAndProjectId; sai phạm ném BusinessException.','—'),
('D04','Không thể chuyển task cha sang DONE khi còn task con chưa hoàn tất.','Kiểm tra điều kiện trước khi cập nhật status.','Đạt','TaskService.java:160–163 kiểm tra task con khác DONE trước khi đổi trạng thái.','—'),
('D05','Xung đột optimistic locking được trả về trạng thái HTTP phù hợp.','Đối chiếu exception phát sinh và handler.','Đạt','BaseEntity.java:27–28 khai báo @Version; ApiExceptionHandler.java:51–56 ánh xạ lỗi sang CONFLICT.','—'),
]
add_heading('4.4. Checklist tính đúng đắn và toàn vẹn dữ liệu',2)
table_at_end('Bảng 4.3. Checklist tính đúng đắn và toàn vẹn dữ liệu',headers,integrity,widths)

add_heading('4.5. Tổng hợp kết quả và phát hiện',2)
add_end_p('Checklist gồm 25 tiêu chí. Qua rà soát tĩnh, 23 tiêu chí được đánh giá Đạt và 2 tiêu chí Không đạt. Các mục Đạt chỉ xác nhận rằng trong những đoạn mã đã xem có dấu hiệu xử lý phù hợp với tiêu chí; chúng không chứng minh không còn lỗi ở những luồng chưa được rà soát. Hai phát hiện cần theo dõi gồm sự chưa tương ứng giữa tên requireTaskCreator và hành vi thực tế, cùng sự khác biệt về phạm vi quyền khi liệt kê Project đã lưu trữ.')
add_end_p('Đối với S10, căn cứ hiện có cho thấy danh sách Project đang hoạt động phân biệt workspace owner và project member, trong khi danh sách archived chỉ xác thực workspace membership trước khi truy vấn toàn bộ dự án đã lưu trữ. Đặc tả dự án yêu cầu phân quyền theo API và dữ liệu phải được lọc theo quyền, nhưng chưa nêu riêng quy tắc xem archived project. Vì vậy, đây được ghi nhận là Không đạt về tính nhất quán/đủ căn cứ phân quyền, cần người phụ trách nghiệp vụ xác nhận chính sách và điều chỉnh code hoặc tài liệu tương ứng.')
add_end_p('Đối với M02, phương thức requireTaskCreator được gọi khi tạo task nhưng thân hàm chỉ kiểm tra thành viên hiện tại trong Project. Điều kiện cho phép hiện tại có thể đúng nếu mọi thành viên Project được phép tạo task; vấn đề được ghi nhận ở tính rõ nghĩa của tên phương thức, không phải khẳng định sai quyền tạo task. Hướng xử lý là đổi tên để phản ánh chính sách cho phép tạo task hoặc bổ sung kiểm tra người tạo nếu ý nghĩa dự kiến là xác nhận một task cụ thể.')

findings=[
('F-01','M02 - Tên phương thức không khớp hành vi','Thấp','TaskAuthorizationService.requireTaskCreator chỉ xác nhận người dùng là thành viên Project; hàm được gọi trước khi tạo task. Tên hiện tại có thể khiến người bảo trì hiểu nhầm rằng hàm kiểm tra quyền của tác giả task.','TaskAuthorizationService.java:33–37; TaskService.java:58–63.','Đổi tên thành requireTaskCreationPermission hoặc requireProjectMemberCanCreateTask nếu chính sách là mọi thành viên được tạo task. Xác nhận cùng quy tắc với tài liệu yêu cầu.','Mở'),
('F-02','S10 - Phạm vi xem danh sách archived chưa nhất quán','Cao - cần xác nhận chính sách','Danh sách active phân biệt workspace owner và thành viên Project; danh sách archived chỉ xác thực workspace member rồi truy vấn mọi archived Project trong workspace. Nếu quy tắc chỉ cho thành viên Project xem nội dung dự án, logic hiện tại có nguy cơ tiết lộ thông tin dự án đã lưu trữ cho thành viên workspace không thuộc Project.','ProjectService.java:83–100; yêu cầu phân quyền API tại DAC_TA_VIRA.md, mục 2.','Chốt chính sách với người phụ trách; giới hạn truy vấn theo quyền project member hoặc bổ sung ngoại lệ chính thức vào đặc tả; thêm kiểm thử quyền cho cả hai vai trò.','Mở - chờ xác nhận')
]
table_at_end('Bảng 4.4. Phiếu ghi nhận phát hiện và hướng xử lý',['Mã','Phát hiện','Mức độ','Mô tả và căn cứ','Minh chứng','Hướng xử lý','Trạng thái'],findings,[0.8,2.1,1.7,3.3,2.5,3.4,1.3])

add_heading('4.6. Cách xử lý và đóng phát hiện',2)
add_end_p('Phát hiện F-01 có thể được xử lý bằng việc đổi tên phương thức và cập nhật điểm gọi, sau đó rà soát lại các nơi sử dụng để bảo đảm tên mới không làm thay đổi hành vi phân quyền. Người thực hiện cần xác nhận thay đổi trong mã nguồn hoặc commit trước khi chuyển trạng thái sang Đã khắc phục.')
add_end_p('F-02 cần được chuyển tới người có trách nhiệm xác định chính sách truy cập dự án đã lưu trữ. Khi chính sách được thống nhất, cập nhật đặc tả hoặc tài liệu quyền làm căn cứ; nếu phạm vi xem phải theo project membership, sửa service để truy vấn chỉ trả các dự án người dùng được phép xem. Sau đó bổ sung kiểm thử trái quyền và kiểm thử quyền hợp lệ. Cho đến khi có căn cứ và kết quả kiểm tra lại, giữ trạng thái Mở - chờ xác nhận.')
add_end_p('Tài liệu e2e/roles.spec.js và e2e/platform-flow.spec.js có các kịch bản về vai trò, truy cập ngoài Project, yêu cầu version và xung đột phiên bản. Đây là bằng chứng rằng test case được mô tả trong repository, không phải bằng chứng các test đã chạy thành công trong lần rà soát này. Sau khi sửa F-02, cần chạy hoặc giao người phụ trách chạy các kịch bản tương ứng và lưu báo cáo thực thi làm minh chứng bổ sung.')
add_heading('4.7. Giới hạn của kết quả checklist',2)
add_end_p('Rà soát được thực hiện trên mã nguồn tĩnh trong phạm vi các lớp backend nêu ở Mục 4.1. Báo cáo không chạy unit test, integration test, E2E, kiểm thử xâm nhập hoặc xác minh hành vi trên môi trường triển khai. Do đó, các đánh giá Đạt không thay thế việc xác minh runtime. Danh sách đường dẫn và số dòng giúp truy vết tại phiên bản mã nguồn được xem xét; khi code thay đổi, số dòng và kết quả cần được rà soát lại.')
add_end_p('Việc rà soát do cá nhân thực hiện cũng có hạn chế về tính độc lập. Để giảm rủi ro bỏ sót, checklist được xác định trước, phát hiện được gắn với căn cứ và vị trí cụ thể, còn phát hiện liên quan chính sách quyền được để mở cho đến khi có xác nhận nghiệp vụ và kiểm tra lại.')
add_heading('4.8. Kết luận phần 4',2)
add_end_p('Checklist đã chuyển các yêu cầu về coding standards, khả năng bảo trì, phân quyền và toàn vẹn dữ liệu thành các tiêu chí có cách đánh giá, kết quả, minh chứng và hướng xử lý. Trong 25 tiêu chí rà soát tĩnh, 23 tiêu chí Đạt; hai phát hiện được ghi nhận để xử lý hoặc xác nhận trước khi đóng. Kết quả là cơ sở cho hoạt động cải tiến và kiểm tra lại trong phạm vi nhiệm vụ cá nhân.')

# General conclusion and source list.
add_heading('KẾT LUẬN',1)
add_end_p('Báo cáo đã xây dựng căn cứ lựa chọn Waterfall và ISO/IEC 25010, thiết lập bộ tiêu chuẩn tài liệu SQA, mô tả quy trình rà soát mã nguồn và áp dụng checklist vào một phạm vi cụ thể của backend Vira. Các phần này liên kết mục tiêu chất lượng với quy tắc dự án, tiêu chí kiểm tra, hồ sơ kết quả và cách theo dõi phát hiện.')
add_end_p('Qua rà soát tĩnh, các luồng được kiểm tra có những cơ chế bảo vệ đáng chú ý như xác thực mặc định, kiểm tra thành viên và vai trò ở service, giới hạn thao tác chủ sở hữu, kiểm tra version và xử lý lỗi tập trung. Báo cáo đồng thời ghi nhận hai điểm cần xử lý: tên một phương thức chưa phản ánh rõ hành vi và chính sách xem Project đã lưu trữ chưa nhất quán giữa các danh sách. Kết luận này giới hạn ở mã nguồn được rà soát và không thay thế kiểm thử động hoặc đánh giá độc lập.')
add_end_p('Trong bước tiếp theo, cá nhân cần cập nhật trạng thái phát hiện sau khi có quyết định nghiệp vụ hoặc thay đổi mã nguồn, lưu minh chứng rà soát lại và hoàn thiện các hồ sơ theo phiên bản đã ban hành. Việc duy trì checklist và lịch sử thay đổi giúp các lần rà soát sau có căn cứ thống nhất và dễ truy vết.')

add_heading('TÀI LIỆU THAM KHẢO',1)
refs=[
'[1] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 01. Tổng quan về đảm bảo chất lượng phần mềm”, tài liệu bài giảng do giảng viên cung cấp.',
'[2] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 02. Các yếu tố và thành phần ảnh hưởng tới hoạt động SQA”, tài liệu bài giảng do giảng viên cung cấp.',
'[3] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 03. Các hoạt động đảm bảo chất lượng phần mềm”, tài liệu bài giảng do giảng viên cung cấp.',
'[4] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 05. Chuẩn và mô hình chất lượng”, tài liệu bài giảng do giảng viên cung cấp; mô hình ISO/IEC 25010:2011 được dẫn theo nội dung học phần.',
'[5] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 07. Hệ thống đảm bảo chất lượng phần mềm”, tài liệu bài giảng do giảng viên cung cấp.',
'[6] Tài liệu học phần Đảm bảo chất lượng phần mềm, “Bài 08. Thiết lập và vận hành hệ thống đảm bảo chất lượng phần mềm”, tài liệu bài giảng do giảng viên cung cấp.',
'[7] Vira Project, “AGENTS.md - Project Guidelines”, tài liệu hướng dẫn dự án.',
'[8] Vira Project, “Đặc tả yêu cầu phần mềm - Vira”, phiên bản 1.0.'
]
for ref in refs:
    p=add_end_p(ref,first_indent=0,line=1.5)
    p.paragraph_format.left_indent=Cm(1); p.paragraph_format.first_line_indent=Cm(-1)

# The prior body citations followed the original numbering (Bài 01, 03, 05, 07, 08).
# Shift those citations to match the expanded bibliography that also lists Bài 02.
for p in doc.paragraphs:
    if p.text.strip() == 'TÀI LIỆU THAM KHẢO':
        break
    for run in p.runs:
        run.text=run.text.replace('[5]','[6]').replace('[4]','[5]').replace('[3]','[4]').replace('[2]','[3]')

# The main report starts after the contents page.
main_heading=next((p for p in doc.paragraphs if p.text.strip().startswith('1. LỰA CHỌN MÔ HÌNH')),None)
if main_heading is not None: main_heading.paragraph_format.page_break_before=True

# Populate the manual contents page using the page locations verified in the rendered report.
toc_pages={
'Lời mở đầu':2,'Danh mục từ viết tắt':2,
'1. Lựa chọn mô hình phát triển và tiêu chuẩn chất lượng':4,'1.1. Phạm vi và mục tiêu lựa chọn':4,'1.2. Mô hình phát triển được lựa chọn':4,'1.3. Tiêu chuẩn/mô hình chất lượng được lựa chọn':5,'1.4. Kết luận phần 1':7,
'2. Thiết lập bộ tiêu chuẩn tài liệu SQA':7,'2.1. Mục đích và phạm vi áp dụng':7,'2.2. Cấu trúc chung của tài liệu SQA':7,'2.3. Quy tắc mã và tên tài liệu':7,'2.4. Quy tắc đặt tên file và quản lý phiên bản':8,'2.5. Người soạn, người rà soát và người phê duyệt':8,'2.6. Nội dung, trình bày và bảo mật':9,'2.7. Lưu trữ, truy vết và sử dụng tài liệu':9,'2.8. Kết luận phần 2':9,
'3. Quy trình SQA phục vụ rà soát mã nguồn':10,'3.1. Mục tiêu':10,'3.2. Phạm vi':10,'3.3. Vai trò và trách nhiệm':10,'3.4. Đầu vào':11,'3.5. Trình tự thực hiện':11,'3.6. Đầu ra':13,'3.7. Điều kiện chấp nhận và tiêu chí kết thúc':13,'3.8. Minh chứng và kiểm soát hồ sơ':14,'3.9. Hạn chế của rà soát cá nhân':14,'3.10. Kết luận phần 3':14,
'4. Checklist rà soát mã nguồn và kết quả áp dụng':15,'4.1. Phạm vi, phương pháp và quy ước đánh giá':15,'4.2. Checklist coding standards và khả năng bảo trì':16,'4.3. Checklist phân quyền và bảo mật':17,'4.4. Checklist tính đúng đắn và toàn vẹn dữ liệu':19,'4.5. Tổng hợp kết quả và phát hiện':20,'4.6. Hướng xử lý và theo dõi':22,'4.7. Giới hạn của kết quả checklist':23,'4.8. Kết luận phần 4':23,'Kết luận':23,'Tài liệu tham khảo':24}
in_toc=False
for p in doc.paragraphs:
    if p.text.strip()=='MỤC LỤC': in_toc=True; continue
    if not in_toc: continue
    label=p.text.split('\t')[0].strip()
    if label in toc_pages and p.runs:
        p.runs[0].text=label+'\t'+str(toc_pages[label])
        for run in p.runs[1:]: run.text=''
    if label=='Tài liệu tham khảo': in_toc=False

# Normalize table fonts/spacing and retain row integrity.
for t in doc.tables:
    t.alignment=WD_TABLE_ALIGNMENT.CENTER
    for row in t.rows:
        tr=row._tr.get_or_add_trPr()
        if tr.find(qn('w:cantSplit')) is None: tr.append(OxmlElement('w:cantSplit'))
        for c in row.cells:
            for p in c.paragraphs:
                p.paragraph_format.line_spacing=1.05
                p.paragraph_format.first_line_indent=Cm(0)
                for r in p.runs: style_run(r,size=10,bold=r.bold)

# Set a simple, report-appropriate header page number (the source document already has one).
for sec in doc.sections:
    if not any('PAGE' in p._p.xml for p in sec.header.paragraphs):
        hp=sec.header.paragraphs[0]; hp.alignment=WD_ALIGN_PARAGRAPH.CENTER; hp.paragraph_format.first_line_indent=Cm(0)
        fld=OxmlElement('w:fldSimple'); fld.set(qn('w:instr'),'PAGE'); hp._p.append(fld)

doc.core_properties.title='Báo cáo cá nhân về đảm bảo chất lượng phần mềm cho dự án Vira'
doc.core_properties.subject='Bài kiểm tra thường xuyên 2 - Các yêu cầu 1 đến 4'
doc.core_properties.author='Trần Đức Ngọc'
doc.core_properties.keywords='Vira, SQA, Waterfall, ISO/IEC 25010, code review'
doc.save(OUT)
print(OUT)
