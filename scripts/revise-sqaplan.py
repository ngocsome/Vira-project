from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path

src = Path(r'D:\SQAPlan.docx')
doc = Document(src)
body = doc._element.body
for child in list(body):
    if child.tag != qn('w:sectPr'):
        body.remove(child)

sec = doc.sections[0]
sec.top_margin, sec.bottom_margin = Cm(2), Cm(2)
sec.left_margin, sec.right_margin = Cm(3), Cm(2)
sec.header_distance = sec.footer_distance = Cm(1)

styles = doc.styles
for name, size, before, after in [('Normal',13,0,5),('Title',18,0,10),('Heading 1',14,11,5),('Heading 2',13,8,3)]:
    st = styles[name]
    st.font.name, st.font.size, st.font.color.rgb = 'Times New Roman', Pt(size), RGBColor(0,0,0)
    st._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    st.paragraph_format.line_spacing = 1.5
    st.paragraph_format.space_before, st.paragraph_format.space_after = Pt(before), Pt(after)
    if name.startswith('Heading'):
        st.paragraph_format.keep_with_next = True
styles['Normal'].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
for name in ('Subtitle','Kicker','Lead'):
    st=styles[name]; st.font.name='Times New Roman'; st.font.color.rgb=RGBColor(0,0,0)
    st._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman'); st.paragraph_format.line_spacing=1.5
styles['Subtitle'].font.size=Pt(12); styles['Kicker'].font.size=Pt(13); styles['Lead'].font.size=Pt(13)

BLUE, PALE2, BORDER = '1F4E78', 'F3F6F9', 'B7C9D6'
def shade(cell, fill):
    pr=cell._tc.get_or_add_tcPr(); el=pr.find(qn('w:shd'))
    if el is None: el=OxmlElement('w:shd'); pr.append(el)
    el.set(qn('w:fill'),fill)
def margins(cell):
    pr=cell._tc.get_or_add_tcPr(); m=pr.first_child_found_in('w:tcMar')
    if m is None: m=OxmlElement('w:tcMar'); pr.append(m)
    for side,val in [('top',100),('start',115),('bottom',100),('end',115)]:
        el=m.find(qn('w:'+side))
        if el is None: el=OxmlElement('w:'+side); m.append(el)
        el.set(qn('w:w'),str(val)); el.set(qn('w:type'),'dxa')
def borders(table):
    pr=table._tbl.tblPr; bs=pr.first_child_found_in('w:tblBorders')
    if bs is None: bs=OxmlElement('w:tblBorders'); pr.append(bs)
    for side in ('top','left','bottom','right','insideH','insideV'):
        el=bs.find(qn('w:'+side))
        if el is None: el=OxmlElement('w:'+side); bs.append(el)
        el.set(qn('w:val'),'single'); el.set(qn('w:sz'),'5'); el.set(qn('w:color'),BORDER)
def keep_row(row):
    row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
def repeat(row):
    el=OxmlElement('w:tblHeader'); el.set(qn('w:val'),'true'); row._tr.get_or_add_trPr().append(el)
def add_field(run, field):
    for kind, value in [('begin',None),('instrText',field),('separate',None),('t','1'),('end',None)]:
        el=OxmlElement('w:fldChar' if kind in ('begin','separate','end') else 'w:'+kind)
        if kind in ('begin','separate','end'): el.set(qn('w:fldCharType'),kind)
        elif kind=='instrText': el.set(qn('xml:space'),'preserve'); el.text=value
        elif kind=='t': el.text=value
        run._r.append(el)

header=sec.header.paragraphs[0]; header.alignment=WD_ALIGN_PARAGRAPH.RIGHT
rr=header.add_run('VIRA  |  KẾ HOẠCH ĐẢM BẢO CHẤT LƯỢNG'); rr.bold=True; rr.font.name='Times New Roman'; rr.font.size=Pt(10); rr._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
footer=sec.footer.paragraphs[0]; footer.alignment=WD_ALIGN_PARAGRAPH.CENTER
for text in ('VIRA-SQA-01  •  Phiên bản 1.0  •  Trang ',):
    r=footer.add_run(text); r.font.name='Times New Roman'; r.font.size=Pt(10)
add_field(footer.add_run(),'PAGE'); r=footer.add_run(' / '); r.font.name='Times New Roman'; r.font.size=Pt(10); add_field(footer.add_run(),'NUMPAGES')

def p(text='', style=None, align=None):
    para=doc.add_paragraph(style=style); para.add_run(text)
    if align is not None: para.alignment=align
    return para
def h(text, level=1): return doc.add_heading(text,level=level)
def bullet(text):
    para=doc.add_paragraph(style='List Bullet'); para.add_run(text); para.paragraph_format.line_spacing=1.5; return para
def numbered(text):
    para=doc.add_paragraph(); para.paragraph_format.left_indent=Cm(0.7); para.paragraph_format.first_line_indent=Cm(-0.7); para.paragraph_format.line_spacing=1.5
    para.add_run(f'{sum(1 for q in doc.paragraphs if q.style and q.style.name == "Heading 1")}.' + ' ' + text)
    return para
