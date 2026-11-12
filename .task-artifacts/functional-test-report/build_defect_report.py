from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from shutil import copy2
ROOT=Path(r'C:\Users\ADMIN\OneDrive\Desktop\Vira-project')
SRC=ROOT/'Bao-cao-ca-nhan-Vira-hoan-chinh.docx'
OUT=ROOT/'Bao-cao-ca-nhan-Vira-Dao-Duc-Tam.docx'
copy2(SRC,OUT)
d=Document(OUT)
def para(prefix):
 for p in d.paragraphs:
  if p.text.strip().startswith(prefix): return p
 raise KeyError(prefix)
def setp(p,s):
 if p.runs:
  p.runs[0].text=s
  for r in p.runs[1:]: r._element.getparent().remove(r._element)
 else:p.add_run(s)
def before(a,s,style='Normal',indent=1,bold=False,align=None,line=1.5):
 p=d.add_paragraph(style=style);r=p.add_run(s);r.font.name='Times New Roman';r.font.size=Pt(14);r.bold=bold
 p.paragraph_format.first_line_indent=Cm(indent);p.paragraph_format.line_spacing=line;p.paragraph_format.space_after=Pt(0)
 if align is not None:p.alignment=align
 p._p.getparent().remove(p._p);a._p.addprevious(p._p);return p
def h(a,s,l=2):return before(a,s,style=f'Heading {l}',indent=0,bold=True)
def table(a,caption,headers,rows,widths):
 cp=before(a,caption,indent=0,bold=True,align=WD_ALIGN_PARAGRAPH.CENTER);cp.paragraph_format.keep_with_next=True
 t=d.add_table(rows=1,cols=len(headers));t.style='Table Grid';t.alignment=WD_TABLE_ALIGNMENT.CENTER;t.autofit=False
 for j,v in enumerate(headers):
  c=t.rows[0].cells[j];c.text=v;c.width=Cm(widths[j]);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.CENTER
  sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'D9E2F3');c._tc.get_or_add_tcPr().append(sh)
  for p in c.paragraphs:
   p.alignment=WD_ALIGN_PARAGRAPH.CENTER;p.paragraph_format.line_spacing=1.05;p.paragraph_format.space_after=Pt(0)
   for r in p.runs:r.font.name='Times New Roman';r.font.size=Pt(9);r.bold=True
 t.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))
 for row in rows:
  cells=t.add_row().cells
  for j,v in enumerate(row):
   c=cells[j];c.text=str(v);c.width=Cm(widths[j]);c.vertical_alignment=WD_CELL_VERTICAL_ALIGNMENT.TOP
   mar=OxmlElement('w:tcMar')
   for side,val in [('top',55),('start',65),('bottom',55),('end',65)]:
    x=OxmlElement('w:'+side);x.set(qn('w:w'),str(val));x.set(qn('w:type'),'dxa');mar.append(x)
   c._tc.get_or_add_tcPr().append(mar)
   for p in c.paragraphs:
    p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=1.0;p.paragraph_format.space_after=Pt(0)
    for r in p.runs:r.font.name='Times New Roman';r.font.size=Pt(8.5)
  t.rows[-1]._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
 t._tbl.getparent().remove(t._tbl);a._p.addprevious(t._tbl);return t

