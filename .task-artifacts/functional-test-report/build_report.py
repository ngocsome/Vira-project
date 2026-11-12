from pathlib import Path
from shutil import copy2
from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(r"C:\Users\ADMIN\OneDrive\Desktop\Vira-project")
SOURCE = ROOT / "Bao-cao-ca-nhan-Vira-hoan-chinh.docx"
OUTPUT = ROOT / "Bao-cao-ca-nhan-Vira-Nguyen-Van-Phu.docx"
copy2(SOURCE, OUTPUT)
doc = Document(OUTPUT)

def set_text(p, value):
    runs = p.runs
    if runs:
        runs[0].text = value
        for run in runs[1:]:
            run._element.getparent().remove(run._element)
    else:
        p.add_run(value)

def find_para(prefix):
    for p in doc.paragraphs:
        if p.text.strip().startswith(prefix):
            return p
    raise ValueError(f"Could not find paragraph: {prefix}")

def style_run(run, size=10, bold=None):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    rfonts.set(qn("w:ascii"), "Times New Roman")
    rfonts.set(qn("w:hAnsi"), "Times New Roman")
    rfonts.set(qn("w:eastAsia"), "Times New Roman")
    if bold is not None:
        run.bold = bold

def add_before(anchor, text, style="Normal", bold=False, align=None, line=1.5, indent=1, keep=False):
    p = doc.add_paragraph(style=style)
    r = p.add_run(text)
    style_run(r, size=14, bold=bold)
    p.paragraph_format.first_line_indent = Cm(indent)
    p.paragraph_format.line_spacing = line
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    if keep:
        p.paragraph_format.keep_with_next = True
    if align is not None:
        p.alignment = align
    p._p.getparent().remove(p._p)
    anchor._p.addprevious(p._p)
    return p

def heading(anchor, text, level=2):
    return add_before(anchor, text, style=f"Heading {level}", bold=True, indent=0, keep=True)

def cell_margins(cell):
    tcpr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for side, val in [("top", 55), ("start", 70), ("bottom", 55), ("end", 70)]:
        el = OxmlElement(f"w:{side}")
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tcpr.append(mar)

def add_table_before(anchor, caption, headers, rows, widths):
    cp = add_before(anchor, caption, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, indent=0, keep=True)
    cp.paragraph_format.space_before = Pt(5)
    cp.paragraph_format.space_after = Pt(2)
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.style = "Table Grid"
    for j, value in enumerate(headers):
        cell = table.rows[0].cells[j]
        cell.width = Cm(widths[j])
        cell.text = value
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        cell_margins(cell)
        shade = OxmlElement("w:shd")
        shade.set(qn("w:fill"), "D9E2F3")
        cell._tc.get_or_add_tcPr().append(shade)
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.first_line_indent = Cm(0)
            p.paragraph_format.line_spacing = 1.05
            p.paragraph_format.space_after = Pt(0)
            for run in p.runs:
                style_run(run, 10, True)
    trpr = table.rows[0]._tr.get_or_add_trPr()
    repeat = OxmlElement("w:tblHeader")
    repeat.set(qn("w:val"), "true")
    trpr.append(repeat)
    for row in rows:
        cells = table.add_row().cells
        for j, value in enumerate(row):
            cell = cells[j]
            cell.width = Cm(widths[j])
            cell.text = str(value)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            cell_margins(cell)
            for p in cell.paragraphs:
                p.paragraph_format.first_line_indent = Cm(0)
                p.paragraph_format.line_spacing = 1.05
                p.paragraph_format.space_after = Pt(0)
                for run in p.runs:
                    style_run(run, 10)
        trpr = table.rows[-1]._tr.get_or_add_trPr()
        trpr.append(OxmlElement("w:cantSplit"))
    table._tbl.getparent().remove(table._tbl)
    anchor._p.addprevious(table._tbl)
    return table

# Cover page and opening: the retained report is the visual template, while the
# previous student's identity and code-review content are replaced.
cover = {
    "Thiết lập và vận dụng hệ thống đảm bảo chất lượng phần mềm\ntrọng tâm rà soát mã nguồn": "Thiết lập và vận dụng hệ thống đảm bảo chất lượng phần mềm\ntrọng tâm kiểm thử chức năng",
    "Sinh viên: Trần Đức Ngọc": "Sinh viên: Nguyễn Văn Phú",
    "Mã sinh viên: 2023602056": "Mã sinh viên: 2023603379",
    "Số thứ tự: 045        Mã đề: TX2-10_11_12-045": "Số thứ tự: 046        Mã đề: TX2-10_11_12-046",
    "Nhiệm vụ cá nhân: Rà soát mã nguồn; tập trung vào coding standards, tính bảo trì và phân quyền.": "Nhiệm vụ cá nhân: Thiết lập và vận dụng SQA cho hoạt động kiểm thử chức năng; tập trung vào thiết kế ca kiểm thử, dữ liệu kiểm thử và tiêu chí Pass/Fail.",
}
for old, new in cover.items():
    set_text(find_para(old), new)

opening = [
    "Kiểm thử chức năng cung cấp bằng chứng về việc phần mềm đáp ứng yêu cầu và quy tắc nghiệp vụ trong các tình huống sử dụng cụ thể. Để kết quả có thể đánh giá và lặp lại, mỗi ca kiểm thử cần nêu mục tiêu, điều kiện trước, dữ liệu đầu vào, bước thực hiện, kết quả mong đợi, kết quả thực tế và minh chứng.",
    "Vira là ứng dụng web hỗ trợ quản lý dự án và cộng tác công việc theo cấu trúc Workspace – Project – Task/Subtask. Hệ thống có các luồng đăng nhập, quản lý dự án, Kanban, Sprint, phân công, bình luận, đính kèm, thông báo và phân quyền. Các luồng này tạo cơ sở thực tế để thiết kế ca kiểm thử theo vai trò, dữ liệu hợp lệ/không hợp lệ và trạng thái công việc.",
    "Báo cáo cá nhân này thiết lập và vận dụng hoạt động SQA cho nhiệm vụ kiểm thử chức năng. Waterfall được chọn làm mô hình tham chiếu cho các điểm kiểm soát từ yêu cầu đến thực thi và nghiệm thu; ISO/IEC 25010 được dùng để xác định mục tiêu chất lượng phù hợp. Báo cáo phân biệt rõ thiết kế ca kiểm thử với kết quả chạy thực tế.",
    "Nội dung gồm lựa chọn mô hình và tiêu chuẩn; thiết lập tiêu chuẩn tài liệu SQA; xây dựng quy trình kiểm thử chức năng; và lập checklist áp dụng cho Vira. Checklist liên kết 25 tình huống với dữ liệu, kết quả mong đợi và kịch bản E2E có sẵn trong dự án. Các kịch bản được dùng làm căn cứ thiết kế; báo cáo không khẳng định chúng đã chạy thành công.",
]
for i, value in enumerate(opening, start=13):
    set_text(doc.paragraphs[i], value)

abbreviations = [
    "API — Giao diện lập trình ứng dụng (Application Programming Interface)",
    "E2E — Kiểm thử đầu cuối (End-to-End Testing)",
    "ISO/IEC — Tổ chức Tiêu chuẩn hóa Quốc tế / Ủy ban Kỹ thuật Điện Quốc tế",
    "SQA — Đảm bảo chất lượng phần mềm (Software Quality Assurance)",
    "TC — Ca kiểm thử (Test Case)",
    "UAT — Kiểm thử chấp nhận người dùng (User Acceptance Testing)",
    "UI — Giao diện người dùng (User Interface)",
]
for i, value in enumerate(abbreviations, start=18):
    set_text(doc.paragraphs[i], value)