def table(title, headers, rows, widths=None, font=11):
    cap=doc.add_paragraph(); cap.paragraph_format.space_before=Pt(4); cap.paragraph_format.space_after=Pt(3); cap.paragraph_format.keep_with_next=True
    r=cap.add_run(title); r.bold=True; r.font.name='Times New Roman'; r.font.size=Pt(11.5); r._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    t=doc.add_table(rows=1,cols=len(headers)); t.alignment=WD_TABLE_ALIGNMENT.CENTER; t.autofit=False
    if widths:
        for col,w in zip(t.columns,widths): col.width=Cm(w)
    repeat(t.rows[0]); keep_row(t.rows[0])
    for j,val in enumerate(headers):
        c=t.rows[0].cells[j]; c.text=str(val); shade(c,BLUE); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; margins(c)
        for q in c.paragraphs:
            q.alignment=WD_ALIGN_PARAGRAPH.CENTER; q.paragraph_format.line_spacing=1.15; q.paragraph_format.space_after=Pt(0)
            for x in q.runs: x.bold=True; x.font.name='Times New Roman'; x.font.size=Pt(font); x.font.color.rgb=RGBColor(255,255,255); x._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    for ix,row in enumerate(rows):
        cells=t.add_row().cells; keep_row(t.rows[-1])
        for j,val in enumerate(row):
            c=cells[j]; c.text=str(val); c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER; margins(c)
            if ix%2: shade(c,PALE2)
            for q in c.paragraphs:
                q.paragraph_format.line_spacing=1.15; q.paragraph_format.space_after=Pt(0)
                q.alignment=WD_ALIGN_PARAGRAPH.CENTER if j==0 and len(headers)>2 else WD_ALIGN_PARAGRAPH.LEFT
                for x in q.runs: x.font.name='Times New Roman'; x.font.size=Pt(font); x._element.rPr.rFonts.set(qn('w:eastAsia'),'Times New Roman')
    if widths:
        for row in t.rows:
            for j,w in enumerate(widths): row.cells[j].width=Cm(w)
    borders(t); doc.add_paragraph().paragraph_format.space_after=Pt(2)
    return t

p('KẾ HOẠCH ĐẢM BẢO CHẤT LƯỢNG PHẦN MỀM','Title',WD_ALIGN_PARAGRAPH.CENTER)
p('Dự án ứng dụng web quản lý dự án Vira','Subtitle',WD_ALIGN_PARAGRAPH.CENTER)
p('Mã tài liệu: VIRA-SQA-01     Phiên bản: 1.0     Ngày lập: 12/10/2026','Subtitle',WD_ALIGN_PARAGRAPH.CENTER)
p('Trạng thái: Dự thảo để nhóm dự án rà soát và phê duyệt. Các ngưỡng dưới đây là mục tiêu nghiệm thu; chỉ xác nhận đạt khi có kết quả và bằng chứng.','Lead')
table('Bảng 1. Kiểm soát tài liệu',['Trường','Thông tin'],[
('Tên tài liệu','Kế hoạch đảm bảo chất lượng phần mềm Vira'),('Mã / phiên bản','VIRA-SQA-01 / 1.0'),('Người lập','Nhóm dự án Vira — cần điền họ tên cụ thể trước khi phát hành'),('Người rà soát','QA/SQA và Quản lý dự án — ghi họ tên khi rà soát'),('Người phê duyệt','Chủ dự án — ghi họ tên và ngày phê duyệt'),('Chuẩn chất lượng','ISO/IEC 25010 — Mô hình chất lượng sản phẩm phần mềm'),('Tài liệu liên quan','VIRA-SDP-01; SRS Vira; TestPlan; TestCases; DefectReport; TestSummaryReport')],[4,12],11)