# Cover + front matter
cover={
'Thiết lập và vận dụng hệ thống đảm bảo chất lượng phần mềm\ntrọng tâm rà soát mã nguồn':'Thiết lập và vận dụng hệ thống đảm bảo chất lượng phần mềm\ntrọng tâm quản lý và xử lý lỗi',
'Sinh viên: Trần Đức Ngọc':'Sinh viên: Đào Đức Tâm',
'Mã sinh viên: 2023602056':'Mã sinh viên: 2023602015',
'Số thứ tự: 045        Mã đề: TX2-10_11_12-045':'Số thứ tự: 055        Mã đề: TX2-10_11_12-055',
'Nhiệm vụ cá nhân: Rà soát mã nguồn; tập trung vào coding standards, tính bảo trì và phân quyền.':'Nhiệm vụ cá nhân: Thiết lập và vận dụng SQA cho quản lý và xử lý lỗi; tập trung vào ghi nhận, phân loại, phân công, xác minh và đóng lỗi.'}
for a,b in cover.items():setp(para(a),b)
opening=[
'Quản lý lỗi là hoạt động kiểm soát xuyên suốt nhằm bảo đảm sai lệch được mô tả rõ, đánh giá theo mức ảnh hưởng, giao đúng người, xử lý có kiểm chứng và chỉ đóng khi có căn cứ. Một quy trình thiếu thông tin tái hiện hoặc đóng lỗi khi chưa xác minh sẽ làm giảm khả năng truy vết và tăng nguy cơ lỗi tái xuất hiện.',
'Vira là ứng dụng web quản lý dự án và cộng tác công việc theo cấu trúc Workspace – Project – Task/Subtask. Hệ thống có module bug metadata gắn với task loại BUG, các mức severity, quản lý trạng thái công việc, phân quyền thành viên, thông báo và audit. Đây là cơ sở để xây dựng quy trình theo dõi lỗi phù hợp với cấu trúc ứng dụng, đồng thời phân biệt dữ liệu lỗi nghiệp vụ với lỗi phần mềm cần sửa.',
'Báo cáo cá nhân này thiết lập và vận dụng hoạt động SQA cho nhiệm vụ quản lý và xử lý lỗi. Waterfall được chọn làm mô hình tham chiếu cho các điểm kiểm soát từ tiếp nhận đến xác minh và đóng; ISO/IEC 25010 hỗ trợ xác định đặc tính chất lượng gắn với ảnh hưởng của lỗi. Các trạng thái và phân loại đề xuất trong báo cáo được nhận diện là quy ước phục vụ nhiệm vụ cá nhân, không khẳng định đã được cấu hình đầy đủ trong ứng dụng.',
'Nội dung gồm lựa chọn mô hình và tiêu chuẩn; tiêu chuẩn tài liệu SQA; quy trình xử lý lỗi; checklist theo dõi áp dụng cho Vira và phiếu ghi nhận các phát hiện liên quan. Bằng chứng mã nguồn hiện có được dùng để minh họa tiếp nhận và theo dõi; trạng thái Đã sửa/Đã đóng chỉ được xác nhận sau khi có bản sửa và kết quả xác minh tương ứng.']
for i,v in enumerate(opening,13):setp(d.paragraphs[i],v)
# Abbreviations add BUG after E2E, existing slot count 7: repurpose TC/UAT/.. from source report
abbr=['API — Giao diện lập trình ứng dụng (Application Programming Interface)','BUG — Lỗi phần mềm hoặc công việc loại BUG trong Vira (Bug)','E2E — Kiểm thử đầu cuối (End-to-End Testing)','ISO/IEC — Tổ chức Tiêu chuẩn hóa Quốc tế / Ủy ban Kỹ thuật Điện Quốc tế','SQA — Đảm bảo chất lượng phần mềm (Software Quality Assurance)','UI — Giao diện người dùng (User Interface)','UAT — Kiểm thử chấp nhận người dùng (User Acceptance Testing)']
for i,v in enumerate(abbr[:6],18):setp(d.paragraphs[i],v)
setp(d.paragraphs[24],'')
# TOC
start=next(i for i,p in enumerate(d.paragraphs) if p.text.strip()=='MỤC LỤC')+1
secidx=next(i for i,p in enumerate(d.paragraphs) if p.text.strip().startswith('1. LỰA CHỌN'))
toc=[p for p in d.paragraphs[start:secidx] if '\t' in p.text]
items=[('Lời mở đầu',0),('Danh mục từ viết tắt',0),('1. Lựa chọn mô hình phát triển và tiêu chuẩn chất lượng',0),('1.1. Phạm vi và mục tiêu lựa chọn',1),('1.2. Mô hình Waterfall',1),('1.3. ISO/IEC 25010 và đặc tính chất lượng',1),('1.4. Kết luận phần 1',1),('2. Thiết lập bộ tiêu chuẩn tài liệu SQA',0),('2.1. Mục đích và phạm vi áp dụng',1),('2.2. Cấu trúc chung của tài liệu SQA',1),('2.3. Mã, tên và danh mục tài liệu',1),('2.4. Quản lý phiên bản',1),('2.5. Người soạn, người rà soát và người phê duyệt',1),('2.6. Nội dung và bảo mật',1),('2.7. Lưu trữ và truy vết',1),('2.8. Kết luận phần 2',1),('3. Quy trình SQA phục vụ quản lý và xử lý lỗi',0),('3.1. Mục tiêu và phạm vi',1),('3.2. Vai trò và đầu vào',1),('3.3. Thông tin lỗi và phân loại',1),('3.4. Trình tự xử lý lỗi',1),('3.5. Trạng thái, chấp nhận và điều kiện đóng',1),('3.6. Đầu ra và minh chứng',1),('3.7. Rủi ro quy trình cá nhân',1),('3.8. Kết luận phần 3',1),('4. Checklist theo dõi và xử lý lỗi áp dụng cho Vira',0),('4.1. Phạm vi và cách đánh giá',1),('4.2. Checklist tiếp nhận và phân loại',1),('4.3. Checklist phân công và xử lý',1),('4.4. Checklist xác minh và đóng lỗi',1),('4.5. Phiếu theo dõi phát hiện Vira',1),('4.6. Tổng hợp trạng thái và xử lý lỗi chưa đạt',1),('4.7. Kết luận phần 4',1),('Kết luận',0),('Tài liệu tham khảo',0)]
from docx.shared import Cm
for i,(lab,lev) in enumerate(items):
 p=toc[i] if i<len(toc) else d.add_paragraph()
 if i>=len(toc):toc[-1]._p.addnext(p._p);toc.append(p)
 setp(p,lab+'\t00');p.paragraph_format.left_indent=Cm(.6*lev);p.paragraph_format.first_line_indent=Cm(0);p.paragraph_format.line_spacing=1.0;p.paragraph_format.space_after=Pt(0)
 for r in p.runs:r.font.name='Times New Roman';r.font.size=Pt(11);r.bold=(lev==0)
for p in toc[len(items):]:p._p.getparent().remove(p._p)
# Section 1: rewrite relevant paragraphs by headings/known prefix
setp(para('1.2. Mô hình phát triển được lựa chọn'),'1.2. Mô hình phát triển Waterfall')
setp(para('1.3. Tiêu chuẩn/mô hình chất lượng được lựa chọn'),'1.3. Tiêu chuẩn chất lượng ISO/IEC 25010')
for p in d.paragraphs:
 if p.text.strip()=='1.2.3. Vị trí và quan hệ của hoạt động rà soát':setp(p,'1.2.3. Vị trí của quản lý lỗi trong vòng đời')
 if p.text.strip()=='1.3.2. Các đặc tính áp dụng vào rà soát mã nguồn':setp(p,'1.3.2. Đặc tính áp dụng vào quản lý lỗi')
 if p.text.strip()=='1.3.3. Chuyển mô hình thành tiêu chí có thể kiểm tra':setp(p,'1.3.3. Chuyển đặc tính thành tiêu chí phân loại')
 if p.text.startswith('Trong phạm vi cá nhân, mục tiêu là xây dựng cách rà soát'):
  setp(p,'Trong phạm vi cá nhân, mục tiêu là xây dựng quy trình theo dõi và xử lý phát hiện có trách nhiệm rõ ràng từ khi tiếp nhận đến khi đóng. Trọng tâm gồm ghi nhận đủ thông tin, đánh giá severity/priority, phân công, cập nhật trạng thái, xác minh bản sửa và lưu minh chứng. Checklist minh họa áp dụng với các phát hiện có căn cứ trong repository Vira.')
 if p.text.startswith('Waterfall được lựa chọn làm mô hình tham chiếu vì giúp xác định thời điểm'):
  setp(p,'Waterfall được chọn làm mô hình tham chiếu để đặt điểm kiểm soát quản lý lỗi theo đầu ra từng giai đoạn: sai lệch được phát hiện, ghi nhận, đánh giá và phân công; bản sửa được xác minh trước nghiệm thu. Cách tổ chức này tạo hồ sơ rõ ràng cho nhiệm vụ cá nhân và giúp kiểm soát thông tin xuyên suốt vòng đời lỗi.')
 if p.text.startswith('Mô hình hỗ trợ lập quy trình có trình tự'):
  setp(p,'Quy trình đề xuất gồm tiếp nhận và sàng lọc, bổ sung thông tin, phân loại, phân công, phân tích và sửa, xác minh, đóng hoặc mở lại. Mỗi bước có đầu vào/đầu ra, người chịu trách nhiệm và bằng chứng; cho phép dừng ở trạng thái chờ khi thiếu căn cứ hoặc phụ thuộc quyết định nghiệp vụ.')
 if p.text.startswith('Trong báo cáo, Waterfall là cơ sở tổ chức hoạt động SQA cá nhân'):
  setp(p,'Trong báo cáo, Waterfall là mô hình tham chiếu để tổ chức hồ sơ cá nhân, không khẳng định toàn bộ Vira được phát triển theo mô hình này. Việc sản phẩm hỗ trợ Kanban/Sprint không quyết định lifecycle phát triển. Lỗi phát hiện ở giai đoạn khác vẫn cần được chuyển qua cùng trạng thái có truy vết, không bỏ qua phân loại hay xác minh.')
