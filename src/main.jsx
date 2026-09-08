import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertCircle,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileBarChart2,
  Flag,
  FolderKanban,
  GripVertical,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Menu,
  MoreHorizontal,
  PanelsTopLeft,
  Paperclip,
  Pin,
  Plus,
  Save,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { ApiError, authApi, viraApi } from "./api";
import "./styles.css";

const NAV = [
  ["Tổng quan", LayoutDashboard],
  ["Bảng công việc", PanelsTopLeft],
  ["Backlog", ListTodo],
  ["Sprint", Clock3],
  ["Báo cáo", FileBarChart2],
  ["Thành viên", Users],
];
const STATUS = {
  TODO: ["Cần thực hiện", "slate"],
  IN_PROGRESS: ["Đang thực hiện", "blue"],
  IN_REVIEW: ["Chờ kiểm tra", "amber"],
  DONE: ["Hoàn thành", "green"],
  BLOCKED: ["Bị chặn", "red"],
  ON_HOLD: ["Tạm dừng", "slate"],
  CANCELLED: ["Đã hủy", "slate"],
};
const TYPE = {
  STORY: "Story",
  TASK: "Task",
  BUG: "Bug",
  IMPROVEMENT: "Cải tiến",
  SUBTASK: "Việc con",
};
const PRIORITY = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};
const Avatar = ({ text, small = false }) => (
  <span className={`avatar ${small ? "small" : ""}`} aria-label={text}>
    <span className="avatar-label">{text}</span>
  </span>
);
const initials = (name = "V") =>
  name
    .split(/\s+/)
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const dateText = (value) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "short",
      }).format(new Date(`${value}T00:00:00`))
    : "Chưa đặt hạn";
const errorText = (error) =>
  error instanceof ApiError && error.status === 401
    ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    : error?.message || "Đã có lỗi xảy ra.";

function Metric({ label, value, note, kind, Icon }) {
  return (
    <article className="metric card">
      <div className={`metric-icon ${kind}`}>
        <Icon size={19} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span className="muted">{note}</span>
      </div>
    </article>
  );
}
function Empty({ message }) {
  return (
    <div className="empty-state">
      <FolderKanban size={28} />
      <p>{message}</p>
    </div>
  );
}
function TaskCard({ task, open }) {
  const [status] = STATUS[task.status] || STATUS.TODO;
  return (
    <button className="task-card" onClick={() => open(task)}>
      <div className="task-top">
        <span className={`type ${task.taskType === "BUG" ? "bug" : ""}`}>
          {TYPE[task.taskType]}
        </span>
        <MoreHorizontal size={17} />
      </div>
      <h4>{task.title}</h4>
      <div className="task-id">
        <span>{task.taskCode}</span>
        <span
          className={`priority ${task.priority === "URGENT" ? "urgent" : task.priority === "HIGH" ? "high" : ""}`}
        >
          <Flag size={12} />
          {PRIORITY[task.priority]}
        </span>
      </div>
      <div className="task-bottom">
        <span className="date">
          <Clock3 size={13} />
          {dateText(task.dueDate)}
        </span>
        <span className="task-status-inline">{status}</span>
      </div>
    </button>
  );
}