h('1. Mục tiêu chất lượng')
p('Kế hoạch này quy định cách nhóm Vira phòng ngừa, phát hiện, ghi nhận và xử lý vấn đề chất lượng trong các pha của vòng đời dự án. Mục tiêu là bảo đảm sản phẩm đáp ứng yêu cầu đã duyệt, có bằng chứng kiểm tra được, bảo vệ dữ liệu theo phân quyền, giữ tính toàn vẹn khi cộng tác và có thể triển khai, vận hành, bảo trì trong phạm vi dự án.')
p('ISO/IEC 25010 được dùng làm mô hình phân loại thuộc tính chất lượng sản phẩm. Các mục tiêu đo lường cụ thể dưới đây là tiêu chí dự án đề xuất dựa trên yêu cầu và hiện trạng Vira; chúng không khẳng định sản phẩm đã đạt tiêu chí trước khi thực hiện phép đo.')
table('Bảng 2. Mục tiêu chất lượng theo ISO/IEC 25010',['Đặc tính','Áp dụng cho Vira','Mục tiêu / phương pháp đánh giá'],[
('Tính phù hợp chức năng','Đăng nhập, workspace/project, task, Kanban/Backlog/Sprint, cộng tác, báo cáo','Đủ truy vết SRS → test case; 100% luồng ưu tiên UAT đạt hoặc có ngoại lệ được phê duyệt.'),
('Hiệu năng và hiệu quả','API tìm kiếm, board, task, dashboard','Mục tiêu p95 ≤ 2 giây tại 100 người dùng đồng thời trên môi trường/dữ liệu chốt trong TestPlan; báo cáo lỗi và cấu hình tải.'),
('Tính tương thích','Frontend React/Vite với API Spring Boot, MySQL, Redis, Mailpit','Tích hợp đúng hợp đồng API; chạy smoke trên trình duyệt/thiết bị được chốt trong TestPlan.'),
('Khả năng tương tác','Giao diện tiếng Việt; luồng cho Owner/Admin/Member','Người dùng đại diện hoàn thành UAT; ghi tỷ lệ hoàn thành, lỗi thao tác và phản hồi.'),
('Độ tin cậy','Transaction, Flyway, optimistic locking, backup/restore','Không có sai lệch dữ liệu chưa xử lý; từ chối version cũ; phục hồi DB và uploads theo quy trình.'),
('An toàn thông tin','JWT, BCrypt, RBAC, CORS, rate limit, upload','Không còn lỗi nghiêm trọng chưa xử lý; xác minh quyền API, truy cập chéo, token, input và dữ liệu bí mật.'),
('Khả năng bảo trì','Modular monolith, module nghiệp vụ, migration, CI','Review PR, build/test thành công; thay đổi schema có migration; tài liệu/cấu hình cập nhật.'),
('Tính linh hoạt','Docker Compose và cấu hình theo môi trường','Khởi động lại từ cấu hình được quản lý; kiểm tra health, migration và rollback.')
],[3.1,5.2,7.7],11)
p('Các mục tiêu số như 100 người dùng đồng thời, uptime tháng 99,5% và thời gian làm quen 15 phút cần được nhóm xác nhận phạm vi và phương pháp đo. Performance smoke trong repository đo tìm kiếm cục bộ với 40 request, concurrency 8; không chứng minh tải 100 người dùng hay uptime production. Access token 30 phút là thời gian sống token, không đồng nghĩa phiên tự hết hạn sau 30 phút không hoạt động; yêu cầu inactivity timeout cần được chốt riêng trước nghiệm thu.')

h('2. Phạm vi SQA')
p('SQA bao phủ xác minh (verification) các sản phẩm trung gian và thẩm định (validation) hành vi hệ thống qua kiểm thử, nghiệm thu và triển khai. Kế hoạch theo các mốc T1–T12 của VIRA-SDP-01; ngày cụ thể được lập baseline khi kế hoạch dự án được phê duyệt.')
table('Bảng 3. Phạm vi xác minh và thẩm định theo pha',['Pha','Xác minh (Verification)','Thẩm định (Validation)'],[
('Khởi động và lập kế hoạch','Rà soát phạm vi, vai trò, rủi ro, cấu hình và tài liệu kế hoạch.','Xác nhận mục tiêu chất lượng, người dùng đại diện và tiêu chí nghiệm thu.'),
('Phân tích yêu cầu','Kiểm tra đầy đủ, nhất quán, truy vết, đo lường được của SRS/NFR.','Review kịch bản nghiệp vụ với đại diện Owner, Admin, Member.'),
('Thiết kế','Rà soát kiến trúc, API, dữ liệu, JWT/RBAC, version, upload, migration.','Kiểm tra thiết kế đáp ứng luồng workspace → project → task và yêu cầu chất lượng.'),
('Hiện thực','Review mã/PR, migration, cấu hình, unit test, build và checklist bảo mật.','Kiểm thử module thay đổi và hồi quy phần bị ảnh hưởng.'),
('Tích hợp và hệ thống','Rà soát test case, môi trường, dữ liệu, log, defect và báo cáo.','Chạy integration, E2E, bảo mật, hiệu năng, tương thích, backup/restore.'),
('Nghiệm thu và bàn giao','Kiểm tra báo cáo, hướng dẫn, phiên bản, release tag và checklist.','Chạy UAT, xác nhận kết quả với tiêu chí đã duyệt.'),
('Bảo trì','Đánh giá thay đổi, nguyên nhân lỗi, tác động và hồ sơ bản vá.','Kiểm tra bản sửa, hồi quy và theo dõi sau triển khai.')
],[3,6.5,6.5],11)