# Replace all inherited source-review discussion in section 1 with defect-management rationale.
sec1_repls={
"Vira là ứng dụng web quản lý dự án và cộng tác công việc theo cấu trúc Workspace":"Vira là ứng dụng web quản lý dự án và cộng tác công việc theo cấu trúc Workspace – Project – Task/Subtask, hỗ trợ Kanban, Backlog, Sprint, phân quyền và cộng tác. Backend Java/Spring Boot được tổ chức theo module nghiệp vụ; module bug lưu metadata cho task loại BUG.",
"Trong phạm vi cá nhân, mục tiêu là xây dựng cách rà soát có căn cứ":"Trong phạm vi cá nhân, mục tiêu là xây dựng quy trình quản lý lỗi có truy vết từ tiếp nhận đến đóng; ghi đủ thông tin tái hiện, đánh giá ảnh hưởng, phân công, xác minh bản sửa và lưu bằng chứng. Checklist áp dụng các điểm kiểm soát vào module và phát hiện có căn cứ trong Vira.",
"Waterfall được lựa chọn làm mô hình tham chiếu vì giúp xác định thời điểm":"Waterfall được chọn làm mô hình tham chiếu để đặt điểm kiểm soát quản lý lỗi theo các đầu ra tuần tự: phát hiện được ghi nhận, triage, phân công, sửa và xác minh trước nghiệm thu. Cách tổ chức này giúp cá nhân kiểm soát lịch sử và trách nhiệm ở từng bước.",
"Mô hình hỗ trợ lập quy trình có trình tự":"Quy trình đề xuất gồm tiếp nhận, sàng lọc, phân loại, phân công, xử lý, xác minh, đóng hoặc mở lại. Mỗi bước có vai trò, đầu vào, đầu ra và bằng chứng; có nhánh chờ khi thiếu thông tin hoặc cần quyết định nghiệp vụ.",
"Trong báo cáo, Waterfall là cơ sở tổ chức hoạt động SQA cá nhân":"Trong báo cáo, Waterfall là mô hình tham chiếu, không khẳng định toàn bộ Vira được phát triển theo mô hình này. Sản phẩm có Kanban/Sprint không quyết định lifecycle. Lỗi phát hiện ở giai đoạn nào cũng cần được đưa vào cùng luồng trạng thái có truy vết.",
"Hoạt động rà soát mã nguồn được đặt sau lập trình":"Quản lý lỗi tiếp nhận các sai lệch được phát hiện qua yêu cầu, review, kiểm thử hoặc phản hồi sử dụng. Quy trình không thay hoạt động sửa mã hay kiểm thử; nó điều phối thông tin, quyết định và bằng chứng giữa người báo, triager, người xử lý và verifier.",
"Để thống nhất với Bài 05 của học phần":"Báo cáo tham chiếu mô hình sản phẩm ISO/IEC 25010:2011 theo Bài 05, đồng thời ghi chú bản 2011 đã được rút và bản 2023 là phiên bản mới hơn [4], [9], [10]. Mô hình hỗ trợ xác định ảnh hưởng của lỗi lên tính phù hợp chức năng, bảo mật, độ tin cậy và khả năng sử dụng; không quy định severity, priority hoặc workflow cụ thể và không chứng nhận Vira.",
"Khả năng bảo trì (Maintainability) được ưu tiên":"Tính phù hợp chức năng là căn cứ xác định chức năng có sai/thiếu so với yêu cầu; Security được ưu tiên khi lỗi có thể làm vượt quyền hoặc lộ dữ liệu; Reliability xem xét khi lỗi gây gián đoạn hoặc mất dữ liệu. Severity phản ánh tác động; priority phản ánh thứ tự xử lý theo release và nguồn lực, nên hai nhãn cần tách biệt.",
"Bảo mật (Security) được lựa chọn":"Phát hiện có thể liên quan nhiều đặc tính chất lượng cùng lúc. Người triage ghi ảnh hưởng quan sát được, nhóm người dùng bị tác động, phạm vi dữ liệu, workaround và yêu cầu tham chiếu; khi thiếu chính sách, chuyển Chờ xác nhận thay vì khẳng định lỗi phân quyền.",
"Tính phù hợp chức năng (Functional suitability) được dùng":"Quản lý lỗi còn cần hồ sơ dễ hiểu, tái hiện được, trạng thái nhất quán và lịch sử không bị ghi đè. Các mục tiêu này được chuyển thành tiêu chí về chất lượng phiếu, phân công, retest và điều kiện đóng; đó là quy ước quy trình của báo cáo, không phải thang điểm ISO.",
"Độ tin cậy (Reliability) chỉ được xem xét":"Severity/priority được đề xuất để giúp triage có căn cứ, không phải phân loại chính thức đã cấu hình trong Vira. BugSeverity hiện có LOW, MEDIUM, HIGH, CRITICAL; bug metadata chưa thể hiện priority riêng. Quy trình đề xuất ghi priority ngoài enum cho đến khi nhóm quyết định mở rộng sản phẩm.",
"ISO/IEC 25010 cung cấp nhóm đặc tính chất lượng":"Mỗi lỗi cần liên kết phát hiện → yêu cầu/tiêu chí → bằng chứng → người phụ trách → commit/build → kết quả xác minh → quyết định đóng. Với vấn đề phụ thuộc chính sách, yêu cầu phải được xác nhận trước khi xem đó là defect đã kết luận.",
"Waterfall được chọn làm mô hình tham chiếu để xác định vị trí":"Waterfall cung cấp trình tự điểm kiểm soát quản lý lỗi; ISO/IEC 25010 giúp xem xét ảnh hưởng của lỗi lên đặc tính chất lượng phù hợp. Quy trình triage và thang severity/priority được đề xuất riêng để đáp ứng nhiệm vụ cá nhân, làm cơ sở cho phần tài liệu, quy trình và checklist.",
}
for pref,val in sec1_repls.items():
 try:setp(para(pref),val)
 except KeyError:pass