function Overview({ overview, tasks, open, create }) {
  const attention = tasks.filter((task) => task.status !== "DONE").slice(0, 3);
  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">DỰ ÁN ĐANG HOẠT ĐỘNG</p>
          <h1>Công việc của nhóm</h1>
          <p>Dữ liệu đồng bộ trực tiếp với API Vira.</p>
        </div>
        <button className="btn primary" onClick={() => create("TODO")}>
          <Plus size={18} />
          Tạo công việc
        </button>
      </section>
      <section className="metrics">
        <Metric
          label="Tiến độ dự án"
          value={`${overview?.completionPercent || 0}%`}
          note={`${overview?.completedTasks || 0}/${overview?.totalTasks || 0} việc đã hoàn thành`}
          kind="blue"
          Icon={CheckCircle2}
        />
        <Metric
          label="Tổng công việc"
          value={overview?.totalTasks || 0}
          note="Đã đồng bộ từ hệ thống"
          kind="violet"
          Icon={ListTodo}
        />
        <Metric
          label="Đang quá hạn"
          value={overview?.overdueTasks || 0}
          note="Cần được ưu tiên xử lý"
          kind="orange"
          Icon={CircleAlert}
        />
        <Metric
          label="Lỗi đang mở"
          value={overview?.openBugs || 0}
          note="Bug chưa được đóng"
          kind="red"
          Icon={AlertCircle}
        />
      </section>
      <section className="dashboard-grid">
        <article className="card progress-card">
          <div className="section-title">
            <div>
              <h2>Tiến độ hoàn thành</h2>
              <p>
                {overview?.activeSprintName
                  ? `Sprint: ${overview.activeSprintName}`
                  : "Chưa có Sprint đang chạy"}
              </p>
            </div>
          </div>
          <div className="sprint-progress">
            <div
              className="ring"
              style={{
                background: `radial-gradient(white 56%,transparent 58%),conic-gradient(#2563eb 0 ${overview?.completionPercent || 0}%,#dbeafe ${overview?.completionPercent || 0}%)`,
              }}
            >
              <strong>{overview?.completionPercent || 0}%</strong>
              <span>hoàn thành</span>
            </div>
            <div className="progress-info">
              <div>
                <span>Đã hoàn thành</span>
                <b>
                  {overview?.completedTasks || 0}{" "}
                  <em>/ {overview?.totalTasks || 0} việc</em>
                </b>
              </div>
              <div className="line">
                <i style={{ width: `${overview?.completionPercent || 0}%` }} />
              </div>
            </div>
          </div>
        </article>
        <article className="card activity">
          <div className="section-title">
            <div>
              <h2>Trạng thái hệ thống</h2>
              <p>Dữ liệu được tải từ backend</p>
            </div>
          </div>
          <div className="activity-row">
            <CheckCircle2 size={24} color="#2563eb" />
            <div>
              <p>
                <b>Backend đã kết nối</b>
              </p>
              <span>Spring Boot + MySQL đang hoạt động</span>
            </div>
          </div>
          <div className="activity-row">
            <ListTodo size={24} color="#7c3aed" />
            <div>
              <p>
                <b>{tasks.length} công việc đã tải</b>
              </p>
              <span>Theo project đang chọn</span>
            </div>
          </div>
        </article>
      </section>
      <section className="work-section card">
        <div className="section-title">
          <div>
            <h2>Việc cần chú ý</h2>
            <p>Các công việc chưa hoàn thành.</p>
          </div>
        </div>
        <div className="attention-list">
          {attention.length ? (
            attention.map((task) => (
              <TaskCard task={task} key={task.id} open={open} />
            ))
          ) : (
            <Empty message="Chưa có công việc cần xử lý." />
          )}
        </div>
      </section>
    </>
  );
}
function Board({ tasks, open, create }) {
  return (
    <section className="board-wrap">
      <div className="board-toolbar">
        <div>
          <h2>Bảng công việc</h2>
          <p>Dữ liệu từ dự án hiện tại</p>
        </div>
        <button className="btn primary" onClick={() => create("TODO")}>
          <Plus size={17} />
          Tạo công việc
        </button>
      </div>
      <div className="board">
        {["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((status) => {
          const [label, color] = STATUS[status];
          const items = tasks.filter((task) => task.status === status);
          return (
            <div className="kanban-col" key={status}>
              <div className="column-head">
                <span>
                  <i className={`dot ${color}`} />
                  {label}
                  <b>{items.length}</b>
                </span>
              </div>
              <div className="task-list">
                {items.map((task) => (
                  <TaskCard task={task} key={task.id} open={open} />
                ))}
                {!items.length && (
                  <p className="empty-column">Chưa có công việc</p>
                )}
                {status !== "DONE" && (
                  <button className="add-card" onClick={() => create(status)}>
                    <Plus size={16} />
                    Thêm công việc
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
function Backlog({ tasks, open, create, move }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const visible = tasks
    .filter((task) =>
      `${task.taskCode} ${task.title}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .filter((task) => !statusFilter || task.status === statusFilter)
    .filter((task) => !priorityFilter || task.priority === priorityFilter);
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">LẬP KẾ HOẠCH</p>
          <h1>Backlog dự án</h1>
          <p>Ưu tiên công việc và chuẩn bị cho Sprint tiếp theo.</p>
        </div>
        <button className="btn primary" onClick={() => create("TODO")}>
          <Plus size={17} />
          Tạo công việc
        </button>
      </div>
      <div className="card backlog-tools">
        <Search size={18} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Tìm kiếm công việc"
          placeholder="Tìm theo mã hoặc tiêu đề..."
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label="Lọc theo trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          {Object.entries(STATUS).map(([value, [label]]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value)}
          aria-label="Lọc theo ưu tiên"
        >
          <option value="">Mọi ưu tiên</option>
          {Object.entries(PRIORITY).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="backlog-group">
        <div className="group-head">
          <div>
            <ChevronDown size={18} />
            <b>Tất cả công việc</b>
            <span>{visible.length} công việc</span>
          </div>
        </div>
        {visible.map((task) => (
          <button
            className="backlog-row"
            key={task.id}
            draggable
            onDragStart={() => setDraggedId(task.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (draggedId && draggedId !== task.id)
                move(draggedId, task.position);
              setDraggedId(null);
            }}
            onClick={() => open(task)}
          >
            <span className="drag" aria-hidden="true">
              <GripVertical size={18} />
            </span>
            <span className={`type ${task.taskType === "BUG" ? "bug" : ""}`}>
              {TYPE[task.taskType]}
            </span>
            <b>{task.taskCode}</b>
            <strong>{task.title}</strong>
            <span
              className={`priority ${task.priority === "URGENT" ? "urgent" : task.priority === "HIGH" ? "high" : ""}`}
            >
              <Flag size={12} />
              {PRIORITY[task.priority]}
            </span>
            <span className="points">{task.storyPoints || 0} SP</span>
          </button>
        ))}
        {!visible.length && (
          <Empty message="Không tìm thấy công việc phù hợp." />
        )}
      </div>
    </section>
  );
}
function Reports({ overview, tasks, sprints }) {
  const total = tasks.length || 1;
  const statusRows = Object.entries(STATUS)
    .map(([status, [label, color]]) => ({
      status,
      label,
      color,
      count: tasks.filter((task) => task.status === status).length,
    }))
    .filter((item) => item.count);
  const sprintRows = sprints.map((sprint) => {
    const items = tasks.filter((task) => task.sprintId === sprint.id);
    const done = items.filter((task) => task.status === "DONE").length;
    return {
      ...sprint,
      total: items.length,
      done,
      percent: items.length ? Math.round((done * 100) / items.length) : 0,
    };
  });
  return (
    <section className="reports">
      <div className="page-head">
        <div>
          <p className="eyebrow">PHÂN TÍCH DỰ ÁN</p>
          <h1>Báo cáo & tiến độ</h1>
          <p>Dữ liệu tổng quan được lấy từ API.</p>
        </div>
      </div>
      <div className="metrics report-metrics">
        <Metric
          label="Tỷ lệ hoàn thành"
          value={`${overview?.completionPercent || 0}%`}
          note="Tiến độ dự án"
          kind="blue"
          Icon={CheckCircle2}
        />
        <Metric
          label="Đã hoàn thành"
          value={overview?.completedTasks || 0}
          note={`Trên ${overview?.totalTasks || 0} công việc`}
          kind="green"
          Icon={ListTodo}
        />
        <Metric
          label="Lỗi còn mở"
          value={overview?.openBugs || 0}
          note="Cần được kiểm tra"
          kind="violet"
          Icon={AlertCircle}
        />
      </div>
      <div className="report-grid">
        <article className="card report-detail">
          <h2>Phân bố công việc</h2>
          <p>Theo trạng thái hiện tại của dự án.</p>
          {statusRows.length ? (
            statusRows.map((item) => (
              <div className="report-bar" key={item.status}>
                <span>
                  <i className={`dot ${item.color}`} />
                  {item.label}
                </span>
                <b>{item.count}</b>
                <div>
                  <i style={{ width: `${(item.count * 100) / total}%` }} />
                </div>
              </div>
            ))
          ) : (
            <Empty message="Chưa có công việc để phân tích." />
          )}
        </article>
        <article className="card report-detail">
          <h2>Tiến độ Sprint</h2>
          <p>Công việc hoàn thành trên từng Sprint.</p>
          {sprintRows.length ? (
            sprintRows.map((sprint) => (
              <div className="report-bar" key={sprint.id}>
                <span>{sprint.name}</span>
                <b>
                  {sprint.done}/{sprint.total}
                </b>
                <div>
                  <i style={{ width: `${sprint.percent}%` }} />
                </div>
              </div>
            ))
          ) : (
            <Empty message="Chưa có Sprint để phân tích." />
          )}
        </article>
      </div>
    </section>
  );
}

function ProjectSettings({ token, project, saved }) {
  const [form, setForm] = useState({
    name: project.name,
    description: project.description || "",
    projectType: project.projectType,
    status: project.status,
    startDate: project.startDate || "",
    targetEndDate: project.targetEndDate || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      saved(
        await viraApi.updateProject(token, project.id, {
          ...form,
          startDate: form.startDate || null,
          targetEndDate: form.targetEndDate || null,
        }),
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">CẤU HÌNH</p>
          <h1>Cài đặt dự án</h1>
          <p>Cập nhật thông tin và vòng đời dự án.</p>
        </div>
      </div>
      <form className="card settings-form" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tên dự án
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Mô tả
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="form-grid">
          <label>
            Loại dự án
            <select
              value={form.projectType}
              onChange={(e) =>
                setForm({ ...form, projectType: e.target.value })
              }
            >
              <option value="KANBAN">Kanban</option>
              <option value="SCRUM">Scrum</option>
            </select>
          </label>
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="ON_HOLD">Tạm dừng</option>
              <option value="COMPLETED">Hoàn thành</option>
            </select>
          </label>
          <label>
            Ngày bắt đầu
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label>
            Ngày kết thúc dự kiến
            <input
              type="date"
              value={form.targetEndDate}
              onChange={(e) =>
                setForm({ ...form, targetEndDate: e.target.value })
              }
            />
          </label>
        </div>
        <div className="form-actions">
          <button className="btn primary" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </section>
  );
}

function TaskModal({ task, close, update }) {
  if (!task) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <div className="task-modal">
        <div className="modal-top">
          <span className="issue-key">{task.taskCode}</span>
          <button onClick={close} className="icon-btn" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <h2>{task.title}</h2>
        <div className="modal-content">
          <div className="description">
            <h3>Mô tả</h3>
            <p>{task.description || "Công việc chưa có mô tả."}</p>
          </div>
          <aside className="task-meta">
            <div>
              <span>Trạng thái</span>
              <select
                className="status-select"
                value={task.status}
                onChange={(event) => update(task, event.target.value)}
              >
                {Object.entries(STATUS).map(([value, [label]]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Ưu tiên</span>
              <p className="priority">
                <Flag size={13} />
                {PRIORITY[task.priority]}
              </p>
            </div>
            <div>
              <span>Hạn hoàn thành</span>
              <p>{dateText(task.dueDate)}</p>
            </div>
            <div>
              <span>Story point</span>
              <p>{task.storyPoints || 0} điểm</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
function TaskDetails({ task, close, update, token, projectId, sprints }) {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [collaboration, setCollaboration] = useState(null);
  const [members, setMembers] = useState([]);
  const [bug, setBug] = useState({
    environment: "",
    severity: "MEDIUM",
    reproductionSteps: "",
    expectedResult: "",
    actualResult: "",
    affectedVersion: "",
  });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!task) return;
    try {
      const [nextComments, nextAttachments, nextCollaboration, nextMembers] =
        await Promise.all([
          viraApi.comments(token, projectId, task.id),
          viraApi.attachments(token, projectId, task.id),
          viraApi.taskCollaboration(token, projectId, task.id),
          viraApi.members(token, projectId),
        ]);
      setComments(nextComments);
      setAttachments(nextAttachments);
      setCollaboration(nextCollaboration);
      setMembers(nextMembers);
      if (task.taskType === "BUG")
        setBug(await viraApi.bug(token, projectId, task.id));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404))
        setError(errorText(err));
    }
  }, [task, token, projectId]);
  useEffect(() => {
    load();
  }, [load]);
  if (!task) return null;
  const addComment = async () => {
    if (!comment.trim()) return;
    try {
      await viraApi.addComment(token, projectId, task.id, {
        body: comment.trim(),
        parentCommentId: null,
      });
      setComment("");
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await viraApi.uploadAttachment(token, projectId, task.id, file);
      event.target.value = "";
      await load();
    } catch (err) {
      setError(errorText(err));
    }
  };
  const saveBug = async () => {
    try {
      setBug(await viraApi.saveBug(token, projectId, task.id, bug));
    } catch (err) {
      setError(errorText(err));
    }
  };
  const downloadFile = async (item) => {
    try {
      const { blob, filename } = await viraApi.downloadAttachment(
        token,
        projectId,
        task.id,
        item.id,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const changeCollaboration = async (action) => {
    try {
      setError("");
      setCollaboration(await action());
    } catch (err) {
      setError(errorText(err));
    }
  };
  const toggleAssignee = (userId) => {
    const currentIds =
      collaboration?.assignees?.map((item) => item.userId) || [];
    const nextIds = currentIds.includes(userId)
      ? currentIds.filter((id) => id !== userId)
      : [...currentIds, userId];
    changeCollaboration(() =>
      viraApi.updateTaskAssignees(token, projectId, task.id, nextIds),
    );
  };
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <div className="task-modal task-details">
        <div className="modal-top">
          <span className="issue-key">{task.taskCode}</span>
          <button onClick={close} className="icon-btn" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>
        <h2>{task.title}</h2>
        {error && <p className="form-error">{error}</p>}
        {collaboration && (
          <div className="task-collaboration-actions">
            <button
              className={`btn ${collaboration.currentUserAssigned ? "secondary" : "primary"}`}
              onClick={() =>
                changeCollaboration(() =>
                  collaboration.currentUserAssigned
                    ? viraApi.leaveTask(token, projectId, task.id)
                    : viraApi.joinTask(token, projectId, task.id),
                )
              }
            >
              <Users size={15} />
              {collaboration.currentUserAssigned
                ? "Rời công việc"
                : "Tham gia công việc"}
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                changeCollaboration(() =>
                  collaboration.currentUserWatching
                    ? viraApi.unwatchTask(token, projectId, task.id)
                    : viraApi.watchTask(token, projectId, task.id),
                )
              }
            >
              <Bell size={15} />
              {collaboration.currentUserWatching ? "Đang theo dõi" : "Theo dõi"}
            </button>
          </div>
        )}
        <div className="modal-content">
          <div className="description">
            <h3>Mô tả</h3>
            <p>{task.description || "Công việc chưa có mô tả."}</p>
            <h3>Bình luận</h3>
            <div className="comment-box">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Viết bình luận…"
              />
              <button className="btn primary" onClick={addComment}>
                Gửi
              </button>
            </div>
            {comments.map((item) => (
              <div className="live-comment" key={item.id}>
                <div>
                  <b>{item.authorName}</b>
                  {item.pinned && <Pin size={13} />}
                  <p>{item.body}</p>
                </div>
                <button
                  onClick={async () => {
                    await viraApi.toggleCommentPin(
                      token,
                      projectId,
                      task.id,
                      item.id,
                    );
                    load();
                  }}
                  aria-label="Ghim bình luận"
                >
                  <Pin size={15} />
                </button>
              </div>
            ))}
            <h3>Tệp đính kèm</h3>
            <label className="upload-control">
              <Paperclip size={16} />
              Tải tệp lên
              <input type="file" onChange={uploadFile} />
            </label>
            {attachments.map((item) => (
              <button
                key={item.id}
                className="attachment-link"
                onClick={() => downloadFile(item)}
              >
                {item.originalName} · {Math.ceil(item.fileSize / 1024)} KB
              </button>
            ))}
            {task.taskType === "BUG" && (
              <>
                <h3>Thông tin lỗi</h3>
                <div className="bug-grid">
                  <input
                    placeholder="Môi trường"
                    value={bug.environment || ""}
                    onChange={(e) =>
                      setBug({ ...bug, environment: e.target.value })
                    }
                  />
                  <select
                    value={bug.severity || "MEDIUM"}
                    onChange={(e) =>
                      setBug({ ...bug, severity: e.target.value })
                    }
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="CRITICAL">Nghiêm trọng</option>
                  </select>
                  <textarea
                    placeholder="Các bước tái hiện"
                    value={bug.reproductionSteps || ""}
                    onChange={(e) =>
                      setBug({ ...bug, actualResult: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Kết quả mong đợi"
                    value={bug.expectedResult || ""}
                    onChange={(e) =>
                      setBug({ ...bug, expectedResult: e.target.value })
                    }
                  />
                  <textarea
                    placeholder="Kết quả thực tế"
                    value={bug.actualResult || ""}
                    onChange={(e) =>
                      setBug({ ...bug, reproductionSteps: e.target.value })
                    }
                  />
                </div>
                <button className="btn secondary" onClick={saveBug}>
                  <Save size={15} />
                  Lưu thông tin lỗi
                </button>
              </>
            )}
          </div>
          <aside className="task-meta">
            {collaboration && (
              <div className="task-participants">
                <span>Người thực hiện</span>
                <div className="participant-list">
                  {collaboration.assignees.length ? (
                    collaboration.assignees.map((member) => (
                      <div
                        className="participant"
                        key={member.userId}
                        title={member.fullName}
                      >
                        <Avatar text={initials(member.fullName)} small />
                        <b>{member.fullName}</b>
                      </div>
                    ))
                  ) : (
                    <p>Chưa phân công</p>
                  )}
                </div>
                {collaboration.canManageParticipants && (
                  <details className="participant-picker">
                    <summary>Phân công thành viên</summary>
                    {members.map((member) => {
                      const selected = collaboration.assignees.some(
                        (item) => item.userId === member.userId,
                      );
                      return (
                        <label key={member.userId}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleAssignee(member.userId)}
                          />
                          <Avatar text={initials(member.fullName)} small />
                          {member.fullName}
                        </label>
                      );
                    })}
                  </details>
                )}
              </div>
            )}
            {collaboration && (
              <div className="task-participants">
                <span>Người theo dõi ({collaboration.watchers.length})</span>
                <div className="participant-list compact">
                  {collaboration.watchers.length ? (
                    collaboration.watchers.map((member) => (
                      <div
                        className="participant"
                        key={member.userId}
                        title={member.fullName}
                      >
                        <Avatar text={initials(member.fullName)} small />
                        <b>{member.fullName}</b>
                      </div>
                    ))
                  ) : (
                    <p>Chưa có người theo dõi</p>
                  )}
                </div>
              </div>
            )}
            <div>
              <span>Trạng thái</span>
              <select
                className="status-select"
                value={task.status}
                onChange={(event) => update(task, event.target.value)}
              >
                {Object.entries(STATUS).map(([value, [label]]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Sprint</span>
              <select
                className="status-select"
                value={task.sprintId || ""}
                onChange={(event) =>
                  update(task, task.status, event.target.value || null)
                }
              >
                <option value="">Backlog</option>
                {sprints.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Ưu tiên</span>
              <p className="priority">
                <Flag size={13} />
                {PRIORITY[task.priority]}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
function TaskForm({ close, submit, defaultStatus }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "TASK",
    priority: "MEDIUM",
    dueDate: "",
    storyPoints: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const change = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await submit(
        {
          ...form,
          dueDate: form.dueDate || null,
          storyPoints: form.storyPoints ? Number(form.storyPoints) : null,
        },
        defaultStatus,
      );
      close();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <form className="task-modal form-modal" onSubmit={save}>
        <div className="modal-top">
          <span className="type">CÔNG VIỆC MỚI</span>
          <button
            type="button"
            onClick={close}
            className="icon-btn"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <h2>Tạo công việc</h2>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tiêu đề
          <input required name="title" value={form.title} onChange={change} />
        </label>
        <label>
          Mô tả
          <textarea
            name="description"
            value={form.description}
            onChange={change}
          />
        </label>
        <div className="form-grid">
          <label>
            Loại
            <select name="taskType" value={form.taskType} onChange={change}>
              {Object.entries(TYPE).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ưu tiên
            <select name="priority" value={form.priority} onChange={change}>
              {Object.entries(PRIORITY).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hạn hoàn thành
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={change}
            />
          </label>
          <label>
            Story point
            <input
              type="number"
              min="0"
              name="storyPoints"
              value={form.storyPoints}
              onChange={change}
            />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={close}>
            Hủy
          </button>
          <button className="btn primary" disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo công việc"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SprintPage({ token, project, tasks, sprints, reload }) {
  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState("");
  const create = async (e) => {
    e.preventDefault();
    try {
      await viraApi.createSprint(token, project.id, form);
      setForm({ name: "", goal: "", startDate: "", endDate: "" });
      reload();
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">LẬP KẾ HOẠCH</p>
          <h1>Sprint</h1>
          <p>Tạo, bắt đầu, kết thúc và phân bổ công việc theo Sprint.</p>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <form className="card inline-form" onSubmit={create}>
        <input
          required
          placeholder="Tên Sprint"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Mục tiêu"
          value={form.goal}
          onChange={(e) => setForm({ ...form, goal: e.target.value })}
        />
        <input
          required
          type="date"
          value={form.startDate}
          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
        />
        <input
          required
          type="date"
          value={form.endDate}
          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
        />
        <button className="btn primary">Tạo Sprint</button>
      </form>
      <div className="entity-list">
        {sprints.map((sprint) => (
          <article className="card entity-row" key={sprint.id}>
            <div>
              <b>{sprint.name}</b>
              <span>
                {sprint.goal || "Chưa có mục tiêu"} · {sprint.startDate} —{" "}
                {sprint.endDate}
              </span>
            </div>
            <span className="status-pill">{sprint.status}</span>
            {sprint.status === "PLANNED" && (
              <button
                className="btn secondary"
                onClick={async () => {
                  await viraApi.startSprint(token, project.id, sprint.id);
                  reload();
                }}
              >
                Bắt đầu
              </button>
            )}
            {sprint.status === "ACTIVE" && (
              <button
                className="btn secondary"
                onClick={async () => {
                  await viraApi.completeSprint(token, project.id, sprint.id);
                  reload();
                }}
              >
                Kết thúc
              </button>
            )}
          </article>
        ))}
        {!sprints.length && <Empty message="Chưa có Sprint nào." />}
      </div>
      <div className="card sprint-task-list">
        <h2>Phân bổ công việc</h2>
        {tasks.map((task) => (
          <label key={task.id}>
            {task.taskCode} · {task.title}
            <select
              value={task.sprintId || ""}
              onChange={async (e) => {
                await viraApi.assignSprint(
                  token,
                  project.id,
                  task.id,
                  e.target.value || null,
                );
                reload();
              }}
            >
              <option value="">Backlog</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
function MembersPage({ token, project }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setMembers(await viraApi.members(token, project.id));
    } catch (err) {
      setError(errorText(err));
    }
  }, [token, project.id]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">CỘNG TÁC</p>
          <h1>Thành viên dự án</h1>
          <p>Mời thành viên và quản lý vai trò truy cập.</p>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      <form
        className="card inline-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await viraApi.addMember(token, project.id, { email, role });
            setEmail("");
            load();
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        <input
          required
          type="email"
          placeholder="email@congty.vn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="MEMBER">Thành viên</option>
          <option value="ADMIN">Quản trị viên</option>
        </select>
        <button className="btn primary">Mời thành viên</button>
      </form>
      <div className="entity-list">
        {members.map((member) => (
          <article className="card entity-row" key={member.userId}>
            <Avatar text={initials(member.fullName)} />
            <div>
              <b>{member.fullName}</b>
              <span>{member.email}</span>
            </div>
            <select
              value={member.role}
              onChange={async (e) => {
                await viraApi.updateMemberRole(
                  token,
                  project.id,
                  member.userId,
                  e.target.value,
                );
                load();
              }}
            >
              <option value="OWNER">Chủ sở hữu</option>
              <option value="ADMIN">Quản trị viên</option>
              <option value="MEMBER">Thành viên</option>
            </select>
            {member.role !== "OWNER" && (
              <button
                className="text-btn danger"
                onClick={async () => {
                  await viraApi.removeMember(token, project.id, member.userId);
                  load();
                }}
              >
                Gỡ
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
function NotificationBell({ token }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    viraApi
      .notifications(token)
      .then(setItems)
      .catch(() => {});
  }, [token]);
  const unread = items.filter((item) => !item.readAt).length;
  return (
    <div className="notification-wrap">
      <button
        className="icon-btn notification"
        aria-label="Thông báo"
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {unread > 0 && <i />}
      </button>
      {open && (
        <div className="notification-menu">
          <b>Thông báo</b>
          {items.length ? (
            items.map((item) => (
              <button
                key={item.id}
                className={!item.readAt ? "unread" : ""}
                onClick={async () => {
                  if (!item.readAt) {
                    await viraApi.markNotificationRead(token, item.id);
                    setItems(
                      items.map((value) =>
                        value.id === item.id
                          ? { ...value, readAt: new Date().toISOString() }
                          : value,
                      ),
                    );
                  }
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
            ))
          ) : (
            <p>Chưa có thông báo.</p>
          )}
        </div>
      )}
    </div>
  );
}
function Auth({ authenticated }) {
  const resetToken = new URLSearchParams(window.location.search).get("token");
  const [mode, setMode] = useState(resetToken ? "reset" : "login");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (mode === "forgot") {
        await authApi.forgotPassword(form.email);
        setError("Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.");
      } else if (mode === "reset") {
        await authApi.resetPassword(resetToken, form.password);
        setMode("login");
        setError("Đặt lại mật khẩu thành công. Hãy đăng nhập.");
        window.history.replaceState({}, "", window.location.pathname);
      } else
        authenticated(
          mode === "login"
            ? await authApi.login({
                email: form.email,
                password: form.password,
              })
            : await authApi.register(form),
        );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">V</div>
          <span>vira</span>
        </div>
        <p className="eyebrow">QUẢN LÝ DỰ ÁN</p>
        <h1>
          {mode === "forgot"
            ? "Quên mật khẩu"
            : mode === "reset"
              ? "Đặt lại mật khẩu"
              : mode === "login"
                ? "Chào mừng trở lại"
                : "Tạo tài khoản mới"}
        </h1>
        <p>
          {mode === "forgot"
            ? "Nhập email để nhận liên kết đặt lại mật khẩu."
            : mode === "reset"
              ? "Đặt mật khẩu mới cho tài khoản của bạn."
              : mode === "login"
                ? "Đăng nhập để tiếp tục với không gian làm việc của bạn."
                : "Bắt đầu quản lý công việc cùng Vira."}
        </p>
        <form onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          {mode === "register" && (
            <label>
              Họ và tên
              <input
                required
                minLength="2"
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
              />
            </label>
          )}
          {mode !== "reset" && (
            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Mật khẩu
              <input
                required
                minLength="8"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
              />
            </label>
          )}
          <button className="btn primary auth-submit" disabled={saving}>
            {saving
              ? "Đang xử lý..."
              : mode === "forgot"
                ? "Gửi liên kết"
                : mode === "reset"
                  ? "Đặt lại mật khẩu"
                  : mode === "login"
                    ? "Đăng nhập"
                    : "Tạo tài khoản"}
          </button>
        </form>
        {mode === "login" && (
          <button
            className="auth-switch"
            onClick={() => {
              setMode("forgot");
              setError("");
            }}
          >
            Quên mật khẩu?
          </button>
        )}
        {mode !== "reset" && (
          <button
            className="auth-switch"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </button>
        )}
      </section>
    </main>
  );
}
function Setup({ token, user, ready }) {
  const [step, setStep] = useState("workspace");
  const [workspace, setWorkspace] = useState(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (step === "workspace") {
        setWorkspace(
          await viraApi.createWorkspace(token, { name, description: "" }),
        );
        setName("");
        setStep("project");
      } else {
        ready(
          workspace,
          await viraApi.createProject(token, workspace.id, {
            name,
            projectKey: key.toUpperCase(),
            description: "",
            projectType: "KANBAN",
          }),
        );
      }
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand">
          <div className="brand-mark">V</div>
          <span>vira</span>
        </div>
        <p className="eyebrow">THIẾT LẬP BAN ĐẦU</p>
        <h1>
          {step === "workspace"
            ? `Chào ${user.fullName}`
            : "Tạo dự án đầu tiên"}
        </h1>
        <p>
          {step === "workspace"
            ? "Tạo không gian để nhóm cùng làm việc."
            : "Dự án sẽ có backlog và bảng Kanban riêng."}
        </p>
        <form onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          <label>
            {step === "workspace" ? "Tên không gian làm việc" : "Tên dự án"}
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {step === "project" && (
            <label>
              Mã dự án
              <input
                required
                pattern="[A-Za-z][A-Za-z0-9]{1,11}"
                value={key}
                onChange={(event) => setKey(event.target.value)}
                placeholder="Ví dụ: VIRA"
              />
            </label>
          )}
          <button className="btn primary auth-submit" disabled={saving}>
            {saving
              ? "Đang tạo..."
              : step === "workspace"
                ? "Tiếp tục"
                : "Vào dự án"}
          </button>
        </form>
      </section>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(() =>
    JSON.parse(localStorage.getItem("vira.session") || "null"),
  );
  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [page, setPage] = useState("Tổng quan");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const loadProject = useCallback(async (token, value) => {
    const [loadedTasks, loadedOverview, loadedSprints] = await Promise.all([
      viraApi.tasks(token, value.id),
      viraApi.overview(token, value.id),
      viraApi.sprints(token, value.id),
    ]);
    setTasks(loadedTasks);
    setOverview(loadedOverview);
    setSprints(loadedSprints);
  }, []);
  const bootstrap = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const workspaces = await viraApi.workspaces(session.accessToken);
      if (!workspaces.length) {
        setWorkspace(null);
        setProject(null);
        return;
      }
      setWorkspace(workspaces[0]);
      const projects = await viraApi.projects(
        session.accessToken,
        workspaces[0].id,
      );
      if (!projects.length) {
        setProject(null);
        return;
      }
      setProject(projects[0]);
      await loadProject(session.accessToken, projects[0]);
    } catch (err) {
      setError(errorText(err));
      if (err.status === 401) {
        localStorage.removeItem("vira.session");
        setSession(null);
      }
    } finally {
      setLoading(false);
    }
  }, [session, loadProject]);
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  const authenticated = (next) => {
    localStorage.setItem("vira.session", JSON.stringify(next));
    setSession(next);
  };
  const ready = async (newWorkspace, newProject) => {
    setWorkspace(newWorkspace);
    setProject(newProject);
    await loadProject(session.accessToken, newProject);
  };
  const create = async (payload, status) => {
    const task = await viraApi.createTask(
      session.accessToken,
      project.id,
      payload,
    );
    const next =
      status !== "TODO"
        ? await viraApi.updateTaskStatus(
            session.accessToken,
            project.id,
            task.id,
            { status, version: task.version },
          )
        : task;
    setTasks((current) => [...current, next]);
    setOverview(await viraApi.overview(session.accessToken, project.id));
  };
  const update = async (task, status, sprintId) => {
    try {
      let next = task;
      if (status !== task.status)
        next = await viraApi.updateTaskStatus(
          session.accessToken,
          project.id,
          task.id,
          { status, version: task.version },
        );
      if (sprintId !== undefined)
        next = await viraApi.assignSprint(
          session.accessToken,
          project.id,
          task.id,
          sprintId,
        );
      setTasks((current) =>
        current.map((item) => (item.id === next.id ? next : item)),
      );
      setSelected(next);
      setOverview(await viraApi.overview(session.accessToken, project.id));
    } catch (err) {
      setError(errorText(err));
    }
  };
  const moveBacklogTask = async (taskId, position) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    try {
      const next = await viraApi.moveTask(
        session.accessToken,
        project.id,
        taskId,
        { status: task.status, position, version: task.version },
      );
      setTasks((current) =>
        current
          .map((item) => (item.id === next.id ? next : item))
          .sort((a, b) => a.position - b.position),
      );
    } catch (err) {
      setError(errorText(err));
    }
  };
  if (!session) return <Auth authenticated={authenticated} />;
  if (loading)
    return (
      <main className="loading-page">
        <div className="loading-spinner" />
        <p>Đang kết nối dữ liệu dự án...</p>
      </main>
    );
  if (!workspace || !project)
    return (
      <Setup token={session.accessToken} user={session.user} ready={ready} />
    );
  const content =
    page === "Tổng quan" ? (
      <Overview
        overview={overview}
        tasks={tasks}
        open={setSelected}
        create={setCreating}
      />
    ) : page === "Bảng công việc" ? (
      <Board tasks={tasks} open={setSelected} create={setCreating} />
    ) : page === "Backlog" ? (
      <Backlog
        tasks={tasks}
        open={setSelected}
        create={setCreating}
        move={moveBacklogTask}
      />
    ) : page === "Sprint" ? (
      <SprintPage
        token={session.accessToken}
        project={project}
        tasks={tasks}
        sprints={sprints}
        reload={() => loadProject(session.accessToken, project)}
      />
    ) : page === "Thành viên" ? (
      <MembersPage token={session.accessToken} project={project} />
    ) : page === "Cài đặt dự án" ? (
      <ProjectSettings
        token={session.accessToken}
        project={project}
        saved={setProject}
      />
    ) : (
      <Reports overview={overview} tasks={tasks} sprints={sprints} />
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">V</div>
          <span>vira</span>
          <button className="mobile-close" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="workspace">
          <div className="workspace-icon">V</div>
          <div>
            <b>{workspace.name}</b>
            <span>{project.name}</span>
          </div>
          <ChevronDown size={16} />
        </div>
        <nav>
          <p className="nav-label">DỰ ÁN</p>
          {NAV.map(([id, Icon]) => (
            <button
              key={id}
              className={page === id ? "nav-active" : ""}
              onClick={() => {
                setPage(id);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              <span>{id}</span>
              {id === "Bảng công việc" && (
                <i className="nav-count">{tasks.length}</i>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => setPage("Cài đặt dự án")}>
            <FolderKanban size={18} />
            {project.projectKey}
          </button>
          <button>
            <Settings size={18} />
            Cài đặt dự án
          </button>
          <div className="user-card">
            <Avatar text={initials(session.user.fullName)} />
            <div>
              <b>{session.user.fullName}</b>
              <span>{session.user.email}</span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("vira.session");
                setSession(null);
              }}
              aria-label="Đăng xuất"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="overlay"
          onClick={() => setMobile(false)}
          aria-label="Đóng menu"
        />
      )}
      <div className="main-area">
        <header>
          <button className="menu-btn" onClick={() => setMobile(true)}>
            <Menu />
          </button>
          <div className="crumb">
            <BriefcaseBusiness size={17} />
            <span>{workspace.name}</span>
            <ChevronRight size={15} />
            <b>{page}</b>
          </div>
          <div className="header-actions">
            <label className="global-search">
              <Search size={18} />
              <input
                value={globalQuery}
                onChange={(event) => setGlobalQuery(event.target.value)}
                placeholder="Tìm kiếm nhanh..."
                aria-label="Tìm trong dự án"
              />
            </label>
            <NotificationBell token={session.accessToken} />
            <Avatar text={initials(session.user.fullName)} />
          </div>
        </header>
        <main>
          {globalQuery.trim() && (
            <section className="card search-results">
              <b>Kết quả tìm kiếm</b>
              {tasks
                .filter((task) =>
                  `${task.taskCode} ${task.title} ${task.description || ""}`
                    .toLowerCase()
                    .includes(globalQuery.toLowerCase()),
                )
                .slice(0, 8)
                .map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelected(task);
                      setGlobalQuery("");
                    }}
                  >
                    <span>{task.taskCode}</span>
                    {task.title}
                  </button>
                ))}{" "}
              {!tasks.some((task) =>
                `${task.taskCode} ${task.title} ${task.description || ""}`
                  .toLowerCase()
                  .includes(globalQuery.toLowerCase()),
              ) && <p>Không tìm thấy công việc phù hợp.</p>}
            </section>
          )}
          {error && (
            <div className="app-error">
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {content}
        </main>
      </div>
      <TaskDetails
        task={selected}
        close={() => setSelected(null)}
        update={update}
        token={session.accessToken}
        projectId={project.id}
        sprints={sprints}
      />
      {creating && (
        <TaskForm
          close={() => setCreating(null)}
          submit={create}
          defaultStatus={creating}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