h('3. Đối tượng SQA')
p('Các đối tượng quản lý chất lượng và cấu hình (Configuration Items) gồm:')
for x in ['Yêu cầu và thiết kế: SRS, tiêu chí ISO/IEC 25010, kiến trúc modular monolith, API và mô hình dữ liệu.','Mã nguồn frontend React/Vite và backend Java 21/Spring Boot; quy tắc review, build và dependency.','Database schema và Flyway migration V1–V15; dữ liệu seed và cấu hình MySQL 8.4, Redis 7.4, Mailpit.','Module auth/user, workspace, project/member/team, task, board, sprint, comment, attachment, bug, label, notification, report và audit.','Test plan, test cases, unit/service tests, Playwright E2E, performance smoke, kết quả CI, defect và báo cáo.','Cấu hình môi trường, Docker Compose, image/release tag, tài liệu vận hành, backup/restore và gói bàn giao.','Dữ liệu kiểm thử và bằng chứng: chỉ dùng dữ liệu giả lập; không đưa mật khẩu thật, token hoặc dữ liệu production vào báo cáo.']: bullet(x)

h('4. Loại kiểm thử sẽ thực hiện')
table('Bảng 4. Loại kiểm thử và áp dụng cho Vira',['Loại kiểm thử','Phạm vi và cách thực hiện','Điều kiện hoàn thành'],[
('Review tài liệu/thiết kế/code','Checklist yêu cầu, quyền, API, migration, pull request và tài liệu.','Phát hiện có người nhận xử lý, hạn và kết luận review.'),
('Unit','JUnit 5/Mockito cho auth, quyền, task, sprint, rate limiter và nghiệp vụ.','Test liên quan thay đổi chạy đạt; lỗi được phân loại.'),
('Tích hợp','Spring Boot, JPA/MySQL, Flyway, JWT/security, Redis, mail và upload.','API, transaction và lỗi đúng; không lộ dữ liệu ngoài phạm vi.'),
('Hệ thống và hồi quy','Playwright Chromium desktop/mobile; auth, lifecycle, roles, platform-flow.','Test ưu tiên và hồi quy bị ảnh hưởng đạt trên build xác định.'),
('Bảo mật','RBAC/IDOR, token, validation/input, rate limit, upload, secrets/config.','Không còn lỗ hổng nghiêm trọng mở; rủi ro còn lại được ghi nhận.'),
('Hiệu năng','Performance smoke; kịch bản mục tiêu mở rộng định nghĩa trong TestPlan.','Báo cáo p50/p95/max, lỗi, tải, máy, dữ liệu; đối chiếu ngưỡng duyệt.'),
('Tương thích và khả dụng','Responsive; trình duyệt/viewport được chốt; người dùng thử tác vụ.','Smoke đạt; usability có mẫu, kịch bản và biên bản.'),
('Cài đặt, khôi phục, phát hành','Docker Compose, health endpoint, Flyway, backup MySQL/uploads, rollback.','Khởi động và phục hồi thử thành công; checklist được ký.'),
('UAT','Kịch bản auth, workspace/project, role, task, board/sprint, cộng tác, file/report.','Người đại diện chấp thuận hoặc ghi ngoại lệ và điều kiện xử lý.')
],[3,8,5],10.5)
p('Phương pháp: hộp đen theo yêu cầu và API/UI; hộp trắng khi review logic, unit test và nhánh xử lý. E2E hiện có gồm auth, lifecycle, roles và platform-flow. CI chạy Maven test, build frontend, Docker services và E2E Chromium/mobile; độ phủ từng yêu cầu phải được đối chiếu ma trận, không suy ra chỉ từ pipeline xanh.')

h('5. Phân công vai trò')
p('Nhóm dự án cần điền họ tên cụ thể trước cổng T1. Người viết tính năng không tự phê duyệt kết quả nghiệm thu của chính thay đổi đó; QA ghi nhận ý kiến độc lập và chuyển bất đồng lên chủ dự án.')
table('Bảng 5. Ma trận trách nhiệm SQA',['Hoạt động','Chủ dự án','Quản lý dự án','BA','Dev/kiến trúc','QA/SQA','Triển khai'],[
('Duyệt kế hoạch, tiêu chí, baseline','A','R','C','C','C','I'),('Review yêu cầu và truy vết','I','C','A/R','C','R','I'),('Review thiết kế, code, migration','I','C','C','A/R','R','C'),('Thiết kế và chạy unit/integration','I','C','I','R','A/R','I'),('E2E, bảo mật, hiệu năng, UAT','A','C','C','C','R','C'),('Phân loại và sửa lỗi','I','A','C','R','R','C'),('Quản lý cấu hình và bằng chứng','I','A','I','R','R','R'),('Chấp nhận ngoại lệ/phát hành','A','R','C','C','C','R'),('Báo cáo chất lượng','I','C','C','C','A/R','I')
],[4.2,1.7,2,1.2,2.3,1.7,1.8],10)
p('Ký hiệu: R — thực hiện; A — chịu trách nhiệm/phê duyệt; C — được tham vấn; I — được thông báo. Mỗi dòng chỉ có một A. Chức danh/người cụ thể được ghi trong Bảng 1 và biên bản phân công.')