# Tailor section 2 paragraphs
repls={
'Bộ tiêu chuẩn tài liệu SQA quy định cách nhận diện':'Bộ tiêu chuẩn tài liệu SQA quy định cách tạo, cập nhật, phân công rà soát, phê duyệt và lưu hồ sơ quản lý lỗi trong Vira. Mục tiêu là mọi lỗi có mã định danh, thông tin tái hiện đủ, mức độ và người phụ trách rõ, lịch sử thay đổi được lưu, và chỉ đóng sau khi có căn cứ xác minh.',
'Tiêu chuẩn áp dụng cho tài liệu cá nhân phục vụ rà soát mã nguồn':'Tiêu chuẩn áp dụng cho kế hoạch quản lý lỗi, quy trình/flow trạng thái, checklist tiếp nhận và xử lý, phiếu lỗi, nhật ký phân công, xác minh/retest và báo cáo tổng hợp. Căn cứ gồm quy định môn học và artefact hiện có của Vira như Bug task/metadata, task status, audit và exception response.',
'Mỗi tài liệu cần có khối thông tin kiểm soát':'Mỗi hồ sơ cần có mã, tên, phiên bản, thời điểm, người lập, người rà soát/phê duyệt, trạng thái và liên kết dự án/module. Phiếu lỗi ghi tiêu đề, mô tả, bước tái hiện, điều kiện/dữ liệu, expected/actual, môi trường/bản dựng, severity, priority, người báo/người xử lý, minh chứng, trạng thái, ngày hạn và lịch sử xác minh/đóng.',
'Mã tài liệu sử dụng cấu trúc VIRA-SQA':'Mã tài liệu sử dụng cấu trúc VIRA-SQA-[LOẠI]-[SỐ]. Phiếu lỗi dùng BUG-[MODULE]-[YYYYMMDD]-[SỐ] hoặc mã hệ thống cấp; mã duy nhất giữ nguyên qua mọi lần chuyển trạng thái. Tên file dùng mẫu VIRA-DEFECT-[BUG-ID]-v[MAJOR.MINOR]_[YYYYMMDD].docx; ảnh/log gắn BUG-ID và lần tái hiện.',
'Danh mục hồ sơ được đề xuất gồm':'Danh mục đề xuất gồm VIRA-SQA-PLN-DEF-01 (kế hoạch quản lý lỗi); VIRA-SQA-PROC-DEF-01 (quy trình xử lý lỗi); VIRA-SQA-CHK-TRIAGE-01 (checklist tiếp nhận/triage); VIRA-SQA-DEF-01 (mẫu phiếu lỗi); VIRA-SQA-LOG-DEF-01 (nhật ký trạng thái và phân công); VIRA-SQA-VERIFY-01 (hồ sơ xác minh/retest); và VIRA-SQA-SUM-DEF-01 (báo cáo tổng kết). Đây là mã đề xuất cho tiểu luận, không khẳng định biểu mẫu đã được triển khai trong hệ thống Vira.',
'Trong rà soát code, tác giả mã nguồn và reviewer':'Người phát hiện lập phiếu và cung cấp thông tin; triager xác nhận hợp lệ, severity/priority và nhóm phụ trách; người xử lý phân tích/sửa; verifier xác minh bản sửa và regression; chủ nhiệm dự án/người hướng dẫn quyết định chấp nhận rủi ro hoặc đóng khi cần. Với báo cáo cá nhân, có thể kiêm vai nhưng phải ghi rõ và xin người hướng dẫn xem xét lỗi nghiêm trọng/chính sách.',
'Tài liệu dùng tiếng Việt cho thuyết minh':'Tài liệu dùng tiếng Việt, giữ nguyên status, endpoint, class/field và severity enum khi trích mã. Mô tả lỗi cần trung tính, tách sự kiện khỏi giả thuyết nguyên nhân; mỗi ảnh/log có chú thích và che thông tin nhạy cảm.',
'Tài liệu được lưu trong thư mục riêng':'Hồ sơ được lưu trong thư mục có quyền truy cập phù hợp và liên kết BUG-ID → yêu cầu/tiêu chí → bằng chứng tái hiện → người xử lý/commit → phiên bản sửa → kết quả xác minh → quyết định đóng. Không xóa lịch sử khi lỗi mở lại; ghi sự kiện chuyển trạng thái, người thao tác và thời gian.'}
# replace prefix paragraphs with text, avoid missing ones
for pref,txt in repls.items():
 try:setp(para(pref),txt)
 except KeyError:pass
# Replace old section 3 content and section 4 content to correct headings
sec3=para('3. QUY TRÌNH SQA PHỤC VỤ RÀ SOÁT MÃ NGUỒN');sec4=para('4. CHECKLIST RÀ SOÁT MÃ NGUỒN')
el=sec3._p.getnext()
while el is not None and el is not sec4._p:
 nxt=el.getnext();el.getparent().remove(el);el=nxt