# Manual contents: retain the template's font, leader dots, indent and tab system.
toc_start = next(i for i, p in enumerate(doc.paragraphs) if p.text.strip() == "MỤC LỤC") + 1
section1_index = next(i for i, p in enumerate(doc.paragraphs) if p.text.strip().startswith("1. LỰA CHỌN MÔ HÌNH"))
toc_paras = [p for p in doc.paragraphs[toc_start:section1_index] if "\t" in p.text]
toc_items = [
    ("Lời mở đầu", 0), ("Danh mục từ viết tắt", 0),
    ("1. Lựa chọn mô hình phát triển và tiêu chuẩn chất lượng", 0),
    ("1.1. Phạm vi và mục tiêu lựa chọn", 1), ("1.2. Mô hình Waterfall", 1),
    ("1.3. ISO/IEC 25010 và đặc tính chất lượng", 1), ("1.4. Kết luận phần 1", 1),
    ("2. Thiết lập bộ tiêu chuẩn tài liệu SQA", 0),
    ("2.1. Mục đích và phạm vi áp dụng", 1), ("2.2. Cấu trúc chung của tài liệu SQA", 1),
    ("2.3. Mã, tên và danh mục tài liệu", 1), ("2.4. Quản lý phiên bản", 1),
    ("2.5. Người soạn, người rà soát và người phê duyệt", 1),
    ("2.6. Nội dung và bảo mật", 1), ("2.7. Lưu trữ và truy vết", 1), ("2.8. Kết luận phần 2", 1),
    ("3. Quy trình SQA phục vụ kiểm thử chức năng", 0),
    ("3.1. Mục tiêu và phạm vi", 1), ("3.2. Vai trò và đầu vào", 1),
    ("3.3. Thiết kế ca kiểm thử và dữ liệu", 1), ("3.4. Trình tự thực hiện", 1),
    ("3.5. Trạng thái, chấp nhận và kết thúc", 1), ("3.6. Đầu ra và minh chứng", 1),
    ("3.7. Giới hạn kiểm thử cá nhân", 1), ("3.8. Kết luận phần 3", 1),
    ("4. Checklist kiểm thử chức năng áp dụng cho Vira", 0),
    ("4.1. Phạm vi, dữ liệu và quy ước đánh giá", 1),
    ("4.2. Tài khoản, Workspace và Project", 1),
    ("4.3. Task và quy tắc nghiệp vụ", 1),
    ("4.4. Cộng tác, giao diện và vòng đời", 1),
    ("4.5. Tổng hợp trạng thái lần lập báo cáo", 1),
    ("4.6. Xử lý lỗi và lưu minh chứng", 1),
    ("4.7. Kết luận phần 4", 1),
    ("Kết luận", 0), ("Tài liệu tham khảo", 0),
]
for idx, (label, level) in enumerate(toc_items):
    if idx < len(toc_paras):
        p = toc_paras[idx]
    else:
        p = doc.add_paragraph()
        p._p.getparent().remove(p._p)
        toc_paras[-1]._p.addnext(p._p)
        toc_paras.append(p)
    set_text(p, label + "\t00")
    p.paragraph_format.left_indent = Cm(0.6 * level)
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.tab_stops.clear_all()
    p.paragraph_format.tab_stops.add_tab_stop(Cm(15.2), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
    for r in p.runs:
        style_run(r, 11, level == 0)
for p in toc_paras[len(toc_items):]:
    p._p.getparent().remove(p._p)

# Replace the source-code-review rationale in section 1 with functional-testing rationale.
replacements = {
    "Vira là ứng dụng web quản lý dự án và cộng tác công việc theo cấu trúc Workspace": "Vira là ứng dụng web quản lý dự án và cộng tác công việc theo cấu trúc Workspace",
    "Trong phạm vi cá nhân, mục tiêu là xây dựng cách rà soát có căn cứ, tiêu chí và hồ sơ để kiểm tra phần mã nguồn được giao. Báo cáo ưu tiên các nội dung nêu trong đề bài: coding standards, khả năng bảo trì và phân quyền. Kết luận chỉ áp dụng cho module, file và phiên bản mã nguồn thực sự được kiểm tra.": "Trong phạm vi cá nhân, mục tiêu là xây dựng cách kiểm thử chức năng có thể lặp lại và truy vết từ yêu cầu đến ca kiểm thử, dữ liệu, kết quả và minh chứng. Trọng tâm là thiết kế ca kiểm thử, chọn dữ liệu đại diện, kiểm tra kết quả mong đợi và ghi Pass/Fail/Không áp dụng sau khi thực thi. Kết luận chỉ áp dụng cho luồng và môi trường đã kiểm tra.",
    "Waterfall được lựa chọn làm mô hình tham chiếu vì giúp xác định thời điểm và đầu ra của hoạt động rà soát. Điểm kiểm soát chính được đặt sau khi mã nguồn của phạm vi được giao đã được lập trình và trước khi chuyển sang kiểm thử. Người thực hiện đối chiếu mã nguồn với yêu cầu, thiết kế liên quan, quy ước lập trình và quy tắc nghiệp vụ đã xác định.": "Waterfall được chọn làm mô hình tham chiếu vì các giai đoạn và đầu ra tuần tự tạo điểm kiểm soát rõ ràng cho kiểm thử chức năng. Yêu cầu và tiêu chí chấp nhận được phân tích trước; kế hoạch, dữ liệu và ca kiểm thử được chuẩn bị sớm; thực thi chính thức tiến hành khi có bản dựng phù hợp; kết quả được ghi trước khi chuyển sang nghiệm thu hoặc triển khai.",
    "Mô hình hỗ trợ lập quy trình có trình tự: xác định phạm vi; chuẩn bị tài liệu đầu vào; rà soát theo tiêu chí; ghi nhận phát hiện; xử lý và kiểm tra lại; tổng hợp kết quả. Cách trình bày này phù hợp với yêu cầu xây dựng tiêu chuẩn tài liệu, thủ tục SQA và hồ sơ kết quả.": "Mô hình hỗ trợ lập chuỗi hoạt động: xác định yêu cầu; lập chiến lược và thiết kế ca kiểm thử; chuẩn bị môi trường/dữ liệu; thực thi; ghi lỗi; sửa lỗi và kiểm thử lại; tổng hợp mức bao phủ và kết luận. Chuỗi này giúp hồ sơ kiểm thử có đầu vào, tiêu chí chấp nhận, đầu ra và người chịu trách nhiệm rõ ràng.",
    "Trong báo cáo, Waterfall là cơ sở tổ chức hoạt động SQA cá nhân, không phải kết luận rằng toàn bộ Vira đã được phát triển theo mô hình này. Các chức năng Agile của sản phẩm như Kanban và Sprint không tự xác định mô hình quy trình phát triển. Khi yêu cầu thay đổi, căn cứ rà soát và tài liệu liên quan cần được cập nhật trước khi đánh giá lại.": "Trong báo cáo, Waterfall chỉ là mô hình tham chiếu để tổ chức các điểm kiểm soát kiểm thử cá nhân, không phải kết luận rằng toàn bộ Vira được phát triển theo Waterfall. Việc sản phẩm có Kanban hoặc Sprint cũng không xác định mô hình phát triển. Nếu yêu cầu thay đổi, ma trận truy vết, ca kiểm thử và dữ liệu liên quan phải được xem xét cập nhật.",
    "Hoạt động rà soát mã nguồn được đặt sau lập trình và trước kiểm thử. Rà soát giúp phát hiện sai lệch so với yêu cầu và chuẩn đã xác định bằng cách xem xét sản phẩm công việc. Hoạt động này bổ trợ nhưng không thay thế kiểm thử: rà soát xem xét mã nguồn và tài liệu; kiểm thử thực thi phần mềm để đánh giá hành vi trong tình huống cụ thể [3].": "Kế hoạch và thiết kế kiểm thử bắt đầu từ giai đoạn yêu cầu; thực thi chức năng diễn ra khi bản dựng và môi trường sẵn sàng, trước nghiệm thu/triển khai. Kiểm thử bổ trợ cho review tài liệu và mã nguồn: review xem xét sản phẩm tĩnh, còn kiểm thử thực thi phần mềm để quan sát hành vi với dữ liệu và điều kiện đã xác định [3].",
    "Để thống nhất với Bài 05 của học phần, báo cáo tham chiếu mô hình chất lượng sản phẩm trong ISO/IEC 25010:2011. Mô hình này mô tả các đặc tính chất lượng của sản phẩm phần mềm và chất lượng trong sử dụng; mô hình sản phẩm gồm tám đặc tính: tính phù hợp chức năng, hiệu suất, tính tương thích, khả năng sử dụng, độ tin cậy, bảo mật, khả năng bảo trì và khả chuyển [4]. Do nhiệm vụ cá nhân là rà soát mã nguồn, báo cáo sử dụng mô hình chất lượng sản phẩm làm căn cứ lựa chọn tiêu chí; không đánh giá toàn bộ đặc tính và không tuyên bố sản phẩm đã được chứng nhận ISO/IEC 25010.": "ISO/IEC 25010 là mô hình chất lượng sản phẩm dùng để xác định, đặc tả và đánh giá đặc tính chất lượng; tiêu chuẩn cũng nêu việc xác định mục tiêu kiểm thử và tiêu chí chấp nhận là các ứng dụng phù hợp [9]. Bài 05 của học phần trình bày phiên bản 2011 với tám đặc tính; phiên bản 2011 đã bị rút và phiên bản ISO/IEC 25010:2023 là bản hiện hành, có chín đặc tính [4], [10]. Báo cáo nêu rõ phiên bản để tránh nhầm lẫn, đồng thời chỉ vận dụng đặc tính phù hợp với nhiệm vụ, không tuyên bố Vira được chứng nhận tiêu chuẩn.",
    "Khả năng bảo trì (Maintainability) được ưu tiên vì nhiệm vụ yêu cầu kiểm tra coding standards và tính bảo trì. Nội dung rà soát gồm cách tổ chức module, mức độ rõ ràng của tên gọi, phân chia trách nhiệm giữa lớp/hàm, khả năng theo dõi luồng xử lý và mức độ thuận lợi khi sửa đổi. Tài liệu môn học mô tả đặc tính này qua các khía cạnh như tính module, khả năng phân tích, sửa đổi và kiểm thử [4].": "Đặc tính trọng tâm là tính phù hợp chức năng (Functional suitability): hệ thống phải cung cấp chức năng đáp ứng nhu cầu đã nêu. Kiểm thử Vira vì vậy kiểm tra luồng tạo Workspace/Project/Task, cập nhật trạng thái, phân quyền theo vai trò và đầu ra sau thao tác. Các tiêu chí về tính đầy đủ, đúng đắn và thích hợp của chức năng được chuyển thành ca kiểm thử có điều kiện trước, dữ liệu và kết quả mong đợi; bản thân ISO không quy định cụ thể test case của Vira.",
    "Bảo mật (Security) được lựa chọn do Vira có phân quyền ở Workspace và Project. Rà soát tập trung kiểm tra backend có xác thực quyền tại thao tác nhạy cảm hay không, quyền được áp dụng đúng vai trò và phạm vi dữ liệu hay không. Việc chỉ ẩn nút trên giao diện không đủ làm căn cứ kết luận API đã được bảo vệ; cần truy vết tới điểm xử lý phía máy chủ và đối chiếu với quy định quyền của dự án.": "Bảo mật được xét ở góc độ kiểm thử chức năng của vai trò: OWNER/ADMIN được phép quản trị, MEMBER không được thực hiện một số thao tác quản trị, người ngoài dự án không đọc được dữ liệu không thuộc quyền. Ca kiểm thử cần quan sát phản hồi API và dữ liệu trả về, không chỉ kiểm tra nút bị ẩn trên giao diện. Kết quả này không thay thế đánh giá bảo mật chuyên sâu.",
    "Tính phù hợp chức năng (Functional suitability) được dùng để đối chiếu logic mã nguồn với yêu cầu chức năng và quy tắc nghiệp vụ. Người thực hiện xác định yêu cầu tương ứng, vị trí code xử lý và sự phù hợp giữa hai nội dung. Nếu cần khẳng định hành vi khi chạy, kết quả rà soát phải được bổ trợ bằng kiểm thử phù hợp.": "Khả năng sử dụng được quan sát qua khả năng hoàn thành luồng trên giao diện, thông báo và trạng thái hiển thị; tính tương thích được cân nhắc khi UI và API cùng tham gia luồng. Các đặc tính này chỉ được đánh giá trong phạm vi chức năng cụ thể, không được khái quát thành đánh giá chất lượng toàn sản phẩm.",
    "Độ tin cậy (Reliability) chỉ được xem xét khi liên quan trực tiếp tới phạm vi. Ví dụ, quy định Vira yêu cầu một số thao tác cập nhật trạng thái, di chuyển, xóa mềm hoặc khôi phục task gửi kèm version hiện tại để hỗ trợ optimistic locking. Nếu các thao tác này thuộc phạm vi, cần kiểm tra việc truyền và xử lý version; kết quả không được khái quát thành đánh giá độ tin cậy toàn hệ thống.": "Độ tin cậy được quan sát qua các kết quả chức năng đối với tình huống cạnh tranh đã có quy tắc, chẳng hạn gửi version cũ phải nhận xung đột thay vì ghi đè im lặng. Khả năng sử dụng cũng được xem xét ở các luồng tạo task, lọc Backlog và điều hướng trên giao diện. Phạm vi này không phải kiểm thử tải, khả năng phục hồi hay usability study toàn diện.",
    "ISO/IEC 25010 cung cấp nhóm đặc tính chất lượng ở mức mô hình. Để áp dụng vào nhiệm vụ cá nhân, mỗi đặc tính được chọn cần chuyển thành câu hỏi kiểm tra, phương pháp đánh giá và yêu cầu minh chứng. Ví dụ dưới đây định hướng việc lập checklist; trạng thái đánh giá chỉ được điền sau khi kiểm tra thực tế.": "Mỗi mục tiêu chất lượng được chuyển thành yêu cầu hoặc quy tắc nghiệp vụ có thể quan sát; mỗi ca có mã, điều kiện trước, dữ liệu đầu vào, bước thực hiện và kết quả mong đợi. Ca kiểm thử được liên kết với test script hoặc API/UI tương ứng. Trạng thái Pass/Fail/N/A chỉ được xác định sau khi thực thi; việc có test script trong repository là căn cứ thiết kế, không chứng minh test đã chạy.",
    "Waterfall được chọn làm mô hình tham chiếu để xác định vị trí, đầu vào và đầu ra của hoạt động rà soát mã nguồn cá nhân. ISO/IEC 25010 được lựa chọn để hình thành tiêu chí chất lượng, tập trung vào khả năng bảo trì, bảo mật và tính phù hợp chức năng; độ tin cậy được xem xét giới hạn khi liên quan đến thao tác thuộc phạm vi. Đây là cơ sở cho tiêu chuẩn tài liệu và quy trình ở các phần tiếp theo.": "Waterfall giúp bố trí các điểm chuẩn bị và thực thi kiểm thử theo đầu ra từng giai đoạn; ISO/IEC 25010 cung cấp căn cứ lựa chọn đặc tính chất lượng và mục tiêu kiểm thử. Tính phù hợp chức năng là trọng tâm, còn quyền truy cập, khả năng sử dụng và một số phản hồi về độ tin cậy được đưa vào khi liên quan trực tiếp tới luồng Vira. Đây là cơ sở cho bộ tài liệu và quy trình kiểm thử ở các phần sau.",
}
for old, new in replacements.items():
    if old.startswith("Vira là ứng dụng web"):
        continue
    set_text(find_para(old), new)
set_text(find_para("1.2.3. Vị trí và quan hệ của hoạt động rà soát"), "1.2.3. Vị trí của kiểm thử chức năng")
set_text(find_para("1.3.2. Các đặc tính áp dụng vào rà soát mã nguồn"), "1.3.2. Đặc tính áp dụng vào kiểm thử chức năng")
set_text(find_para("1.3.3. Chuyển mô hình thành tiêu chí có thể kiểm tra"), "1.3.3. Chuyển mô hình thành mục tiêu kiểm thử")

# Tailor the SQA document-control section to functional testing.
section2_replacements = {
    "Bộ tiêu chuẩn tài liệu SQA quy định cách nhận diện, cấu trúc, đặt tên, quản lý phiên bản, rà soát, phê duyệt và lưu trữ tài liệu dùng trong nhiệm vụ cá nhân. Mục tiêu là bảo đảm tài liệu nhất quán, truy vết được và phản ánh đúng phần mã nguồn đã kiểm tra.": "Bộ tiêu chuẩn tài liệu SQA quy định cách nhận diện, cấu trúc, đặt tên, quản lý phiên bản, rà soát, phê duyệt và lưu trữ hồ sơ kiểm thử chức năng. Mục tiêu là bảo đảm mỗi yêu cầu, ca kiểm thử, bộ dữ liệu, kết quả và lỗi có thể truy vết, tái thực hiện và được kiểm soát theo phiên bản.",
    "Tiêu chuẩn áp dụng cho tài liệu cá nhân phục vụ rà soát mã nguồn Vira: kế hoạch/phạm vi rà soát, quy ước và tiêu chí áp dụng, quy trình rà soát, checklist, phiếu ghi nhận phát hiện và báo cáo kết quả. Nội dung tham khảo bài giảng về tiêu chuẩn tài liệu, quy trình review, checklist và thủ tục QA [5], [6].": "Tiêu chuẩn áp dụng cho hồ sơ kiểm thử Vira: kế hoạch kiểm thử chức năng, ma trận yêu cầu–ca kiểm thử, đặc tả ca kiểm thử, danh mục dữ liệu kiểm thử, nhật ký thực thi, phiếu lỗi và báo cáo tổng kết. Nội dung dựa trên yêu cầu dự án và bài giảng về hệ thống/tài liệu SQA [5], [6].",
    "Mỗi tài liệu cần có khối thông tin kiểm soát gồm mã, tên, phiên bản, ngày ban hành/cập nhật, người soạn, người rà soát/phê duyệt và trạng thái. Phần nội dung cần nêu mục đích, phạm vi, thuật ngữ cần thiết, căn cứ tham chiếu, nội dung chính và lịch sử thay đổi. Checklist hoặc báo cáo phát hiện cần bổ sung mã lần rà soát, module, phiên bản code và minh chứng.": "Mỗi tài liệu ghi mã, tên, phiên bản, ngày, người soạn, người rà soát/phê duyệt và trạng thái. Nội dung có mục đích, phạm vi, căn cứ, thuật ngữ, lịch sử thay đổi và liên kết với phiên bản phần mềm. Ca kiểm thử còn ghi yêu cầu liên quan, tiền điều kiện, bước, dữ liệu, kết quả mong đợi/thực tế và trạng thái; phiếu lỗi ghi môi trường, mức độ, khả năng tái hiện và minh chứng.",
    "Mã tài liệu sử dụng cấu trúc VIRA-SQA-[LOẠI]-[SỐ THỨ TỰ]. VIRA nhận diện dự án; SQA nhận diện nhóm tài liệu đảm bảo chất lượng; LOẠI mô tả loại tài liệu; SỐ THỨ TỰ là hai chữ số tăng dần. Tên file gồm mã tài liệu, tên rút gọn, phiên bản và ngày cập nhật; không sử dụng tên chung chung hoặc khó phân biệt.": "Mã tài liệu sử dụng cấu trúc VIRA-SQA-[LOẠI]-[SỐ THỨ TỰ]. VIRA nhận diện dự án; SQA là nhóm đảm bảo chất lượng; LOẠI mô tả tài liệu; số thứ tự phân biệt biểu mẫu. Ca kiểm thử dùng mã TC-[MODULE]-[SỐ], lỗi dùng BUG-[MODULE]-[SỐ]; tên file cần nhận diện phạm vi và phiên bản.",
    "Danh mục hồ sơ được đề xuất gồm: VIRA-SQA-PLN-01 (kế hoạch SQA cá nhân, xác định mục tiêu, phạm vi, tiêu chí và cách lưu); VIRA-SQA-STD-01 (quy ước rà soát mã nguồn, tập hợp coding standards và căn cứ chất lượng); VIRA-SQA-PROC-01 (quy trình rà soát, nêu vai trò, đầu vào, bước làm và điều kiện kết thúc); VIRA-SQA-CHK-01 (checklist, ghi tiêu chí, cách đánh giá, trạng thái, minh chứng và hướng xử lý); VIRA-SQA-LOG-01 (phiếu theo dõi phát hiện); và VIRA-SQA-RPT-01 (báo cáo kết quả). Đây là mã đề xuất cho nhiệm vụ cá nhân, cần điều chỉnh nếu giảng viên hoặc dự án có quy ước chính thức khác.": "Danh mục đề xuất gồm VIRA-SQA-PLN-FT-01 (kế hoạch kiểm thử chức năng); VIRA-SQA-TRM-01 (ma trận yêu cầu–ca kiểm thử); VIRA-SQA-TC-01 (đặc tả ca kiểm thử); VIRA-SQA-DATA-01 (danh mục dữ liệu); VIRA-SQA-EXEC-01 (nhật ký thực thi); VIRA-SQA-DEF-01 (phiếu lỗi); và VIRA-SQA-SUM-01 (báo cáo tổng kết). Mỗi hồ sơ có chủ sở hữu, phiên bản và trạng thái; mã là đề xuất cho nhiệm vụ cá nhân, không thay thế quy ước chính thức của dự án.",
    "Tên file sử dụng mẫu VIRA-SQA-[LOẠI]-[SCOPE]_v[MAJOR.MINOR]_[YYYYMMDD].docx. SCOPE là module, chức năng hoặc phạm vi; phiên bản thể hiện lần ban hành/cập nhật; ngày dùng dạng năm-tháng-ngày. Ví dụ: VIRA-SQA-CHK-TASK_v1.0_20261028.docx. Nếu tài liệu lưu trong hệ thống quản lý phiên bản, tên file vẫn cần đủ rõ để nhận diện khi tải riêng.": "Tên file dùng mẫu VIRA-SQA-[LOẠI]-[SCOPE]_v[MAJOR.MINOR]_[YYYYMMDD].docx. Ví dụ: VIRA-SQA-TC-TASK_v1.0_20261030.docx hoặc VIRA-SQA-EXEC-AUTH_v1.0_20261030.xlsx. Mã ca kiểm thử có thể là TC-TASK-010; tên thể hiện hành vi cần xác minh, không chứa thông tin cá nhân thật.",
    "Trong rà soát code, tác giả mã nguồn và reviewer là hai vai trò nghiệp vụ khác nhau. Cá nhân thực hiện nhiệm vụ SQA rà soát theo checklist; người phụ trách code tiếp nhận và xử lý phát hiện. Nếu không có người độc lập kiểm tra lại, báo cáo phải nêu hạn chế và áp dụng bước tự rà soát lại.": "Trong kiểm thử, người thiết kế ca xác định dữ liệu và kết quả mong đợi; người thực thi ghi kết quả thực tế; người phát triển phân tích/sửa lỗi; người rà soát hoặc giảng viên xem xét kế hoạch, bằng chứng và quyết định nghiệm thu theo thẩm quyền. Khi cá nhân kiêm nhiều vai trò, hồ sơ nêu rõ và đề nghị người hướng dẫn xem xét các ca rủi ro cao.",
    "Tài liệu dùng tiếng Việt cho thuyết minh; thuật ngữ kỹ thuật và tên thành phần mã nguồn được giữ nguyên khi cần chính xác. Thuật ngữ cần được giải thích ở lần xuất hiện đầu tiên nếu có nguy cơ nhầm lẫn. Bảng, hình và checklist cần đánh số, có tên và ghi nguồn khi sử dụng nội dung ngoài dự án.": "Tài liệu dùng tiếng Việt; tên endpoint, status, field và test script giữ nguyên để tránh sai nghĩa. Ca kiểm thử ghi từng bước theo thứ tự, một kết quả mong đợi có thể quan sát và dữ liệu đã khử nhạy cảm. Bảng, hình và checklist được đánh số, đặt tên và ghi nguồn.",
    "Nhận định phải phân biệt giữa quy định, đề xuất, quan sát và kết quả đã xác minh. Phát hiện cần mô tả vấn đề, vị trí, căn cứ, ảnh hưởng và hướng xử lý. Không đưa mật khẩu, token, khóa bí mật hoặc dữ liệu cá nhân vào tài liệu; minh chứng cần được che thông tin nhạy cảm.": "Nhận định phải phân biệt kết quả đã chạy với test script hoặc ca mới đề xuất. Phiếu lỗi ghi bước tái hiện, dữ liệu, expected/actual, môi trường, mức độ, ảnh chụp/log/network trace đã che token và thông tin cá nhân. Không đưa password, JWT, khóa bí mật hoặc dữ liệu người dùng thật vào hồ sơ.",
    "Tài liệu được lưu trong thư mục riêng của báo cáo cá nhân hoặc vị trí học phần quy định. Kế hoạch SQA xác định phạm vi; quy ước/tiêu chuẩn cung cấp căn cứ; quy trình quy định cách làm; checklist ghi kết quả từng tiêu chí; phiếu phát hiện theo dõi xử lý; báo cáo tổng hợp kết quả. Mỗi phát hiện phải liên kết với mã tiêu chí, module/chức năng, đường dẫn file, phiên bản code nếu xác định được và trạng thái xử lý.": "Hồ sơ được lưu theo phiên bản và liên kết từ yêu cầu → ca kiểm thử → dữ liệu → lần chạy → lỗi/phiếu lỗi → kiểm thử lại. Nhật ký thực thi ghi người chạy, ngày, môi trường, bản dựng, test case, trạng thái, actual result và đường dẫn minh chứng. Không ghi Pass khi chưa thực thi; bản chạy lại không xóa lịch sử kết quả cũ.",
    "Bộ tiêu chuẩn xác định cấu trúc, cách đặt mã và tên, quản lý phiên bản, vai trò soạn/rà soát/phê duyệt và danh mục tài liệu cần dùng cho nhiệm vụ cá nhân. Liên kết mã và phiên bản giữa các hồ sơ hỗ trợ truy vết từ yêu cầu chất lượng đến tiêu chí, phát hiện, xử lý và kết luận.": "Bộ tiêu chuẩn xác định cách quản lý hồ sơ kiểm thử, vai trò, mã ca và lỗi, dữ liệu, phiên bản, minh chứng và trạng thái phê duyệt. Ma trận truy vết giúp theo dõi từ yêu cầu chức năng đến kết quả kiểm thử và xử lý lỗi; đây là cơ sở của quy trình ở phần tiếp theo.",
}
for old, new in section2_replacements.items():
    set_text(find_para(old), new)

# Remove the old source-code-review procedure and checklist while preserving the
# surrounding section styles, page system, header field, and conclusion/references.
sec3 = next(p for p in doc.paragraphs if p.text.strip().startswith("3. QUY TRÌNH SQA"))
conclusion = next(p for p in doc.paragraphs if p.text.strip() == "KẾT LUẬN")
body = doc._element.body
children = list(body)
start, stop = children.index(sec3._p), children.index(conclusion._p)
for element in children[start:stop]:
    body.remove(element)
anchor = conclusion

heading(anchor, "3. QUY TRÌNH SQA PHỤC VỤ KIỂM THỬ CHỨC NĂNG", 1)
heading(anchor, "3.1. Mục tiêu và phạm vi", 2)
add_before(anchor, "Quy trình quy định cách chuyển yêu cầu chức năng của Vira thành ca kiểm thử, chuẩn bị dữ liệu/môi trường, thực thi có kiểm soát, ghi nhận Pass/Fail/Không áp dụng và lưu minh chứng. Mục tiêu là phát hiện sai lệch giữa hành vi thực tế với kết quả mong đợi trước khi đề xuất nghiệm thu, đồng thời bảo đảm ca lỗi có thể tái hiện và kiểm thử lại.")
add_before(anchor, "Phạm vi gồm kiểm thử chức năng ở mức hệ thống qua giao diện web và API cho luồng xác thực, Workspace/Project, task, vai trò, Sprint/board, cộng tác, đính kèm, thông báo, Backlog và vòng đời lưu trữ. Kiểm thử hiệu năng, xâm nhập, tương thích trình duyệt mở rộng, usability study và kiểm toán mã nguồn nằm ngoài checklist cá nhân này, trừ khi được giao riêng.")
heading(anchor, "3.2. Vai trò và đầu vào", 2)
add_before(anchor, "Người thực hiện kiểm thử (sinh viên) xác định phạm vi, lập ma trận truy vết, thiết kế ca và dữ liệu, thực thi, ghi actual result và lập báo cáo. Người hướng dẫn/người yêu cầu xem xét tiêu chí chấp nhận và mức độ hoàn tất. Người phát triển hoặc người quản lý dự án giải thích quy tắc nghiệp vụ, sửa lỗi theo phân công và cung cấp bản dựng. Người rà soát lại xác nhận ca lỗi sau sửa; nếu người kiểm thử tự retest, hồ sơ ghi rõ giới hạn độc lập.")
add_before(anchor, "Đầu vào gồm yêu cầu/chức năng và quy tắc nghiệp vụ; vai trò và quyền; bản dựng/commit cần kiểm tra; endpoint/API hoặc hướng dẫn UI; kế hoạch, ma trận, phiên bản ca và dữ liệu; thông tin môi trường; và tiêu chí chấp nhận. Khi yêu cầu mơ hồ, người kiểm thử ghi câu hỏi cần làm rõ, không tự đặt kết quả mong đợi rồi coi là yêu cầu đã phê duyệt.")
heading(anchor, "3.3. Thiết kế ca kiểm thử và dữ liệu", 2)
add_before(anchor, "Mỗi ca có mã duy nhất, mục tiêu, yêu cầu liên quan, mức ưu tiên, tiền điều kiện, vai trò, dữ liệu đầu vào, bước thực hiện, kết quả mong đợi, trạng thái, actual result và loại minh chứng. Ca dương tính xác minh luồng hợp lệ; ca âm tính kiểm tra dữ liệu thiếu/sai hoặc vai trò không đủ quyền; ca biên tập trung giá trị giới hạn; bảng quyết định phù hợp với tổ hợp vai trò–thao tác; kiểm thử chuyển trạng thái dùng trạng thái trước/sau và version.")
add_before(anchor, "Dữ liệu cần độc lập giữa các ca để tránh kết quả phụ thuộc thứ tự. Dùng email và tên dự án tổng hợp có hậu tố duy nhất; không dùng tài khoản thật hoặc token lưu trong báo cáo. Tạo rõ chủ sở hữu, quản trị viên, thành viên và người ngoài dự án; dùng task cha/con, BUG, Sprint và attachment có định danh riêng. Ghi dữ liệu cần dọn hoặc lưu trữ sau kiểm thử để môi trường có thể dùng lại.")
heading(anchor, "3.4. Trình tự thực hiện", 2)
heading(anchor, "3.4.1. Xác định yêu cầu và điều kiện chấp nhận", 3)
add_before(anchor, "Gán mã cho từng yêu cầu/chức năng trong phạm vi; nêu điều kiện đầu vào và hành vi quan sát được. Xác định vai trò, giá trị dữ liệu hợp lệ/không hợp lệ, phản hồi mong đợi và quy tắc trạng thái. Lập ma trận liên kết mỗi yêu cầu với ít nhất một ca; đánh dấu yêu cầu chưa đủ căn cứ.")
heading(anchor, "3.4.2. Lập kế hoạch và thiết kế ca", 3)
add_before(anchor, "Chọn luồng rủi ro cao, xác định mức ưu tiên, thứ tự và phụ thuộc giữa ca. Viết dữ liệu cùng bước thực hiện đủ rõ để người khác chạy lại. Rà soát tính nhất quán giữa expected result và yêu cầu, tính độc lập của test data, khả năng cleanup và khả năng thu thập ảnh/log/network response.")
heading(anchor, "3.4.3. Chuẩn bị môi trường và bản dựng", 3)
add_before(anchor, "Ghi phiên bản frontend/backend, cấu hình trình duyệt, endpoint, cơ sở dữ liệu và trạng thái dịch vụ. Xác nhận môi trường sử dụng dữ liệu thử nghiệm, tài khoản đúng vai trò và bản dựng khởi động được. Lỗi môi trường được ghi Blocked, tách khỏi Fail của sản phẩm; không dùng môi trường khác với môi trường đã ghi mà không cập nhật hồ sơ.")
heading(anchor, "3.4.4. Thực thi và ghi kết quả", 3)
add_before(anchor, "Chạy từng ca theo bước đã định, không sửa dữ liệu giữa chừng nếu chưa ghi. So sánh actual result với expected result, ghi status code/UI state/dữ liệu trả về hoặc thông báo nhìn thấy, thời gian và người chạy. Thu ảnh màn hình, request/response đã che token, log hoặc trace khi phù hợp. Mỗi lần chạy có ID/ngày để phân biệt lần đầu với retest.")
heading(anchor, "3.4.5. Ghi lỗi, sửa lỗi và kiểm thử lại", 3)
add_before(anchor, "Khi actual khác expected, tạo phiếu BUG gồm tiêu đề, bước tái hiện, tiền điều kiện, dữ liệu, expected/actual, mức độ, mức ưu tiên, môi trường và minh chứng. Sau khi sửa, chạy lại ca lỗi; nếu thay đổi ảnh hưởng luồng liên quan, chạy regression có chọn lọc. Giữ liên kết giữa BUG, commit/bản dựng và kết quả retest; không ghi đè trạng thái lần trước.")
heading(anchor, "3.4.6. Tổng hợp và kết thúc", 3)
add_before(anchor, "Tổng hợp tổng số ca trong phạm vi, số Pass, Fail, N/A, Not Run/Blocked, số lỗi theo mức độ và mức bao phủ yêu cầu. Báo cáo nêu bản dựng, môi trường, ngày chạy, điều kiện loại trừ, lỗi còn mở, kết quả retest và đề xuất chuyển giai đoạn. Không gọi checklist hoàn tất nếu còn ca ưu tiên cao chưa chạy mà không có lý do/ quyết định chấp nhận rủi ro.")
heading(anchor, "3.5. Trạng thái, chấp nhận và điều kiện kết thúc", 2)
add_before(anchor, "Pass/Đạt: đã thực thi đầy đủ trên đúng môi trường và actual phù hợp expected. Fail/Không đạt: đã thực thi nhưng có sai khác có thể tái hiện hoặc đầu ra vi phạm yêu cầu; cần phiếu lỗi và minh chứng. N/A/Không áp dụng: chức năng/điều kiện không thuộc phạm vi, kèm lý do được chấp thuận. Not Run/Chưa chạy và Blocked/Không thể chạy là trạng thái theo dõi riêng, không được đổi thành Pass hoặc N/A để làm đẹp thống kê.")
add_before(anchor, "Một đợt kiểm thử hoàn tất về hồ sơ khi phạm vi, bản dựng và môi trường được xác định; mọi yêu cầu áp dụng có liên kết ca; mọi ca có trạng thái và bằng chứng hoặc lý do chưa chạy; mọi Fail có phiếu lỗi; kết quả retest/regression được lưu; và báo cáo nêu số liệu/giới hạn. Điều kiện nghiệm thu sản phẩm do người có thẩm quyền xác định; báo cáo cá nhân không thay quyết định đó.")
heading(anchor, "3.6. Đầu ra và minh chứng", 2)
add_before(anchor, "Đầu ra gồm kế hoạch/phạm vi kiểm thử; ma trận yêu cầu–ca; danh mục dữ liệu; đặc tả ca kiểm thử; nhật ký thực thi; phiếu lỗi và lịch sử retest; báo cáo tổng kết. Minh chứng có thể là ảnh UI, trace, log, request/response đã che thông tin bí mật, dữ liệu trước/sau, tên test script và commit/bản dựng. Mỗi tệp có ngày, mã ca, môi trường và người ghi nhận; chỉ lưu thông tin cần thiết.")
heading(anchor, "3.7. Giới hạn kiểm thử cá nhân", 2)
add_before(anchor, "Một cá nhân vừa thiết kế vừa thực thi ca có thể bỏ sót do diễn giải yêu cầu chủ quan. Biện pháp giảm rủi ro là truy vết hai chiều, rà soát expected result trước chạy, giữ trạng thái Not Run tách biệt, ghi lại dữ liệu và yêu cầu người hướng dẫn xem xét các ca phân quyền/rủi ro cao. Checklist chức năng không thay thế review code, security testing, performance testing hoặc nghiệm thu người dùng.")
heading(anchor, "3.8. Kết luận phần 3", 2)
add_before(anchor, "Quy trình đã xác định mục tiêu, phạm vi, vai trò, đầu vào, kỹ thuật thiết kế ca, các bước thực thi, trạng thái Pass/Fail/N/A, đầu ra, điều kiện kết thúc và cách lưu hồ sơ. Đây là căn cứ áp dụng checklist chức năng cho các luồng Vira ở phần tiếp theo.")

# Replace the prior source-code checklist and findings with a Vira functional test suite.
heading(anchor, "4. CHECKLIST KIỂM THỬ CHỨC NĂNG ÁP DỤNG CHO VIRA", 1)
heading(anchor, "4.1. Phạm vi, dữ liệu và quy ước đánh giá", 2)
add_before(anchor, "Checklist bao phủ các luồng người dùng và API có mô tả trong dự án: đăng ký/đăng nhập, Workspace/Project, task, vai trò, board/Sprint, cộng tác, tệp đính kèm, notification, Backlog và archive/restore. Căn cứ thiết kế gồm Playwright config và các file E2E trong e2e/; test definitions là bằng chứng có kịch bản, không phải log thực thi [11].")
add_before(anchor, "Bộ dữ liệu đề xuất: (1) tài khoản tổng hợp OWNER, ADMIN, MEMBER, CONTRIBUTOR và OUTSIDER dùng email hậu tố riêng; (2) Workspace/Project tạo mới cho từng lượt, projectKey duy nhất và projectType KANBAN hoặc SCRUM; (3) task cha STORY, subtask, task thường và BUG; (4) trạng thái TODO/IN_PROGRESS/DONE, version hiện tại và version cũ; (5) giá trị biên storyPoints = -1, dueDate trước ngày chạy, Sprint có startDate sau endDate; (6) attachment văn bản nhỏ với nội dung kiểm chứng cố định. Không đưa mật khẩu hoặc token thật vào báo cáo.")
add_before(anchor, "Cột Kết quả thực thi hiện ghi Chưa chạy vì lần lập báo cáo chỉ đối chiếu yêu cầu dự án và test script có sẵn; không thực thi E2E trên môi trường. Sau khi chạy, chọn Pass, Fail hoặc N/A theo định nghĩa ở Mục 3.5; Not Run/Blocked được giữ riêng. File và dòng ở cột minh chứng là căn cứ thiết kế ca, còn ảnh/trace/actual result phải bổ sung từ lần chạy thực tế.")

headers = ["Mã", "Tình huống và mục tiêu", "Dữ liệu/tiền điều kiện", "Bước và kết quả mong đợi", "Kết quả thực thi", "Căn cứ thiết kế / xử lý nếu lỗi"]
widths = [0.8, 2.6, 2.6, 3.5, 1.4, 4.6]

heading(anchor, "4.2. Tài khoản, Workspace và Project", 2)
rows_a = [
("A01", "Đăng ký tài khoản mới", "Email tổng hợp chưa tồn tại; tên hợp lệ; mật khẩu đáp ứng chính sách.", "Gửi đăng ký. Mong đợi HTTP 201, trả hồ sơ người dùng/token theo envelope và có thể đăng nhập.", "Chưa chạy", "e2e/auth.spec.js:5–24. Nếu lỗi, ghi status/body đã che dữ liệu."),
("A02", "Đăng nhập và mở Workspace", "Tài khoản có Workspace/Project; mật khẩu đúng.", "Đăng nhập trên UI; mong đợi vào giao diện, thấy Tổng quan và đúng Workspace.", "Chưa chạy", "e2e/auth.spec.js:27–35. Lỗi UI: ảnh, console và trace."),
("A03", "Quên và đặt lại mật khẩu", "Tài khoản thử nghiệm; Mailpit/luồng email sẵn sàng.", "Yêu cầu reset; mở liên kết thử nghiệm; đặt mật khẩu mới. Mong đợi UI xác nhận và đăng nhập lại thành công.", "Chưa chạy", "e2e/lifecycle.spec.js:30–53. Không ghi token reset vào báo cáo."),
("A04", "Đổi mật khẩu với dữ liệu sai", "Mật khẩu hiện tại sai; sau đó thử mật khẩu mới trùng hiện tại.", "Thực hiện từng ca âm tính riêng. Mong đợi sai mật khẩu trả 401; mật khẩu mới không đổi trả 400.", "Chưa chạy", "e2e/platform-flow.spec.js:57–67. Ghi mã phản hồi và thông báo thực tế."),
("A05", "Tạo/cập nhật Workspace và Project", "OWNER; Workspace mới; projectKey duy nhất; type SCRUM.", "Tạo Workspace, cập nhật tên, tạo Project. Mong đợi bản ghi phản hồi đúng dữ liệu và GET đọc lại nhất quán.", "Chưa chạy", "e2e/platform-flow.spec.js:68–90. Ghi ID tổng hợp và kết quả API."),
("A06", "Kiểm tra quyền thành viên và người ngoài", "OWNER, ADMIN, MEMBER, OUTSIDER; Project có task.", "Member thử đổi vai trò phải 403; outsider đọc task phải 403/404 và không nhận dữ liệu dự án.", "Chưa chạy", "e2e/platform-flow.spec.js:98–106; e2e/roles.spec.js:65–112. Khi Fail, lưu response đã che thông tin."),
]
add_table_before(anchor, "Bảng 4.1. Ca kiểm thử tài khoản, Workspace và Project", headers, rows_a, widths)

heading(anchor, "4.3. Task và quy tắc nghiệp vụ", 2)
rows_t = [
("T07", "Tạo task hợp lệ", "MEMBER trong Project; title không rỗng; type STORY; priority HIGH; storyPoints = 5.", "POST tạo task. Mong đợi HTTP 201; task thuộc đúng Project, giữ title/type/priority và trả version ban đầu.", "Chưa chạy", "e2e/platform-flow.spec.js:104–109. Lỗi: lưu payload đã khử dữ liệu và response."),
("T08", "Từ chối story point âm", "MEMBER; storyPoints = -1; các trường khác hợp lệ.", "Gửi yêu cầu tạo task. Mong đợi HTTP 400; không tạo task mới.", "Chưa chạy", "e2e/platform-flow.spec.js:107–112. Kiểm tra cả dữ liệu tồn tại sau phản hồi."),
("T09", "Từ chối due date quá khứ", "Ngày đến hạn trước ngày chạy một ngày.", "Tạo task với dueDate quá khứ. Mong đợi HTTP 400 và có thông báo validation phù hợp.", "Chưa chạy", "e2e/platform-flow.spec.js:113–118. Ghi ngày/múi giờ sử dụng."),
("T10", "Bắt buộc version khi đổi trạng thái", "Task đang TODO; request không có version.", "Gửi PATCH trạng thái IN_PROGRESS thiếu version. Mong đợi HTTP 400; task không đổi trạng thái.", "Chưa chạy", "e2e/platform-flow.spec.js:119–124. Lưu trạng thái trước/sau."),
("T11", "Task cha chỉ DONE sau khi subtask hoàn tất", "Task cha và subtask; subtask ban đầu chưa DONE.", "Đổi cha sang DONE phải HTTP 400; hoàn thành con rồi thử lại với version hiện hành, mong đợi cha DONE.", "Chưa chạy", "e2e/platform-flow.spec.js:125–139. Ghi từng bước và version trả về."),
("T12", "Xung đột khi gửi version cũ", "Task đã được cập nhật; giữ bản version cũ.", "Gửi cập nhật bằng version cũ. Mong đợi HTTP 409, trạng thái mới nhất không bị ghi đè.", "Chưa chạy", "e2e/platform-flow.spec.js:132–139. Ghi hai phiên bản và response conflict."),
("T13", "Lưu và đọc chi tiết BUG", "Task type BUG; environment, severity, reproduction steps, expected/actual result.", "Lưu metadata bug rồi đọc lại. Mong đợi HTTP thành công và severity/field đọc lại khớp.", "Chưa chạy", "e2e/platform-flow.spec.js:141–147. Ghi field thiếu/sai nếu có."),
("T14", "Tìm kiếm và truy vấn Backlog", "Task tiêu đề có từ khóa Parent; thành viên Project.", "Tìm theo từ khóa và mở Backlog. Mong đợi totalItems = 1 ở fixture và danh sách Backlog không rỗng.", "Chưa chạy", "e2e/platform-flow.spec.js:164–168. Ghi query và dữ liệu trả về."),
("T15", "Xóa mềm và khôi phục task", "OWNER; task chưa xóa; version hợp lệ.", "Xóa task; xác minh xuất hiện trong danh sách deleted; restore với version mới. Mong đợi task hoạt động lại.", "Chưa chạy", "e2e/platform-flow.spec.js:237–240; e2e/lifecycle.spec.js:63–67. Ghi version trước/sau."),
]
add_table_before(anchor, "Bảng 4.2. Ca kiểm thử task và quy tắc nghiệp vụ", headers, rows_t, widths)

heading(anchor, "4.4. Cộng tác, giao diện và vòng đời", 2)
rows_c = [
("C16", "Bình luận, trả lời và ghim", "Task có quyền truy cập; bình luận gốc và bình luận trả lời.", "Tạo comment/reply, ghim comment bằng ADMIN; mong đợi pinned = true và danh sách có đủ hai comment.", "Chưa chạy", "e2e/platform-flow.spec.js:149–152. Lưu response và trạng thái hiển thị."),
("C17", "Nhãn và gán nhãn cho task", "Label Regression, màu hợp lệ; task có sẵn.", "Tạo, đổi tên label, gán vào task rồi đọc danh sách. Mong đợi tên Verified và một nhãn được gán.", "Chưa chạy", "e2e/platform-flow.spec.js:154–162. Kiểm tra cập nhật, gán và xóa."),
("C18", "Phân công, cộng tác và mention", "ADMIN, CONTRIBUTOR; task; email tổng hợp.", "Gán assignee, watch/join/leave; tạo comment mention. Mong đợi danh sách cộng tác có user và thông báo mention xuất hiện.", "Chưa chạy", "e2e/platform-flow.spec.js:208–231. Kiểm tra cả actor và đối tượng nhận."),
("C19", "Notification và quyền đọc", "Thông báo TASK_ASSIGNED của contributor; tài khoản MEMBER khác.", "Người nhận đánh dấu read; mong đợi readAt có giá trị. Tài khoản khác thử đọc phải 403/404.", "Chưa chạy", "e2e/platform-flow.spec.js:216–223. Ghi người gửi/nhận và trạng thái."),
("B20", "Cấu hình board/WIP theo vai trò", "OWNER/ADMIN và MEMBER; board có cột đầu.", "ADMIN đổi tên/cấu hình WIP và thêm cột; MEMBER thử cấu hình bị 403; UI hiển thị WIP limit đã lưu.", "Chưa chạy", "e2e/platform-flow.spec.js:178–187; e2e/operations-ui.spec.js:69–73."),
("B21", "Vòng đời Sprint và dữ liệu ngày", "ADMIN; ngày hợp lệ và một cặp startDate > endDate; MEMBER.", "Ngày đảo phải 400; MEMBER tạo Sprint phải 403; ADMIN tạo/start/complete Sprint hợp lệ, status COMPLETED.", "Chưa chạy", "e2e/platform-flow.spec.js:189–206. Lưu ngày dùng và status từng bước."),
("U22", "Tạo task và di chuyển trên UI", "OWNER; title duy nhất; story point = 3.", "Tạo task trong dialog, đổi status IN_PROGRESS; mong đợi dialog và thẻ Kanban hiển thị ở cột Đang thực hiện.", "Chưa chạy", "e2e/operations-ui.spec.js:54–73. Bổ sung ảnh màn hình sau chạy."),
("U23", "Lưu, áp dụng và xóa bộ lọc Backlog", "Task có từ khóa; tên filter duy nhất; user thử nghiệm.", "Tìm task, lưu filter, áp dụng rồi xóa. Mong đợi filter hiện/được chọn rồi biến mất sau xóa.", "Chưa chạy", "e2e/backlog.spec.js:56–69. Ghi trạng thái giao diện và danh sách."),
("U24", "Upload và download attachment", "Task; file text nhỏ `ui-proof-<tag>.txt`; nội dung cố định.", "Upload trên UI, tải xuống; mong đợi đúng tên file và nội dung. API lifecycle cũng kiểm tra body có dấu hiệu tệp thử.", "Chưa chạy", "e2e/operations-ui.spec.js:96–107; e2e/lifecycle.spec.js:55–61. Không dùng tệp chứa dữ liệu thật."),
("U25", "Archive/restore Project và Workspace", "OWNER; Workspace/Project được tạo cho lượt test.", "Archive Project/Workspace, xác minh xuất hiện trong danh sách archived; restore và xác minh trở lại danh sách hoạt động.", "Chưa chạy", "e2e/lifecycle.spec.js:63–76; e2e/operations-ui.spec.js:145–152. Lưu trạng thái trước/sau."),
]
add_table_before(anchor, "Bảng 4.3. Ca kiểm thử cộng tác, giao diện và vòng đời", headers, rows_c, widths)

heading(anchor, "4.5. Tổng hợp trạng thái lần lập báo cáo", 2)
add_before(anchor, "Checklist gồm 25 ca được chọn theo luồng Vira và liên kết tới test script hiện có. Vì chưa thực thi Playwright trên môi trường ứng dụng trong lần lập báo cáo, trạng thái của cả 25 ca là Chưa chạy; số Pass = 0, Fail = 0, N/A = 0, Not Run = 25. Đây không phải kết quả chất lượng của phiên bản Vira và không được trình bày như test suite đã đạt. Sau lần chạy thực tế, thay Not Run bằng Pass/Fail/N/A có căn cứ và cập nhật thống kê theo bản dựng.")
add_before(anchor, "Ma trận có căn cứ kiểm thử rõ nhất cho các luồng task, version, quyền vai trò, board/Sprint, upload/download và archive/restore vì các flow tương ứng đã được mô tả trong E2E. Các điều kiện chưa có test script phù hợp cần được bổ sung hoặc ghi nhận là khoảng trống bao phủ trước khi kết luận nghiệm thu. Các test script hiện có được xem như đầu vào thiết kế; ảnh, log và actual result chưa phát sinh trong lần lập báo cáo.")
heading(anchor, "4.6. Xử lý lỗi và lưu minh chứng", 2)
add_before(anchor, "Khi một ca Fail, người kiểm thử tạo BUG với mã liên kết TC, tiêu đề ngắn, mức độ/ưu tiên, bước tái hiện, dữ liệu, expected result, actual result, môi trường, ảnh/trace đã khử token, tần suất tái hiện và người nhận xử lý. Lỗi blocker/critical làm mất luồng nghiệp vụ hoặc gây sai lệch dữ liệu nghiêm trọng cần được báo ngay; lỗi khác được ưu tiên theo ảnh hưởng và khả năng tái hiện.")
add_before(anchor, "Sau khi có bản sửa, chạy retest chính ca lỗi và regression các luồng phụ thuộc. Đóng BUG khi kết quả thực tế khớp expected trên đúng bản dựng và bằng chứng được lưu. Nếu không thể tái hiện, giữ trạng thái cần làm rõ và ghi dữ liệu/môi trường đã thử; không chuyển Fail sang Pass chỉ vì lỗi không xuất hiện trong một lần chạy.")
heading(anchor, "4.7. Kết luận phần 4", 2)
add_before(anchor, "Checklist chuyển các chức năng được giao thành 25 ca có dữ liệu/tiền điều kiện, bước, kết quả mong đợi, căn cứ dự án và cách xử lý khi lỗi. Trạng thái lần lập báo cáo là 25 ca Chưa chạy vì chưa có thực thi; bằng chứng hiện tại là test definition trong repository. Sau khi chạy đúng môi trường, cần lưu actual result, ảnh/trace, phiếu lỗi và thống kê Pass/Fail/N/A trước khi dùng kết quả làm căn cứ nghiệm thu.")

# Rewrite the general conclusion and add authoritative version/test-suite sources.
conclusion_texts = [
    "Báo cáo lựa chọn Waterfall làm mô hình tham chiếu cho các điểm kiểm soát kiểm thử chức năng, sử dụng ISO/IEC 25010 để xác định mục tiêu chất lượng, thiết lập bộ tiêu chuẩn hồ sơ SQA, mô tả quy trình thực thi và xây dựng checklist 25 ca cho Vira.",
    "Các ca bao phủ những luồng xác thực, Workspace/Project, task, vai trò, cộng tác, UI, Sprint, file và vòng đời lưu trữ. Test script trong dự án là căn cứ xây dựng expected result; do chưa chạy kiểm thử trên môi trường, cả 25 ca đang ở trạng thái Chưa chạy và chưa có số Pass/Fail thực nghiệm. Đây là giới hạn được giữ rõ trong báo cáo để tránh trình bày dữ liệu suy đoán thành kết quả.",
    "Bước tiếp theo là chốt yêu cầu/tiêu chí chấp nhận, chuẩn bị môi trường và dữ liệu tổng hợp, chạy ca theo kế hoạch, lưu actual result và xử lý/retest mọi lỗi trước khi tổng hợp. Người có thẩm quyền quyết định chấp nhận sản phẩm dựa trên bằng chứng thực thi và mức rủi ro còn lại.",
]
conclusion_index = next(i for i, p in enumerate(doc.paragraphs) if p.text.strip() == "KẾT LUẬN")
reference_heading = next(p for p in doc.paragraphs if p.text.strip() == "TÀI LIỆU THAM KHẢO")
reference_index = next(i for i, p in enumerate(doc.paragraphs) if p.text.strip() == "TÀI LIỆU THAM KHẢO")
conclusion_body = doc.paragraphs[conclusion_index + 1:reference_index]
if len(conclusion_body) != len(conclusion_texts):
    raise ValueError(f"Expected {len(conclusion_texts)} conclusion paragraphs, got {len(conclusion_body)}")
for p, value in zip(conclusion_body, conclusion_texts):
    set_text(p, value)

for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == "TÀI LIỆU THAM KHẢO":
        ref_start = i + 1
        break
refs = [
    "[9] International Organization for Standardization and International Electrotechnical Commission, ISO/IEC 25010:2023, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model, 2023. https://www.iso.org/standard/78176.html.",
    "[10] International Organization for Standardization and International Electrotechnical Commission, ISO/IEC 25010:2011, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models, withdrawn. https://www.iso.org/standard/35733.html.",
    "[11] Vira Project, Playwright E2E test suite and configuration: playwright.config.js; e2e/auth.spec.js; e2e/backlog.spec.js; e2e/lifecycle.spec.js; e2e/operations-ui.spec.js; e2e/platform-flow.spec.js; e2e/roles.spec.js.",
]
existing_refs = [p for p in doc.paragraphs if p.text.strip().startswith("[8]")]
anchor_ref = existing_refs[0] if existing_refs else doc.paragraphs[-1]
for value in refs:
    p = doc.add_paragraph(style="Normal")
    p.add_run(value)
    p.paragraph_format.left_indent = Cm(1)
    p.paragraph_format.first_line_indent = Cm(-1)
    p.paragraph_format.line_spacing = 1.5
    p._p.getparent().remove(p._p)
    anchor_ref._p.addnext(p._p)
    anchor_ref = p

doc.core_properties.title = "Báo cáo cá nhân về kiểm thử chức năng phần mềm cho dự án Vira"
doc.core_properties.subject = "Bài kiểm tra thường xuyên 2 — Kiểm thử chức năng Vira"
doc.core_properties.author = "Nguyễn Văn Phú"
doc.core_properties.keywords = "Vira, SQA, Waterfall, ISO/IEC 25010, functional testing"
doc.save(OUTPUT)
print(OUTPUT)