h('6. Lịch biểu')
p('Lịch đồng bộ với T1–T12 của VIRA-SDP-01. Nhóm chốt ngày bắt đầu/kết thúc và người phụ trách theo lịch thực tế; không dùng ngày minh họa từ PDF mẫu.')
table('Bảng 6. Lịch hoạt động SQA theo mốc dự án',['Mốc','Hoạt động chính','Sản phẩm / cổng chất lượng'],[
('T1','Khởi động, duyệt SQA Plan, vai trò, phạm vi, rủi ro, công cụ.','SQAPlan baseline; phân công; tiêu chí đo được duyệt.'),('T2–T3','Review yêu cầu, ISO 25010, truy vết và phạm vi UAT.','SRS baseline; RequirementsReviewChecklist; ma trận yêu cầu–test.'),('T4–T5','Review kiến trúc, API, bảo mật, dữ liệu, migration và test plan.','SoftwareDesign baseline; DesignReviewChecklist; TestPlan dự thảo.'),('T6–T8','Review PR, unit test, migration, coding/security checklist, CI.','Mã đã review; kết quả Maven/frontend build; log CI và defect.'),('T9–T10','Integration/system/E2E, hồi quy, bảo mật, hiệu năng, tương thích.','TestCases; DefectReport; QualityMetrics; TestSummaryReport dự thảo.'),('T11','UAT, release, backup/restore, health, hướng dẫn và phê duyệt.','Biên bản UAT; ReleaseDeploymentChecklist; quyết định phát hành.'),('T12','Theo dõi sự cố, sửa lỗi, test bản vá và tổng kết.','MaintenanceLog; regression evidence; báo cáo đóng SQA.')
],[2,7.4,6.6],11)

h('7. Môi trường SQA')
h('7.1. Môi trường phát triển',2)
p('Frontend: React 19, Vite, Node.js 20+, npm và Playwright. Backend: Java 21, Spring Boot 3.5, Maven Wrapper, Spring Security/JPA. Mã nguồn được quản lý bằng Git. Lập trình viên chạy unit test, build và review pull request trước khi hợp nhất.')
h('7.2. Môi trường kiểm thử',2)
p('Local/CI dùng Docker Compose cho API, MySQL 8.4, Mailpit và Redis; API cổng 8080, frontend dev cổng 5173, MySQL host port 3307, Mailpit UI cổng 8025. Health check tại /api/v1/actuator/health. Cấu hình kiểm thử phải được ghi cùng build và không dùng dữ liệu production.')
h('7.3. Staging',2)
p('Repository hiện chưa xác nhận môi trường staging độc lập. Trước production, quản lý dự án xác định có staging hay không và ghi cấu hình/nguồn dữ liệu; nếu chưa có thì diễn tập trên môi trường tiền sản xuất tách biệt, không gọi local là staging.')
h('7.4. Production',2)
p('Production chỉ được kiểm tra theo quyền đã duyệt và không chạy dữ liệu tải hoặc dữ liệu phá hoại. UAT, load, security và restore chạy trên môi trường riêng. Quyết định release kèm health check, phiên bản, migration, backup và kế hoạch rollback.')
h('7.5. Công cụ hỗ trợ SQA',2)
table('Bảng 7. Công cụ và mục đích sử dụng',['Công cụ','Mục đích / bằng chứng'],[
('Git và GitHub Actions','Version control, PR, CI, log build/test và artifact Playwright.'),('Maven Wrapper, JUnit 5, Mockito, JaCoCo','Unit/service tests và coverage; gate hiện tại 5% là baseline, không đại diện mục tiêu cuối.'),('npm, Vite, Playwright','Cài dependency, production build, E2E Chromium và mobile-chrome.'),('Docker Compose, MySQL, Redis, Mailpit','Tạo môi trường API, DB, cache/rate-limit và email kiểm thử.'),('scripts/performance-smoke.mjs','Đo search smoke; mặc định 40 request, concurrency 8, ngưỡng script p95 2 giây.'),('Microsoft Word / Excel','SQA Plan, checklist, traceability, test case và báo cáo theo phiên bản.'),('Công cụ security/load bổ sung','Chỉ baseline sau khi nhóm chọn công cụ, phiên bản, cấu hình và cách lưu báo cáo.')
],[4.5,11.5],11)