setp(sec3,'3. QUY TRÌNH SQA PHỤC VỤ QUẢN LÝ VÀ XỬ LÝ LỖI')
anchor=sec4
h(anchor,'3.1. Mục tiêu và phạm vi')
before(anchor,'Quy trình bảo đảm lỗi được tiếp nhận, sàng lọc, phân loại, phân công, phân tích, sửa, xác minh và đóng theo một luồng có trạng thái và lịch sử. Phạm vi gồm lỗi chức năng, phân quyền, dữ liệu, giao diện và tích hợp phát hiện trong Vira; yêu cầu thay đổi hoặc câu hỏi nghiệp vụ được tách khỏi defect cho đến khi xác nhận sai khác so với yêu cầu.')
before(anchor,'Quy trình quản lý áp dụng cho task loại BUG và bug metadata trong hệ thống Vira, cùng hồ sơ theo dõi cá nhân. Mã nguồn hiện có endpoint GET/PUT bug detail gắn với task, trường severity, environment, reproductionSteps, expected/actual và affectedVersion. Tài liệu này đề xuất vòng đời/triage; không khẳng định Vira đã có sẵn các trạng thái workflow defect như New, Assigned, Resolved, Verified hay Closed.')
h(anchor,'3.2. Vai trò và đầu vào')
before(anchor,'Người báo lỗi ghi nhận sự kiện và minh chứng; triager sàng lọc trùng lặp, xác định đủ thông tin, loại sự việc và mức severity/priority; người phụ trách module được phân công điều tra/sửa; verifier kiểm tra bản sửa, chạy lại ca tái hiện và regression liên quan; chủ nhiệm dự án/người hướng dẫn quyết định chấp nhận rủi ro hoặc ngoại lệ. Trong nhiệm vụ cá nhân, vai trò có thể kiêm nhiệm nhưng phải ghi rõ.')
before(anchor,'Đầu vào gồm yêu cầu và tiêu chí chấp nhận, task/Project liên quan, bản dựng/commit, môi trường, dữ liệu, bước tái hiện, kết quả kỳ vọng/thực tế, log/ảnh/trace, severity đề xuất và lịch sử lỗi tương tự. Thiếu thông tin được chuyển trạng thái Cần bổ sung; không phân công sửa như defect đã xác nhận nếu chưa tái hiện hoặc chưa có căn cứ phù hợp.')
h(anchor,'3.3. Thông tin lỗi và phân loại')
before(anchor,'Phiếu ghi lỗi bắt buộc có BUG-ID, tiêu đề mô tả triệu chứng, module/chức năng, người báo và ngày, môi trường/bản dựng, điều kiện trước, dữ liệu đã khử nhạy cảm, các bước tối thiểu tái hiện, expected result, actual result, severity, priority đề xuất, tần suất, phạm vi ảnh hưởng, tệp minh chứng, người phụ trách, trạng thái và lịch sử cập nhật. Một phiếu nên mô tả một vấn đề có thể xử lý độc lập.')
before(anchor,'Thang severity đề xuất: Critical khi gây lộ/mất dữ liệu, vượt quyền nghiêm trọng hoặc chặn luồng cốt lõi không có workaround; High khi sai quyền, sai dữ liệu hoặc chức năng trọng yếu bị ảnh hưởng đáng kể; Medium khi chức năng lỗi nhưng có cách thay thế; Low khi ảnh hưởng nhỏ về hiển thị/nội dung. Priority P1–P4 xếp thứ tự theo thời hạn, phạm vi release và nguồn lực. Severity phản ánh tác động; priority quyết định thứ tự xử lý; hai giá trị được ghi riêng.')
before(anchor,'Phân biệt defect với yêu cầu mới, câu hỏi sử dụng, dữ liệu test sai và sự cố môi trường. Lỗi trùng liên kết BUG-ID gốc; lỗi chính sách cần quyết định được đặt Chờ xác nhận; lỗi không tái hiện ghi rõ cấu hình và lần thử, không tự chuyển sang Đã đóng. Phân loại phải có căn cứ và có thể điều chỉnh khi phạm vi ảnh hưởng rõ hơn.')
h(anchor,'3.4. Trình tự xử lý lỗi')
steps=[('3.4.1. Tiếp nhận và sàng lọc','Gán ID, kiểm tra trùng, thuộc sản phẩm hay môi trường, đúng dự án và có thể đọc được. Kiểm tra mô tả, bước, expected/actual, môi trường và minh chứng. Nếu thiếu, yêu cầu bổ sung; nếu là yêu cầu thay đổi, chuyển backlog phù hợp và giữ liên kết nguồn.'),('3.4.2. Phân loại và đánh giá ưu tiên','Đối chiếu yêu cầu và hành vi quan sát; ước lượng ảnh hưởng tới chức năng, bảo mật, dữ liệu, người dùng và workaround. Gán severity/priority có lý do, xác định nhóm/module và người cần thông báo. Triage có thể đổi nhãn sau khi có thêm bằng chứng.'),('3.4.3. Phân công và phân tích','Chỉ định một người chịu trách nhiệm chính, ngày dự kiến và tiêu chí hoàn tất. Người xử lý tái hiện trên môi trường kiểm soát, phân tích nguyên nhân, ghi hướng sửa và đánh giá module/ca hồi quy bị ảnh hưởng. Nếu không đồng ý, phản hồi kèm căn cứ; không xóa phiếu.'),('3.4.4. Sửa lỗi và cập nhật trạng thái','Thực hiện sửa trong nhánh/commit nhận diện được; liên kết commit, pull request hoặc bản dựng với BUG-ID. Cập nhật trạng thái sang Đang xử lý rồi Chờ xác minh khi bản sửa sẵn sàng. Nếu bị chặn bởi yêu cầu/phụ thuộc, ghi nguyên nhân và người cần quyết định.'),('3.4.5. Xác minh và regression','Verifier dùng lại bước, dữ liệu và môi trường đã ghi; so sánh actual với expected trên đúng bản sửa. Nếu đạt, chạy regression theo rủi ro và lưu kết quả; nếu không đạt hoặc phát sinh lỗi mới, giữ/mở lại BUG, bổ sung bằng chứng và trả người xử lý.'),('3.4.6. Đóng, hoãn hoặc mở lại','Đóng khi defect được xác minh trên bản dựng đã ghi, regression cần thiết đạt, minh chứng đầy đủ và không còn hành động bắt buộc; người có quyền ghi quyết định. Hoãn/chấp nhận rủi ro cần lý do, người phê duyệt, ngày xem lại và liên kết backlog. Mở lại khi tái xuất hiện hoặc xác minh thất bại; giữ lịch sử.'),('3.4.7. Tổng hợp và cải tiến','Tổng hợp lỗi theo trạng thái, severity, module, tuổi lỗi, thời gian xử lý, lỗi mở lại và bản dựng; nêu giới hạn dữ liệu. Dùng xu hướng để cập nhật checklist, regression, yêu cầu hoặc hướng dẫn; không dùng số lỗi đơn lẻ để kết luận chất lượng khi thiếu mẫu số/phạm vi.')]
for title,body in steps:h(anchor,title,3);before(anchor,body)
h(anchor,'3.5. Trạng thái, chấp nhận và điều kiện đóng',2)
before(anchor,'Luồng trạng thái đề xuất: Mới → Cần bổ sung/Triage → Đã phân loại → Đã phân công → Đang xử lý → Chờ xác minh → Đã xác minh → Đã đóng. Nhánh ngoại lệ gồm Trùng lặp, Không phải lỗi, Chờ quyết định, Hoãn/Chấp nhận rủi ro và Mở lại. Đây là trạng thái quy trình đề xuất; status của task Vira không mặc nhiên đồng nghĩa workflow defect.')
before(anchor,'Một phiếu đủ điều kiện tiếp nhận khi có ID, triệu chứng, phạm vi, môi trường, bước tái hiện hoặc lý do chưa thể tái hiện, expected/actual và minh chứng phù hợp. Đủ điều kiện phân công khi có triage sơ bộ, mức ưu tiên, người phụ trách và tiêu chí sửa. Đủ điều kiện đóng khi verifier xác nhận trên đúng bản dựng, ca tái hiện đạt, regression theo rủi ro đạt, hồ sơ đầy đủ và quyết định đóng được ghi.')
h(anchor,'3.6. Đầu ra và minh chứng',2)
before(anchor,'Đầu ra gồm phiếu defect, danh sách triage, phân công/hạn, liên kết commit/bản dựng, kết quả xác minh/retest, quyết định ngoại lệ, lịch sử trạng thái và báo cáo. Bằng chứng gồm ảnh/video ngắn, log, request/response đã che bí mật, dữ liệu tái hiện tổng hợp, test result và mã commit. Tên tệp có BUG-ID, ngày, lần chạy; quyền truy cập hạn chế theo nhu cầu.')
h(anchor,'3.7. Rủi ro quy trình cá nhân',2)
before(anchor,'Một cá nhân có thể vừa báo, triage và xác minh nên có nguy cơ tự xác nhận thiên lệch. Với lỗi Critical/High, lỗi quyền truy cập hoặc quyết định chấp nhận rủi ro, cần đề nghị người hướng dẫn/người phụ trách độc lập xem xét. Nếu không có reviewer khác, ghi rõ giới hạn và tránh kết luận đã đóng như quyết định chính thức của dự án.')
h(anchor,'3.8. Kết luận phần 3',2)
before(anchor,'Quy trình đã quy định mục tiêu, phạm vi, vai trò, đầu vào, nội dung phiếu, severity/priority, các bước tiếp nhận–triage–phân công–sửa–xác minh–đóng, trạng thái, điều kiện chấp nhận và cách lưu bằng chứng. Checklist phần sau áp dụng các điểm kiểm soát này vào Vira.')