h('8. Dữ liệu SQA')
p('Dữ liệu kiểm thử phải giả lập, tái tạo được và được làm sạch sau khi chạy. Tài khoản demo có thể dùng trong local/CI cô lập; không sao chép mật khẩu, token, email cá nhân hoặc tệp production vào artifact báo cáo.')
h('8.1. Dữ liệu chức năng và tích hợp',2)
for x in ['Người dùng và workspace/project: Owner, Admin, Member, người ngoài dự án; membership hợp lệ và đã bị gỡ.','Task/subtask: nhiều trạng thái, loại, ưu tiên, deadline, story point, nhãn, sprint, assignee/watchers, liên kết và version.','Board/Sprint: cột WIP, vị trí kéo-thả, sprint dự thảo/đang chạy/hoàn tất.','Cộng tác: comment, reply/pin, attachment hợp lệ/không hợp lệ, bug severity, notification, audit, report.','Database: dữ liệu trước/sau migration; rỗng, biên, trùng khóa, tham chiếu sai, xóa mềm/khôi phục.']: bullet(x)
h('8.2. Dữ liệu hợp lệ, biên và không hợp lệ',2)
table('Bảng 8. Nhóm dữ liệu và mục tiêu kiểm tra',['Nhóm dữ liệu','Ví dụ','Mục tiêu kiểm tra'],[
('Hợp lệ','Email đúng; thành viên active; task có status/priority hợp lệ; file đúng giới hạn.','Tạo, đọc, cập nhật, phân công và lưu trữ đúng.'),('Biên','Chuỗi rỗng/tối đa; ngày Sprint; version hiện tại; file sát giới hạn.','Kiểm tra ranh giới, quy tắc bắt buộc và thông báo.'),('Không hợp lệ','Email sai, trường bắt buộc null, ngày Sprint ngược, member ngoài project, file sai loại.','Validation, mã lỗi, không ghi dữ liệu sai.'),('Xung đột','Hai cập nhật cùng task dùng cùng version; membership bị thu hồi.','Không ghi đè im lặng; kiểm tra lại quyền và tính nhất quán.'),('Bảo mật','Truy cập ID project khác, token hết hạn, payload HTML/SQL, secrets.','Không vượt quyền, thực thi input, hoặc lộ token/secret.')
],[3,6.5,6.5],11)
h('8.3. Dữ liệu hiệu năng',2)
p('TestPlan ghi số lượng workspace/project/task, phân bố trạng thái/assignee, kích thước tệp, tỉ lệ đọc/ghi, concurrency, ramp-up, thời lượng, cấu hình máy và build. Script hiện có tạo project và tìm kiếm task; chỉ phù hợp smoke. Cần bổ sung dữ liệu gần tải dự kiến trước khi kết luận mục tiêu 100 người dùng.')
h('8.4. Dữ liệu bảo mật và phục hồi',2)
p('Tạo principal theo role và project độc lập để thử IDOR/RBAC; token hợp lệ, sai, hết hạn và refresh; input độc hại; rate limit; loại/kích thước upload. Dùng DB/uploads giả lập để diễn tập backup/restore, quan hệ DB–tệp và quyền sau phục hồi.')
h('8.5. Bảo vệ và lưu dữ liệu test',2)
p('Dữ liệu đặt trong môi trường riêng, hạn chế quyền, che thông tin định danh trong báo cáo và xóa theo quy trình. Lưu test data/hướng dẫn tạo cùng phiên bản; không đưa secret vào Git hay tài liệu.')

h('9. Tài liệu, tiêu chuẩn và checklist')
p('ISO/IEC 25010 là khung chất lượng sản phẩm theo yêu cầu đề tài; tài liệu này không tuyên bố chứng nhận phù hợp. Hồ sơ cần quản lý phiên bản gồm Project/SQA Plan, SRS, Software Design, TestPlan, TestCases, traceability matrix, checklist review, DefectReport, QualityMetrics, TestSummaryReport, hướng dẫn triển khai/người dùng và MaintenanceLog.')
table('Bảng 9. Hồ sơ và checklist chất lượng',['Hồ sơ / checklist','Mốc áp dụng','Nội dung chính'],[
('RequirementsReviewChecklist','T3','Đầy đủ, nhất quán, rõ, đo được và truy vết.'),('DesignReviewChecklist','T5','Kiến trúc, API, quyền, dữ liệu, version, migration, testability.'),('CodingChecklist / SecurityChecklist','T6–T8 và khi đổi','Review PR, validation, secrets, auth, upload, logging, test, migration.'),('TestCaseReviewChecklist','Trước T9','Bao phủ yêu cầu, dữ liệu, bước, expected, negative case, bằng chứng.'),('TestingCompletionChecklist','T10','Test chạy, lỗi mở, số liệu, phạm vi, ngoại lệ và kết luận.'),('ReleaseDeploymentChecklist','T11','Tag/build, config, backup, migration, rollback, health, tài liệu.'),('MaintenanceLog','T12 và mỗi bản vá','Sự cố, nguyên nhân, thay đổi, hồi quy, owner và kết quả.')
],[5,2.4,8.6],11)

h('10. Báo cáo lỗi và hành động khắc phục')
p('Mỗi lỗi có ID, tiêu đề, severity, priority, build/commit, môi trường, bước tái hiện, kết quả mong đợi/thực tế, bằng chứng, người phụ trách, ngày phát hiện, hạn, trạng thái và liên kết yêu cầu/test. Severity: Blocker/Critical (chặn phát hành hoặc làm lộ/mất dữ liệu), High (chức năng cốt lõi/quyền sai, không có workaround phù hợp), Medium (ảnh hưởng chức năng có workaround), Low (hiển thị/nội dung nhỏ).')
p('Luồng xử lý: New → Triage → Assigned → Fixed → Retest → Closed. Retest thất bại thì trở lại Assigned; không tái hiện thì ghi điều kiện và bằng chứng để triage. QA tổng hợp xu hướng theo mức, module, thời gian mở và lỗi tái phát; Blocker/Critical mở chặn cổng.')
p('Lỗi thấp hơn chỉ được hoãn nếu có đánh giá tác động, biện pháp giảm thiểu, người chịu trách nhiệm, hạn sửa và duyệt ngoại lệ. Bất đồng được review bằng chứng; PM điều phối, chủ dự án quyết định ngoại lệ phát hành; lưu trong TestSummaryReport.')

h('11. Quản lý cấu hình và hồ sơ')
for x in ['Git là nguồn kiểm soát source, migration, cấu hình mẫu, script và tài liệu dạng văn bản; mỗi release có tag/commit xác định.','Mỗi tài liệu dùng tên không dấu, các từ ngăn bằng gạch ngang; ghi tên tài liệu, phiên bản, ngày cập nhật và người thực hiện. Lưu lịch sử review/phê duyệt.','Bản build, migration, cấu hình môi trường và kết quả test liên kết với cùng commit/tag để lặp lại.','Lưu checklist, log CI, test report, defect, bằng chứng, biên bản review/UAT và quyết định ngoại lệ theo release; giới hạn quyền truy cập.','Chủ dự án chốt thời hạn và nơi lưu chính thức trước phát hành; secret, .env thật và token không đưa vào kho mã.']: bullet(x)

h('12. Rủi ro và phương án ứng phó')
table('Bảng 10. Rủi ro chất lượng ưu tiên',['Mã','Rủi ro','Mức','Ứng phó / bằng chứng','Chủ trì'],[
('R01','Sai phân quyền hoặc truy cập chéo dữ liệu project (IDOR).','Cao','Ma trận role × endpoint; E2E/integration; review authorization; chặn release nếu lỗi nghiêm trọng mở.','Dev + QA'),('R02','Concurrent update ghi đè task hoặc sắp xếp sai vị trí.','Cao','Test version conflict, reorder và rollback; kiểm tra response và dữ liệu sau chạy.','Dev + QA'),('R03','Lệch giữa ngưỡng yêu cầu và phép đo hiệu năng.','Cao','Chốt protocol, data, thời lượng, hạ tầng; local smoke không đại diện SLA.','PM + QA'),('R04','Migration hoặc backup/restore làm mất dữ liệu/tệp.','Cao','Test migration từ baseline; backup DB+uploads; diễn tập restore/health.','Dev + Triển khai'),('R05','Hiểu timeout JWT là hết hạn do không hoạt động.','Trung bình','BA/kiến trúc chốt chính sách; cập nhật SRS/TestPlan; nghiệm thu theo thiết kế duyệt.','BA + Kiến trúc'),('R06','Coverage CI baseline thấp, test không phủ yêu cầu.','Cao','Theo dõi traceability; bổ sung test rủi ro; tách gate 5% khỏi mục tiêu coverage cuối.','QA + Dev'),('R07','Staging, UAT owner hoặc lịch chưa xác định.','Trung bình','Chốt người phụ trách, môi trường, lịch tại T1/T9; yêu cầu biên bản UAT.','PM'),('R08','Lộ dữ liệu nhạy cảm trong fixture, log, report hoặc config.','Cao','Dữ liệu giả lập, rà secrets, giới hạn quyền, làm sạch artifact và kiểm tra log.','Dev + QA')
],[1,4.1,1.5,7.8,1.6],10)
p('QA/PM rà soát rủi ro hàng tuần trong giai đoạn test và khi thay đổi phạm vi, thiết kế hoặc môi trường. Chủ trì cập nhật xác suất, tác động, trạng thái, hạn và bằng chứng đóng.')

h('13. Đào tạo và truyền thông')
p('Trước test, nhóm thống nhất cách viết test case, severity/priority, triage, bằng chứng, bảo vệ dữ liệu và chạy CI/E2E. Trước release, người triển khai diễn tập health check, migration, backup/restore và rollback. Kết quả/người tham dự được ghi trong biên bản hoặc log dự án.')

h('14. Điều kiện bắt đầu và kết thúc kiểm thử')
table('Bảng 11. Entry criteria và exit criteria',['Giai đoạn','Điều kiện'],[
('Entry — bắt đầu một vòng test','Yêu cầu/phạm vi build xác định; test plan/case được review; môi trường/dữ liệu sẵn sàng; build/commit nhận diện được; người chạy được phân công; lỗi đã biết được công bố.'),('Exit — kết thúc một vòng test','100% test ưu tiên trong phạm vi được chạy hoặc có lý do duyệt; lỗi có trạng thái/owner; không còn Blocker/Critical mở; ngưỡng được đối chiếu; bằng chứng và báo cáo được lưu.'),('Exit — nghiệm thu/phát hành','UAT và release checklist được ký; migration, health, backup/restore/rollback được xác nhận theo phạm vi; traceability hoàn tất; ngoại lệ có quyết định/hạn; không đánh dấu đạt chỉ số chưa đo.')
],[4,12],11)
p('Báo cáo pass rate theo ưu tiên/module; không dùng tỷ lệ tùy ý để bỏ qua lỗi nghiêm trọng. Blocked, skipped và chưa chạy phải tách khỏi pass/fail.')