setp(sec4,'4. CHECKLIST THEO DÕI VÀ XỬ LÝ LỖI ÁP DỤNG CHO VIRA')
conclusion_heading=next(p for p in d.paragraphs if p.text.strip()=='KẾT LUẬN')
el=sec4._p.getnext()
while el is not None and el is not conclusion_heading._p:
 nxt=el.getnext();el.getparent().remove(el);el=nxt
h(anchor,'4.1. Phạm vi và cách đánh giá',2)
before(anchor,'Checklist tập trung vào quy trình defect lifecycle, hồ sơ, phân loại, phân công, xác minh và đóng; đồng thời đối chiếu với mã nguồn quản lý bug metadata và các phát hiện tĩnh hiện có trong Vira. Căn cứ chính gồm BugController/BugService/UpsertBugRequest/BugSeverity, ApiExceptionHandler, ProjectService, TaskAuthorizationService và module audit/task. Các mục quy trình là quy định đề xuất, không khẳng định workflow đã có sẵn.')
before(anchor,'Đạt nghĩa là bằng chứng trong phạm vi cho thấy tiêu chí hiện hữu/đáp ứng; Không đạt là có thiếu hụt hoặc sai khác có căn cứ; Không áp dụng dùng khi tiêu chí ngoài phạm vi với lý do. Đề xuất nghĩa chưa có bằng chứng quy trình đã ban hành; Chờ xác nhận nghĩa cần quyết định hoặc xác minh thêm. Checklist tĩnh không chứng minh hành vi runtime hay defect đã được sửa.')
headers=['Mã','Tiêu chí và nội dung kiểm tra','Cách đánh giá','Kết quả','Minh chứng trong dự án','Hướng xử lý nếu không đạt']; widths=[.8,3.1,2.7,1.3,3.4,3.6]
h(anchor,'4.2. Checklist tiếp nhận và phân loại',2)
rows1=[('D01','Phiếu lỗi có mã duy nhất và tiêu đề mô tả triệu chứng.','Kiểm tra biểu mẫu/quy ước có BUG-ID, title và chống trùng.','Đề xuất','VIRA-SQA-DEF-01 là biểu mẫu đề xuất; chưa xác nhận defect workflow chính thức.','Ban hành mẫu; dùng mã duy nhất, không tái sử dụng ID.'),('D02','Phiếu ghi bước tái hiện, tiền điều kiện, dữ liệu, expected và actual.','Đối chiếu trường bắt buộc và khả năng người khác tái hiện.','Đạt một phần','UpsertBugRequest.java:13–29 có reproductionSteps, expectedResult, actualResult nhưng không bắt buộc; BugService chuẩn hóa rỗng thành null.','Bổ sung bắt buộc trong hồ sơ triage; cân nhắc validate nếu mở rộng workflow.'),('D03','Phiếu ghi môi trường và phiên bản bị ảnh hưởng.','Kiểm tra environment và affectedVersion hoặc lý do thiếu.','Đạt một phần','UpsertBugRequest.java:12–34; BugService.java:39–44 lưu nhưng cho phép null.','Bắt buộc trong hồ sơ xử lý dù API hiện cho phép null.'),('D04','Severity có tập giá trị hợp lệ và được kiểm tra bắt buộc.','Đối chiếu enum, @NotNull và @Valid tại endpoint.','Đạt','BugSeverity.java:3–8 LOW/MEDIUM/HIGH/CRITICAL; UpsertBugRequest.java:16; BugController.java:30.','Nếu thêm mức Blocker cần cập nhật enum, schema/UI/API và tương thích.'),('D05','Severity và priority được phân biệt.','Kiểm tra hồ sơ có hai trường và định nghĩa riêng.','Không đạt','BugSeverity.java có severity; bug metadata không có priority riêng.','Ghi priority ở hồ sơ quy trình hoặc đặc tả thay đổi API/UI/schema.'),('D06','Lỗi trùng, không tái hiện, yêu cầu mới và lỗi môi trường có phân loại.','Đọc hướng dẫn triage và trạng thái ngoại lệ.','Đề xuất','Chưa tìm thấy workflow defect state chính thức; báo cáo đề xuất nhánh ngoại lệ.','Ban hành quy tắc; liên kết lỗi trùng; giữ chờ khi thiếu căn cứ.'),('D07','Minh chứng được khử thông tin nhạy cảm và liên kết BUG-ID.','Rà tên ảnh/log và quyền lưu.','Đề xuất','AGENTS.md cấm commit .env/API key/mật khẩu thật; quy tắc lưu hồ sơ đề xuất.','Che token/mật khẩu; dùng dữ liệu tổng hợp và quyền tối thiểu.')]
table(anchor,'Bảng 4.1. Checklist tiếp nhận và phân loại lỗi',headers,rows1,widths)
h(anchor,'4.3. Checklist phân công và xử lý',2)
rows2=[('A01','Mỗi lỗi hợp lệ có người chịu trách nhiệm chính và thời điểm theo dõi.','Kiểm tra phiếu có assignee, due/review date hoặc lý do chờ.','Đề xuất','Chưa xác nhận defect workflow; task assignee trong README không tương đương defect owner.','Triage chỉ định owner và theo dõi lỗi quá hạn.'),('A02','Phân công đúng module/chuyên môn và ghi người tiếp nhận.','Đối chiếu module/người xử lý và lịch sử chuyển giao.','Đề xuất','AGENTS.md mô tả module backend; chưa có ma trận người phụ trách thực tế.','Duy trì ma trận module–owner và ghi mọi bàn giao.'),('A03','Người xử lý liên kết bản sửa/commit với BUG-ID.','Kiểm tra ref code/build và tiêu chí hoàn tất.','Đề xuất','Có source/Git nhưng chưa có bằng chứng commit cho các finding nêu.','Không chuyển Chờ xác minh nếu thiếu commit/build hoặc giải thích.'),('A04','Phát hiện có căn cứ được phân biệt với câu hỏi chính sách.','Đối chiếu yêu cầu và trạng thái chờ quyết định.','Chờ xác nhận','F-02 từ rà soát trước cần người phụ trách xác nhận chính sách archived.','Không kết luận lỗi quyền trước quyết định; ghi người quyết định/hạn.'),('A05','Severity và priority có lý do, người triage và lịch sử thay đổi.','Kiểm tra hai trường riêng, rationale và history.','Không đạt','BugSeverity.java chỉ có severity; metadata không có priority riêng.','Bổ sung priority vào quy trình/hồ sơ hoặc đặc tả tính năng; giữ lý do đổi mức.'),('A06','Lỗi nghiêm trọng được thông báo đúng đầu mối và có escalation.','Rà quy tắc người nhận, thời hạn phản hồi và escalation.','Đề xuất','Chưa có SLA/escalation defect workflow được xác nhận trong cấu hình đã cung cấp.','Chốt SLA; ghi thời điểm báo, người nhận và phản hồi.'),('A07','Lỗi bị chặn/hoãn có lý do, phụ thuộc và ngày xem lại.','Kiểm tra trạng thái Blocked/Deferred và người quyết định.','Đề xuất','Cần ban hành trong hồ sơ quản lý lỗi cá nhân.','Không để lỗi mở không owner; đặt ngày xem hoặc quyết định rủi ro.')]
table(anchor,'Bảng 4.2. Checklist phân công và xử lý lỗi',headers,rows2,widths)
h(anchor,'4.4. Checklist xác minh và đóng lỗi',2)
rows3=[('V01','Bản sửa gắn với commit/build nhận diện được.','Đối chiếu BUG-ID, commit, build và thời điểm triển khai test.','Đề xuất','Bug APIs lưu metadata nhưng không chứng minh liên kết PR/commit.','Ghi ref code/build; không xác minh trên bản không xác định.'),('V02','Verifier chạy lại bước tái hiện trên đúng môi trường và dữ liệu.','So sánh expected/actual ban đầu với kết quả sau sửa.','Đề xuất','e2e/platform-flow.spec.js:141–147 kiểm tra bug metadata, không phải retest fix.','Lưu lần chạy, environment/build, ảnh/log và actual.'),('V03','Regression được chọn theo luồng phụ thuộc và rủi ro.','Kiểm tra test quyền/dữ liệu/module liên quan.','Đề xuất','e2e có role/platform/lifecycle flows; cần map vào từng thay đổi.','Liên kết danh sách regression, ghi kết quả và phần chưa chạy.'),('V04','Chỉ đóng sau xác minh đạt, đủ minh chứng và không còn hành động bắt buộc.','Rà điều kiện đóng, verifier và approver.','Đề xuất','Chưa xác nhận workflow defect state chính thức.','Giữ Chờ xác minh khi thiếu bằng chứng; ghi người quyết định đóng.'),('V05','Lỗi không đạt xác minh được mở lại, giữ lịch sử.','Kiểm tra trường hợp retest fail/tái xuất hiện.','Đề xuất','Quy trình đề xuất trạng thái Mở lại và lịch sử từng lần test.','Liên kết lần mở lại, cập nhật severity nếu ảnh hưởng tăng, giao lại owner.'),('V06','Lỗi trùng/hoãn/không sửa có căn cứ và người chấp thuận.','Rà liên kết BUG gốc hoặc quyết định ngoại lệ.','Đề xuất','Chưa có hồ sơ chấp nhận rủi ro chính thức được cung cấp.','Ghi lý do, approver, ngày xem lại và ảnh hưởng còn lại.')]
table(anchor,'Bảng 4.3. Checklist xác minh và đóng lỗi',headers,rows3,widths)
h(anchor,'4.5. Phiếu theo dõi phát hiện Vira',2)
before(anchor,'Các dòng sau minh họa cách đưa phát hiện rà soát mã nguồn hiện có vào quy trình; không khẳng định đã giao hoặc sửa. F-01 là vấn đề rõ nghĩa tên phương thức; F-02 cần người có thẩm quyền xác nhận chính sách archived. Severity dưới đây là đề xuất triage, không thay quyết định dự án.')
ih=['BUG-ID / nguồn','Mô tả và minh chứng','Severity / Priority đề xuất','Người xử lý / tiêu chí hoàn tất','Trạng thái và minh chứng tiếp theo'];iw=[2.1,4.6,2.4,3.3,2.7]
ir=[('VIRA-DEF-TASK-001 / F-01','TaskAuthorizationService.requireTaskCreator chỉ kiểm tra project membership trước khi tạo task; tên có thể khiến hiểu là quyền task creator. TaskAuthorizationService.java:33–37; TaskService.java:58–63.','Low / P3; xác nhận quy ước tên và ý nghĩa.','Người phụ trách Task; đổi tên nếu thống nhất, rà callers và compile.','Mở; cần owner, commit và rà soát lại sau sửa.'),('VIRA-DEF-PROJECT-002 / F-02','Danh sách project active lọc owner/member; archived list dường như lấy theo workspace membership. ProjectService.java:83–100; cần quyết định chính sách.','High tiềm năng / P1–P2; chưa xác nhận defect đến khi chốt yêu cầu.','PO/giảng viên chốt quyền archived; sau đó người phụ trách Project cập nhật query hoặc yêu cầu.','Chờ xác nhận chính sách; cần kiểm tra owner, project member và workspace member ngoài project.')]
table(anchor,'Bảng 4.4. Phiếu theo dõi minh họa cho các phát hiện',ih,ir,iw)
h(anchor,'4.5.1. Nhật ký cập nhật và tiêu chí nghiệm thu lỗi',2)
before(anchor,'Mỗi lần cập nhật phiếu phải tạo một bản ghi riêng, không sửa ngược lịch sử trước đó. Bản ghi tối thiểu gồm BUG-ID, thời điểm, trạng thái cũ/mới, người cập nhật, lý do chuyển trạng thái, liên kết bằng chứng và người/nhóm nhận việc kế tiếp. Cách lưu này giúp truy lại ai quyết định triage, ai nhận sửa và cơ sở nào được dùng để xác minh hoặc đóng.')
before(anchor,'Ví dụ minh họa với F-02: khi tiếp nhận, ghi trạng thái Chờ xác nhận chính sách, câu hỏi cụ thể về phạm vi người được xem Project đã archived và người có thẩm quyền trả lời. Khi có quyết định, đính kèm tài liệu/yêu cầu được cập nhật, sau đó triage lại mức độ và phân công nếu cần sửa. Chỉ chuyển Chờ xác minh sau khi gắn bản dựng/commit; nếu quyết định xác nhận hành vi hiện tại là đúng yêu cầu, ghi căn cứ và kết thúc theo trạng thái Không phải lỗi/đóng theo quy trình được duyệt. Không mặc định F-02 đã là lỗ hổng phân quyền.')
before(anchor,'Ví dụ minh họa với F-01: người xử lý xác nhận ý nghĩa của requireTaskCreator với nhóm, quyết định đổi tên hoặc cập nhật tài liệu, rồi rà điểm gọi và biên dịch module liên quan. Verifier kiểm tra thay đổi không làm đổi điều kiện quyền và không còn tên gây hiểu nhầm tại các nơi sử dụng. Vì đây là phát hiện chất lượng bảo trì ở mức thấp, priority xử lý phụ thuộc quyết định nhóm; không được tự ghi Đã sửa khi chưa có commit.')
before(anchor,'Tại cổng đóng, người xác minh trả lời lần lượt: (1) lỗi có tái hiện trên bản gốc không; (2) expected result có căn cứ từ yêu cầu đã duyệt không; (3) bản sửa có nhận diện được không; (4) ca tái hiện đã đạt trên đúng build chưa; (5) regression theo ảnh hưởng đã chạy chưa; (6) minh chứng có che bí mật và gắn BUG-ID chưa; (7) còn rủi ro hoặc hành động mở nào không; (8) ai chấp thuận đóng/ngoại lệ. Câu trả lời “chưa rõ” tại điều kiện bắt buộc giữ lỗi ở trạng thái chờ, không đóng.')
before(anchor,'Báo cáo định kỳ có thể theo dõi số lỗi mới, đang xử lý, chờ xác minh, quá hạn, đã đóng, mở lại; phân bố severity và module; thời gian trung vị từ tiếp nhận đến phân công/xác minh/đóng; tỷ lệ lỗi mở lại và tỷ lệ phiếu thiếu trường. Mỗi chỉ số cần ghi mốc thời gian, phạm vi build/release và mẫu số. Với số lượng nhỏ của một bài tập cá nhân, trình bày số đếm và giới hạn, không suy diễn xu hướng thống kê.')
h(anchor,'4.6. Tổng hợp trạng thái và xử lý checklist không đạt',2)
before(anchor,'Checklist gồm 20 tiêu chí gồm tiêu chí kỹ thuật, quy ước đề xuất và điểm cần quyết định. Đạt một phần nghĩa mã có trường tương ứng nhưng chưa bắt buộc; Đề xuất nghĩa chưa có bằng chứng quy trình đã ban hành; Chờ xác nhận nghĩa thiếu quyết định hoặc xác minh. Không gộp các trạng thái này thành tỷ lệ chất lượng sản phẩm.')
before(anchor,'Với mục Không đạt, mở hành động có owner, hạn và điều kiện hoàn tất. Với Đề xuất, người hướng dẫn/nhóm cần duyệt quy trình; với Chờ xác nhận, ghi câu hỏi và người quyết định. Sau sửa, kiểm tra đúng tiêu chí, lưu commit/build, bằng chứng và regression. Chỉ cập nhật kết quả khi xác minh; nếu không đạt, mở lại hoặc giữ trạng thái xử lý.')
h(anchor,'4.7. Kết luận phần 4',2)
before(anchor,'Checklist áp dụng vào Vira qua bug metadata API, severity enum, exception response, task/project authorization và hai phát hiện rà soát có căn cứ. Kết quả tách rõ điều quan sát trong mã, thiếu hụt quy trình đề xuất và vấn đề cần xác nhận chính sách. Chưa có xác nhận phân công, sửa hay đóng lỗi; trạng thái cần cập nhật khi có minh chứng thực tế.')