h('15. Chỉ số theo dõi chất lượng')
table('Bảng 12. Chỉ số SQA và cách tính',['Chỉ số','Cách tính / đơn vị','Nguồn và tần suất'],[
('Độ phủ yêu cầu','Yêu cầu có ≥1 test / tổng yêu cầu trong phạm vi × 100%.','Traceability; mỗi cổng T3/T9/T10.'),('Tỷ lệ thực thi','Test đã chạy / tổng test dự kiến trong phạm vi × 100%.','TestCases; mỗi vòng.'),('Tỷ lệ pass','Test pass / test đã thực thi, không tính blocked/skipped × 100%.','Test result; theo build/vòng.'),('Lỗi mở theo mức','Số Blocker/Critical/High/Medium/Low chưa đóng.','DefectReport; liên tục và tổng hợp tuần.'),('Thời gian xử lý lỗi','Trung vị New → Closed, phân theo severity.','Defect timestamps; mỗi vòng/release.'),('Lỗi hồi quy','Lỗi đã đóng tái xuất hiện / lỗi đóng × 100%.','DefectReport; mỗi release.'),('Coverage code','Line/branch coverage theo JaCoCo và module.','CI artifact; gate hiện tại 5% chỉ là baseline.'),('Hiệu năng','p50/p95/max, lỗi, throughput theo tải.','Performance report; mỗi lần đo kèm cấu hình.'),('Uptime','Thời gian sẵn sàng / tổng thời gian đo × 100%.','Production theo tháng; hiện chưa có kết quả vận hành.'),('UAT','Tác vụ hoàn tất / tác vụ thử; lỗi và phản hồi.','Biên bản UAT; trước nghiệm thu.')
],[3.1,6.4,6.5],10.5)
p('QA phát hành báo cáo trạng thái tối thiểu hàng tuần trong T9–T11 và tại mỗi cổng: build, môi trường, phạm vi, pass/fail/blocked, lỗi mở, độ phủ, hiệu năng, rủi ro, ngoại lệ và quyết định cần thiết.')

h('16. Điều kiện kết thúc hoạt động SQA')
p('Đợt SQA kết thúc khi các cổng có biên bản; traceability và hồ sơ test đầy đủ; luồng UAT ưu tiên được chấp thuận; không còn Blocker/Critical mở; checklist triển khai và tài liệu bàn giao được rà soát; kết quả từng tiêu chí ISO/IEC 25010 có bằng chứng hoặc ghi “chưa xác nhận” kèm kế hoạch đo, người phụ trách và quyết định ngoại lệ. QA tổng kết bài học và bàn giao rủi ro còn lại cho chủ dự án.')

h('17. Tài liệu tham khảo')
for x in ['ISO/IEC 25010 — Mô hình chất lượng sản phẩm phần mềm; áp dụng làm khung thuộc tính chất lượng theo yêu cầu dự án.','SQAPlan mẫu PDF Mau_SQAPlan_ThamKhao.docx.pdf — tham khảo cấu trúc; ví dụ nopCommerce, nhân sự, dữ liệu, ngày tháng không áp dụng cho Vira.','Tài liệu Vira: AGENTS.md, README.md, DAC_TA_VIRA.md, BAO_CAO_TIEN_DO.md, backend/API.md, package.json, backend/pom.xml, .github/workflows/ci.yml và test trong e2e/ và backend/src/test/.','Kế hoạch phát triển Vira VIRA-SDP-01 v1.0 — tham chiếu mốc T1–T12; cần đồng bộ khi baseline thay đổi.']:
    para=doc.add_paragraph(); para.paragraph_format.line_spacing=1.5; para.add_run(x)

for para in doc.paragraphs:
    if para.style and para.style.name.startswith('Heading'): para.paragraph_format.keep_with_next=True
    for run in para.runs:
        if run.font.name is None: run.font.name='Times New Roman'
        run._element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'),'Times New Roman')
doc.core_properties.title='Kế hoạch đảm bảo chất lượng phần mềm Vira'
doc.core_properties.subject='SQA Plan theo ISO/IEC 25010'
doc.core_properties.author='Nhóm dự án Vira'
doc.core_properties.keywords='Vira, SQA, ISO/IEC 25010, Quality Assurance'
upd=OxmlElement('w:updateFields'); upd.set(qn('w:val'),'true'); doc.settings._element.append(upd)
doc.save(src)
print('SAVED',src,'paragraphs',len(doc.paragraphs),'tables',len(doc.tables))