# Replace conclusion paragraphs and references entry [11]
ci=next(i for i,p in enumerate(d.paragraphs) if p.text.strip()=='KẾT LUẬN');ri=next(i for i,p in enumerate(d.paragraphs) if p.text.strip()=='TÀI LIỆU THAM KHẢO')
con=["Báo cáo lựa chọn Waterfall làm mô hình tham chiếu cho các điểm kiểm soát quản lý lỗi, vận dụng ISO/IEC 25010 để xem xét ảnh hưởng chất lượng, thiết lập tiêu chuẩn tài liệu và xây dựng quy trình tiếp nhận, phân loại, phân công, xử lý, xác minh và đóng lỗi cho Vira.","Checklist ghi nhận các trường bug metadata và severity trong mã nguồn, các thiếu hụt quy trình cần ban hành, cùng hai phát hiện làm ví dụ quản lý. F-01 và F-02 chưa được xác nhận là đã giao/sửa/đóng; riêng F-02 cần quyết định nghiệp vụ trước khi kết luận. Báo cáo không biến phát hiện tĩnh thành kết quả vận hành chưa có bằng chứng.","Để áp dụng tiếp, nhóm cần thống nhất mẫu phiếu, severity/priority và trạng thái; chọn người triage/owner/verifier; bổ sung liên kết build/commit và lịch sử xử lý; sau đó cập nhật hồ sơ dựa trên phản hồi, bản sửa và kết quả xác minh thực tế. Người có thẩm quyền quyết định chấp nhận rủi ro và đóng lỗi theo quy trình dự án."]
for p,v in zip(d.paragraphs[ci+1:ri],con):setp(p,v)
for p in list(d.paragraphs):
 if p.text.strip().startswith('[11] Vira Project, Playwright E2E'):p._p.getparent().remove(p._p)
p8=next(p for p in d.paragraphs if p.text.strip().startswith('[8]'))
refs=['[9] International Organization for Standardization and International Electrotechnical Commission, ISO/IEC 25010:2023, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — Product quality model, 2023. https://www.iso.org/standard/78176.html.','[10] International Organization for Standardization and International Electrotechnical Commission, ISO/IEC 25010:2011, Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models, withdrawn. https://www.iso.org/standard/35733.html.','[11] Vira Project, mã nguồn module Bug và xử lý lỗi: backend/src/main/java/vn/vira/bug/; backend/src/main/java/vn/vira/shared/exception/ApiExceptionHandler.java.']
for value in refs:
 q=d.add_paragraph(style='Normal');q.add_run(value);q.paragraph_format.left_indent=Cm(1);q.paragraph_format.first_line_indent=Cm(-1);q.paragraph_format.line_spacing=1.5;q._p.getparent().remove(q._p);p8._p.addnext(q._p);p8=q
d.core_properties.title='Báo cáo cá nhân về quản lý và xử lý lỗi phần mềm cho dự án Vira';d.core_properties.subject='Bài kiểm tra thường xuyên 2 — Quản lý và xử lý lỗi Vira';d.core_properties.author='Đào Đức Tâm'
d.save(OUT)
print(OUT)

