import React, { useCallback, useEffect, useRef, useState } from "react";
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
  Eye,
  EyeOff,
  History,
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
  ["Lịch sử", History],
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
const ROLE_LABELS = {
  OWNER: "Chủ sở hữu",
  ADMIN: "Quản trị viên",
  MEMBER: "Thành viên",
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
  error?.status === 401
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
function TaskCard({
  task,
  open,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const [status] = STATUS[task.status] || STATUS.TODO;
  const draggingRef = useRef(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`task-card ${isDragging ? "dragging" : ""} ${isDragOver ? "drag-over-card" : ""}`}
      draggable={draggable}
      onDragStart={(e) => {
        draggingRef.current = true;
        onDragStart?.(e);
      }}
      onDragEnd={(e) => {
        setTimeout(() => {
          draggingRef.current = false;
        }, 50);
        onDragEnd?.(e);
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => {
        if (draggingRef.current) return;
        open(task);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(task);
        }
      }}
    >
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
    </div>
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
function Board({ tasks, open, create, move, token, projectId, isAdmin }) {
  const [columns, setColumns] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);
  const [dragOverTaskId, setDragOverTaskId] = useState(null);

  useEffect(() => {
    viraApi
      .board(token, projectId)
      .then((board) => setColumns(board.columns))
      .catch((err) => setError(errorText(err)));
  }, [token, projectId]);

  const saveColumn = async (column, values) => {
    try {
      const next = await viraApi.updateBoardColumn(
        token,
        projectId,
        column.id,
        values,
      );
      setColumns((current) =>
        current.map((item) => (item.id === next.id ? next : item)),
      );
    } catch (err) {
      setError(errorText(err));
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("text/plain", String(task.id));
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(task.id);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumnId(null);
    setDragOverTaskId(null);
  };

  const handleCardDrop = (e, targetTask, column) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = draggedTaskId || e.dataTransfer.getData("text/plain");
    handleDragEnd();

    if (!sourceId || String(sourceId) === String(targetTask.id)) return;

    const columnTasks = tasks.filter((t) => t.status === column.taskStatus);
    const targetIndex = columnTasks.findIndex((t) => String(t.id) === String(targetTask.id));
    if (targetIndex >= 0 && move) {
      move(sourceId, column.taskStatus, targetIndex);
    }
  };

  const handleColumnDrop = (e, column) => {
    e.preventDefault();
    const sourceId = draggedTaskId || e.dataTransfer.getData("text/plain");
    handleDragEnd();

    if (!sourceId) return;

    const columnTasks = tasks.filter((t) => t.status === column.taskStatus);
    if (move) {
      move(sourceId, column.taskStatus, columnTasks.length);
    }
  };

  const displayColumns = columns.length
    ? columns
    : ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"].map((taskStatus, index) => ({
        id: taskStatus,
        taskStatus,
        name: STATUS[taskStatus][0],
        position: index + 1,
        wipLimit: null,
      }));

  return (
    <section className="board-wrap">
      <div className="board-toolbar">
        <div>
          <h2>Bảng công việc</h2>
          <p>Dữ liệu từ dự án hiện tại</p>
        </div>
        <div className="board-actions">
          {isAdmin && (
            <button
              className="btn secondary"
              onClick={() => setEditing(!editing)}
              aria-pressed={editing}
            >
              <Settings size={16} />{" "}
              {editing ? "Đóng cấu hình" : "Cấu hình cột/WIP"}
            </button>
          )}
          <button className="btn primary" onClick={() => create("TODO")}>
            <Plus size={17} />
            Tạo công việc
          </button>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {editing && (
        <div className="card wip-config">
          <h3>Cấu hình cột và giới hạn WIP</h3>
          <p>Đặt WIP để cảnh báo khi cột có quá nhiều công việc đang mở.</p>
          {columns.map((column) => (
            <WipColumnEditor
              key={column.id}
              column={column}
              save={saveColumn}
            />
          ))}
        </div>
      )}
      <div className="board">
        {displayColumns.map((column) => {
          const status = column.taskStatus;
          const [, color] = STATUS[status] || [column.name, "slate"];
          const items = tasks.filter((task) => task.status === status);
          const overWip = column.wipLimit && items.length > column.wipLimit;
          return (
            <div
              className={`kanban-col ${overWip ? "over-wip" : ""} ${dragOverColumnId === column.id ? "drag-over" : ""}`}
              key={column.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverColumnId !== column.id) {
                  setDragOverColumnId(column.id);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverColumnId(null);
                }
              }}
              onDrop={(e) => handleColumnDrop(e, column)}
            >
              <div className="column-head">
                <span>
                  <i className={`dot ${color}`} />
                  {column.name}
                  <b>{items.length}</b>
                </span>
                {column.wipLimit && (
                  <small title="Giới hạn WIP">
                    WIP {items.length}/{column.wipLimit}
                  </small>
                )}
              </div>
              <div className="task-list">
                {items.map((task) => (
                  <TaskCard
                    task={task}
                    key={task.id}
                    open={open}
                    draggable={true}
                    isDragging={draggedTaskId === task.id}
                    isDragOver={dragOverTaskId === task.id}
                    onDragStart={(e) => handleDragStart(e, task)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.dataTransfer.dropEffect = "move";
                      if (dragOverTaskId !== task.id) {
                        setDragOverTaskId(task.id);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverTaskId === task.id) {
                        setDragOverTaskId(null);
                      }
                    }}
                    onDrop={(e) => handleCardDrop(e, task, column)}
                  />
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
function WipColumnEditor({ column, save }) {
  const [name, setName] = useState(column.name);
  const [wipLimit, setWipLimit] = useState(column.wipLimit || "");
  return (
    <form
      className="wip-row"
      onSubmit={(event) => {
        event.preventDefault();
        save(column, {
          name,
          wipLimit: wipLimit === "" ? null : Number(wipLimit),
        });
      }}
    >
      <label>
        Tên cột
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label>
        WIP limit
        <input
          type="number"
          min="1"
          max="1000"
          value={wipLimit}
          onChange={(event) => setWipLimit(event.target.value)}
          placeholder="Không giới hạn"
        />
      </label>
      <button className="btn secondary">Lưu</button>
    </form>
  );
}
function Backlog({ tasks, open, create, move, token, projectId }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [draggedId, setDraggedId] = useState(null);
  const [visible, setVisible] = useState(tasks);
  const [savedFilters, setSavedFilters] = useState([]);
  const [filterName, setFilterName] = useState("");
  const filters = { q: query, status: statusFilter, priority: priorityFilter };
  const loadFilters = useCallback(async () => {
    try {
      setSavedFilters(await viraApi.savedTaskFilters(token, projectId));
    } catch {
      /* saved filters must not block backlog */
    }
  }, [token, projectId]);
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const result = await viraApi.searchTasks(token, projectId, filters);
        setVisible(result.items);
      } catch {
        setVisible(tasks);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [token, projectId, query, statusFilter, priorityFilter, tasks]);
  const clear = () => {
    setQuery("");
    setStatusFilter("");
    setPriorityFilter("");
  };
  const applyFilter = (saved) => {
    try {
      const next = JSON.parse(saved.filters);
      setQuery(next.q || "");
      setStatusFilter(next.status || "");
      setPriorityFilter(next.priority || "");
    } catch {
      /* invalid historical filter is ignored */
    }
  };
  const saveFilter = async () => {
    const name = filterName.trim();
    if (!name) return;
    try {
      await viraApi.saveTaskFilter(token, projectId, {
        name,
        filters: JSON.stringify(filters),
      });
      setFilterName("");
      await loadFilters();
    } catch {
      /* API errors are shown by the next application load */
    }
  };
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
      <div className="saved-filter-bar" aria-label="Bộ lọc đã lưu">
        <span>Bộ lọc đã lưu</span>
        {savedFilters.map((saved) => (
          <button
            key={saved.id}
            className="filter-chip"
            onClick={() => applyFilter(saved)}
          >
            {saved.name}
          </button>
        ))}
        <input
          value={filterName}
          onChange={(event) => setFilterName(event.target.value)}
          maxLength="120"
          placeholder="Tên bộ lọc"
          aria-label="Tên bộ lọc mới"
        />
        <button
          className="btn secondary"
          onClick={saveFilter}
          disabled={!filterName.trim()}
        >
          <Save size={14} /> Lưu bộ lọc
        </button>
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
function Reports({ overview, tasks, sprints, token, projectId }) {
  const [reportData, setReportData] = useState(null);
  useEffect(() => {
    viraApi
      .reports(token, projectId)
      .then(setReportData)
      .catch(() => setReportData(null));
  }, [token, projectId]);
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
      {reportData && (
        <div className="report-grid">
          <article className="card report-detail">
            <h2>Velocity sprint</h2>
            <p>Task và story point hoàn thành theo sprint.</p>
            {reportData.velocity.length ? (
              reportData.velocity.map((item) => (
                <div className="report-bar" key={item.sprintId}>
                  <span>{item.sprintName}</span>
                  <b>
                    {item.completedTasks} task · {item.completedStoryPoints} SP
                  </b>
                </div>
              ))
            ) : (
              <Empty message="Chưa có sprint hoàn tất." />
            )}
          </article>
          <article className="card report-detail">
            <h2>Tải thành viên</h2>
            <p>Task đang mở và giờ ước tính.</p>
            {reportData.memberWorkload.length ? (
              reportData.memberWorkload.map((item) => (
                <div className="report-bar" key={item.userId}>
                  <span>{item.fullName}</span>
                  <b>
                    {item.openTasks} task · {item.estimatedHours} giờ
                  </b>
                </div>
              ))
            ) : (
              <Empty message="Chưa có công việc được phân công." />
            )}
          </article>
          <article className="card report-detail">
            <h2>Lỗi theo mức độ</h2>
            <p>Các bug chưa hoàn thành.</p>
            {reportData.bugSeverity.map((item) => (
              <div className="report-bar" key={item.severity}>
                <span>{item.severity}</span>
                <b>{item.count}</b>
              </div>
            ))}
          </article>
          <article className="card report-detail">
            <h2>Burndown</h2>
            <p>Công việc còn lại theo ngày.</p>
            {reportData.burndown.length ? (
              reportData.burndown.slice(-7).map((item) => (
                <div className="report-bar" key={item.date}>
                  <span>{item.date}</span>
                  <b>{item.value} còn lại</b>
                </div>
              ))
            ) : (
              <Empty message="Chưa đủ dữ liệu tiến độ." />
            )}
          </article>
        </div>
      )}
    </section>
  );
}

function LabelManager({ token, projectId }) {
  const [labels, setLabels] = useState([]);
  const [draft, setDraft] = useState({ name: "", color: "#2563eb" });
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => { try { setLabels(await viraApi.labels(token, projectId)); } catch (err) { setError(errorText(err)); } }, [token, projectId]);
  useEffect(() => { load(); }, [load]);
  const save = async (event) => { event.preventDefault(); setError(""); try { if (editing) await viraApi.updateLabel(token, projectId, editing.id, draft); else await viraApi.createLabel(token, projectId, draft); setDraft({ name: "", color: "#2563eb" }); setEditing(null); setMessage("Đã lưu nhãn."); await load(); } catch (err) { setError(errorText(err)); } };
  const edit = (label) => { setEditing(label); setDraft({ name: label.name, color: label.color }); setMessage(""); };
  const remove = async (label) => { if (!window.confirm(`Xóa nhãn “${label.name}” khỏi toàn bộ task?`)) return; try { await viraApi.deleteLabel(token, projectId, label.id); setMessage("Đã xóa nhãn."); await load(); } catch (err) { setError(errorText(err)); } };
  return <section className="card archive-panel label-manager"><div className="section-title"><div><h2>Quản trị nhãn</h2><p>Tạo, sửa hoặc xóa nhãn của project.</p></div></div>{error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}<form className="label-editor" onSubmit={save}><label>Tên nhãn<input required maxLength="80" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>Màu<input type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} /></label><button className="btn secondary">{editing ? "Lưu nhãn" : "Tạo nhãn"}</button>{editing && <button className="btn secondary" type="button" onClick={() => { setEditing(null); setDraft({ name: "", color: "#2563eb" }); }}>Hủy</button>}</form><div className="label-admin-list">{labels.map((label) => <div key={label.id}><i style={{ background: label.color }} /> <b>{label.name}</b><button className="text-btn" onClick={() => edit(label)}>Sửa</button><button className="text-btn danger" onClick={() => remove(label)}>Xóa</button></div>)}{!labels.length && <p>Chưa có nhãn.</p>}</div></section>;
}

function ProjectSettings({ token, project, saved, restored, archived }) {
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
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
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
  const loadDeleted = async () => {
    setLoadingDeleted(true);
    try {
      setDeletedTasks(await viraApi.deletedTasks(token, project.id));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoadingDeleted(false);
    }
  };
  const restoreTask = async (task) => {
    try {
      const next = await viraApi.restoreTask(
        token,
        project.id,
        task.id,
        task.version,
      );
      setDeletedTasks((current) =>
        current.filter((item) => item.id !== task.id),
      );
      restored(next);
    } catch (err) {
      setError(errorText(err));
    }
  };
  const archiveProject = async () => {
    if (
      !window.confirm(
        `Lưu trữ dự án “${project.name}”? Bạn có thể khôi phục lại sau.`,
      )
    )
      return;
    try {
      await viraApi.archiveProject(token, project.id);
      archived();
    } catch (err) {
      setError(errorText(err));
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
      <section className="card archive-panel">
        <div className="section-title">
          <div>
            <h2>Khôi phục công việc</h2>
            <p>Xem và khôi phục các task đã xóa mềm.</p>
          </div>
          <button
            className="btn secondary"
            onClick={loadDeleted}
            disabled={loadingDeleted}
          >
            {loadingDeleted ? "Đang tải..." : "Tải task đã xóa"}
          </button>
        </div>
        {deletedTasks.map((task) => (
          <div className="entity-row" key={task.id}>
            <div>
              <b>
                {task.taskCode} · {task.title}
              </b>
              <span>Đã xóa · phiên bản {task.version}</span>
            </div>
            <button className="btn secondary" onClick={() => restoreTask(task)}>
              Khôi phục
            </button>
          </div>
        ))}
        {!loadingDeleted && deletedTasks.length === 0 && (
          <p className="archive-note">
            Chọn “Tải task đã xóa” để kiểm tra danh sách.
          </p>
        )}
      </section>
      <section className="card archive-panel danger-panel">
        <h2>Lưu trữ dự án</h2>
        <p>
          Project sẽ ẩn khỏi danh sách hoạt động; dữ liệu vẫn được giữ và có thể
          khôi phục ở màn hình workspace.
        </p>
        <button
          className="btn secondary danger-button"
          onClick={archiveProject}
        >
          Lưu trữ dự án
        </button>
      </section>
      <LabelManager token={token} projectId={project.id} />
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
function TaskDetails({
  task,
  close,
  update,
  token,
  projectId,
  sprints,
  tasks,
}) {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [collaboration, setCollaboration] = useState(null);
  const [members, setMembers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [taskLabels, setTaskLabels] = useState([]);
  const [taskLinks, setTaskLinks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkType, setLinkType] = useState("RELATES_TO");
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
      const [
        nextComments,
        nextAttachments,
        nextCollaboration,
        nextMembers,
        nextLabels,
        nextTaskLabels,
        nextTaskLinks,
        nextActivity,
      ] = await Promise.all([
        viraApi.comments(token, projectId, task.id),
        viraApi.attachments(token, projectId, task.id),
        viraApi.taskCollaboration(token, projectId, task.id),
        viraApi.members(token, projectId),
        viraApi.labels(token, projectId),
        viraApi.taskLabels(token, projectId, task.id),
        viraApi.taskLinks(token, projectId, task.id),
        viraApi.taskActivity(token, projectId, task.id),
      ]);
      setComments(nextComments);
      setAttachments(nextAttachments);
      setCollaboration(nextCollaboration);
      setMembers(nextMembers);
      setLabels(nextLabels);
      setTaskLabels(nextTaskLabels);
      setTaskLinks(nextTaskLinks);
      setActivity(nextActivity);
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
  const toggleLabel = async (labelId) => {
    const ids = taskLabels.map((label) => label.id);
    try {
      setTaskLabels(
        await viraApi.updateTaskLabels(
          token,
          projectId,
          task.id,
          ids.includes(labelId)
            ? ids.filter((id) => id !== labelId)
            : [...ids, labelId],
        ),
      );
    } catch (err) {
      setError(errorText(err));
    }
  };
  const addLink = async () => {
    if (!linkTargetId) return;
    try {
      await viraApi.addTaskLink(token, projectId, task.id, {
        targetTaskId: Number(linkTargetId),
        linkType,
      });
      setLinkTargetId("");
      setTaskLinks(await viraApi.taskLinks(token, projectId, task.id));
    } catch (err) {
      setError(errorText(err));
    }
  };
  const removeLink = async (linkId) => {
    try {
      await viraApi.removeTaskLink(token, projectId, task.id, linkId);
      setTaskLinks(await viraApi.taskLinks(token, projectId, task.id));
    } catch (err) {
      setError(errorText(err));
    }
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
            <h3>Lịch sử công việc</h3>
            <div className="audit-list compact-audit">
              {activity.slice(0, 8).map((item) => (
                <div key={item.id} className="audit-item">
                  <b>{item.actorName}</b>
                  <span>{item.action.replaceAll("_", " ")}</span>
                  <time>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </time>
                </div>
              ))}
              {!activity.length && <p>Chưa có lịch sử thao tác.</p>}
            </div>
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
            <div className="task-participants">
              <span>Nhãn</span>
              <div className="task-labels">
                {taskLabels.map((label) => (
                  <i key={label.id} style={{ background: label.color }}>
                    {label.name}
                  </i>
                ))}
                {!taskLabels.length && <p>Chưa có nhãn</p>}
              </div>
              <details className="participant-picker">
                <summary>Chỉnh nhãn</summary>
                {labels.map((label) => (
                  <label key={label.id}>
                    <input
                      type="checkbox"
                      checked={taskLabels.some((item) => item.id === label.id)}
                      onChange={() => toggleLabel(label.id)}
                    />{" "}
                    <i
                      className="label-dot"
                      style={{ background: label.color }}
                    />
                    {label.name}
                  </label>
                ))}
              </details>
            </div>
            <div className="task-participants">
              <span>Liên kết ({taskLinks.length})</span>
              <div className="task-link-list">
                {taskLinks.map((link) => (
                  <div key={link.id} className="task-link-item">
                    <span>
                      {link.linkType}: {link.targetTaskCode} ·{" "}
                      {link.targetTaskTitle}
                    </span>
                    <button
                      className="icon-btn compact-icon"
                      aria-label={`Gỡ liên kết ${link.targetTaskCode}`}
                      onClick={() => removeLink(link.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {!taskLinks.length && <p>Chưa có liên kết</p>}
              </div>
              <div className="task-link-form">
                <select
                  aria-label="Loại liên kết"
                  value={linkType}
                  onChange={(event) => setLinkType(event.target.value)}
                >
                  <option value="RELATES_TO">Liên quan</option>
                  <option value="BLOCKS">Chặn</option>
                  <option value="DUPLICATES">Trùng lặp</option>
                </select>
                <select
                  aria-label="Công việc cần liên kết"
                  value={linkTargetId}
                  onChange={(event) => setLinkTargetId(event.target.value)}
                >
                  <option value="">Chọn công việc</option>
                  {tasks
                    .filter((item) => item.id !== task.id)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.taskCode} · {item.title}
                      </option>
                    ))}
                </select>
                <button
                  className="btn secondary"
                  onClick={addLink}
                  disabled={!linkTargetId}
                >
                  <Plus size={14} /> Liên kết
                </button>
              </div>
            </div>
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

function SprintPage({ token, project, tasks, sprints, reload, isAdmin }) {
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
      {isAdmin && (
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
      )}
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
            {isAdmin && sprint.status === "PLANNED" && (
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
            {isAdmin && sprint.status === "ACTIVE" && (
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
function MembersPage({ token, project, currentUser }) {
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

  const currentMember = members.find((m) => m.userId === currentUser?.id);
  const canManage = currentMember?.role === "OWNER" || currentMember?.role === "ADMIN" || project?.ownerId === currentUser?.id;

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">CỘNG TÁC</p>
          <h1>Thành viên dự án</h1>
          <p>Mời thành viên và quản lý vai trò truy cập ({members.length} thành viên).</p>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {canManage && (
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
      )}
      <div className="entity-list">
        {members.map((member) => (
          <article className="card entity-row" key={member.userId}>
            <Avatar text={initials(member.fullName)} />
            <div>
              <b>{member.fullName}</b>
              <span>{member.email}</span>
            </div>
            {member.role === "OWNER" ? (
              <span className="role-badge owner">Chủ sở hữu</span>
            ) : canManage ? (
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
                <option value="ADMIN">Quản trị viên</option>
                <option value="MEMBER">Thành viên</option>
              </select>
            ) : (
              <span className={`role-badge ${(member.role || "member").toLowerCase()}`}>
                {ROLE_LABELS[member.role] || member.role}
              </span>
            )}
            {canManage && member.role !== "OWNER" && (
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
  const [projectType, setProjectType] = useState("KANBAN");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleProjectNameChange = (event) => {
    const val = event.target.value;
    setName(val);
    const autoKey = val
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 6)
      .toUpperCase();
    if (!key || key === autoKey.slice(0, -1)) {
      setKey(autoKey);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (step === "workspace") {
        const createdWorkspace = await viraApi.createWorkspace(token, {
          name: name.trim(),
          description: "",
        });
        setWorkspace(createdWorkspace);
        setName("");
        setStep("project");
      } else {
        const cleanKey = key.trim().toUpperCase();
        if (!/^[A-Za-z][A-Za-z0-9]{1,11}$/.test(cleanKey)) {
          setError("Mã dự án phải gồm 2-12 ký tự chữ và số, bắt đầu bằng chữ cái.");
          setSaving(false);
          return;
        }

        const createdProject = await viraApi.createProject(token, workspace.id, {
          name: name.trim(),
          projectKey: cleanKey,
          description: "",
          projectType,
        });

        // Tự động tạo 3 task mẫu để trải nghiệm Kanban ngay
        try {
          const t1 = await viraApi.createTask(token, createdProject.id, {
            title: "👋 Chào mừng bạn đến với Vira! Bắt đầu kéo thả thẻ này",
            description:
              "Kéo thẻ này sang các cột 'Đang thực hiện' hoặc 'Hoàn thành' để trải nghiệm bảng Kanban trực quan.",
            taskType: "TASK",
            priority: "HIGH",
            storyPoints: 2,
          });

          const t2 = await viraApi.createTask(token, createdProject.id, {
            title: "📝 Nhấp vào thẻ để tùy biến chi tiết công việc",
            description:
              "Nhấp vào bất kỳ thẻ nào để mở bảng chi tiết: thêm mô tả, phân công thành viên, đính kèm tệp và để lại bình luận.",
            taskType: "TASK",
            priority: "MEDIUM",
            storyPoints: 3,
          });
          if (t2?.id) {
            await viraApi.updateTaskStatus(token, createdProject.id, t2.id, {
              status: "IN_PROGRESS",
              version: t2.version,
            });
          }

          await viraApi.createTask(token, createdProject.id, {
            title: "👥 Mời đồng đội cùng tham gia dự án",
            description:
              "Truy cập mục 'Thành viên' ở thanh điều hướng bên trái để gửi lời mời cho đồng nghiệp cùng cộng tác.",
            taskType: "TASK",
            priority: "MEDIUM",
            storyPoints: 1,
          });
        } catch (sampleErr) {
          console.warn("Could not create onboarding sample tasks:", sampleErr);
        }

        await ready(workspace, createdProject);
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
            ? `Chào ${user?.fullName || "bạn"}`
            : "Tạo dự án đầu tiên"}
        </h1>
        <p>
          {step === "workspace"
            ? "Tạo không gian để nhóm cùng làm việc."
            : "Dự án sẽ có bảng Kanban và công việc mẫu để bạn khám phá ngay."}
        </p>
        <form onSubmit={submit}>
          {error && <p className="form-error">{error}</p>}
          <label>
            {step === "workspace" ? "Tên không gian làm việc" : "Tên dự án"}
            <input
              required
              value={name}
              placeholder={
                step === "workspace"
                  ? "Ví dụ: Công ty Vira"
                  : "Ví dụ: Dự án Khởi đầu"
              }
              onChange={
                step === "workspace"
                  ? (e) => setName(e.target.value)
                  : handleProjectNameChange
              }
            />
          </label>
          {step === "project" && (
            <>
              <div className="form-grid">
                <label>
                  Mã dự án (Key)
                  <input
                    required
                    pattern="[A-Za-z][A-Za-z0-9]{1,11}"
                    maxLength={12}
                    style={{ textTransform: "uppercase" }}
                    value={key}
                    onChange={(event) => setKey(event.target.value.toUpperCase())}
                    placeholder="Ví dụ: VIRA"
                  />
                </label>
                <label>
                  Quy trình
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                  >
                    <option value="KANBAN">Kanban</option>
                    <option value="SCRUM">Scrum</option>
                  </select>
                </label>
              </div>
            </>
          )}
          <button className="btn primary auth-submit" disabled={saving}>
            {saving
              ? "Đang thiết lập..."
              : step === "workspace"
                ? "Tiếp tục"
                : "Hoàn tất & Khám phá"}
          </button>
          {step === "project" && (
            <button
              type="button"
              className="text-btn"
              style={{ marginTop: "12px", width: "100%", textAlign: "center" }}
              onClick={() => {
                setStep("workspace");
                setName(workspace?.name || "");
                setError("");
              }}
            >
              ← Quay lại bước trước
            </button>
          )}
        </form>
      </section>
    </main>
  );
}

function CreateProjectModal({ token, workspaceId, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [projectType, setProjectType] = useState("KANBAN");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const autoKey = val
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 6)
      .toUpperCase();
    if (!projectKey || projectKey === autoKey.slice(0, -1)) {
      setProjectKey(autoKey);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const cleanKey = projectKey.trim().toUpperCase();
    if (!/^[A-Za-z][A-Za-z0-9]{1,11}$/.test(cleanKey)) {
      setError("Mã dự án phải gồm 2-12 ký tự chữ và số, bắt đầu bằng chữ cái.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await viraApi.createProject(token, workspaceId, {
        name: name.trim(),
        projectKey: cleanKey,
        projectType,
        description: description.trim(),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="task-modal form-modal" onSubmit={submit}>
        <div className="modal-top">
          <span className="type">DỰ ÁN MỚI</span>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <h2>Tạo dự án mới</h2>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tên dự án
          <input
            required
            placeholder="Ví dụ: Phát triển Cổng thông tin"
            value={name}
            onChange={handleNameChange}
          />
        </label>
        <div className="form-grid">
          <label>
            Mã dự án (Key)
            <input
              required
              maxLength={12}
              style={{ textTransform: "uppercase" }}
              placeholder="VD: PORTAL"
              value={projectKey}
              onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
            />
          </label>
          <label>
            Loại quy trình
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
            >
              <option value="KANBAN">Kanban</option>
              <option value="SCRUM">Scrum</option>
            </select>
          </label>
        </div>
        <label>
          Mô tả (không bắt buộc)
          <textarea
            placeholder="Mô tả ngắn gọn về mục tiêu dự án..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn primary" disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo dự án"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateWorkspaceModal({ token, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const created = await viraApi.createWorkspace(token, {
        name: name.trim(),
        description: description.trim(),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="task-modal form-modal" onSubmit={submit}>
        <div className="modal-top">
          <span className="type">KHÔNG GIAN LÀM VIỆC MỚI</span>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>
        <h2>Tạo không gian làm việc</h2>
        {error && <p className="form-error">{error}</p>}
        <label>
          Tên không gian làm việc
          <input
            required
            placeholder="Ví dụ: Công ty Vira, Đội Phát triển..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Mô tả (không bắt buộc)
          <textarea
            placeholder="Mô tả mục đích của không gian làm việc này..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={onClose}>
            Hủy
          </button>
          <button className="btn primary" disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo không gian làm việc"}
          </button>
        </div>
      </form>
    </div>
  );
}

function WorkspaceSwitcher({
  token,
  currentWorkspace,
  currentProject,
  onSelectProject,
  onSelectWorkspace,
  onOpenCreateProject,
  onOpenCreateWorkspace,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = React.useRef(null);

  const loadData = useCallback(async () => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    try {
      const [allWorkspaces, wsProjects] = await Promise.all([
        viraApi.workspaces(token),
        viraApi.projects(token, currentWorkspace.id),
      ]);
      setWorkspaces(allWorkspaces);
      setProjects(wsProjects);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token, currentWorkspace?.id]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="workspace-switcher-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`workspace ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Chuyển đổi dự án hoặc không gian làm việc"
      >
        <div className="workspace-icon">
          {initials(currentWorkspace?.name || "V")}
        </div>
        <div>
          <b>{currentWorkspace?.name}</b>
          <span>{currentProject?.name || "Chọn dự án"}</span>
        </div>
        <ChevronDown
          size={16}
          className={`chevron-icon ${isOpen ? "rotate" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="workspace-dropdown card">
          {loading && (
            <div className="dropdown-loading">
              <span>Đang tải danh sách...</span>
            </div>
          )}

          <div className="dropdown-section">
            <p className="dropdown-section-title">
              DỰ ÁN TRONG WORKSPACE NÀY
            </p>
            <div className="dropdown-item-list">
              {projects.map((p) => {
                const isSelected = p.id === currentProject?.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`dropdown-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setIsOpen(false);
                      onSelectProject(p);
                    }}
                  >
                    <FolderKanban size={16} className="dropdown-item-icon" />
                    <div className="dropdown-item-content">
                      <b className="dropdown-item-title">{p.name}</b>
                      <span className="dropdown-item-meta">
                        {p.projectKey} · {p.projectType}
                      </span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="dropdown-check-icon" />
                    )}
                  </button>
                );
              })}
              {!loading && projects.length === 0 && (
                <p className="dropdown-empty-text">Chưa có dự án nào</p>
              )}
            </div>
            <button
              type="button"
              className="dropdown-action-btn"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateProject();
              }}
            >
              <Plus size={15} />
              <span>Tạo dự án mới...</span>
            </button>
          </div>

          <div className="dropdown-divider" />

          <div className="dropdown-section">
            <p className="dropdown-section-title">
              KHÔNG GIAN LÀM VIỆC CỦA BẠN
            </p>
            <div className="dropdown-item-list">
              {workspaces.map((ws) => {
                const isSelected = ws.id === currentWorkspace?.id;
                return (
                  <button
                    key={ws.id}
                    type="button"
                    className={`dropdown-item ${isSelected ? "selected" : ""}`}
                    onClick={() => {
                      setIsOpen(false);
                      onSelectWorkspace(ws);
                    }}
                  >
                    <BriefcaseBusiness
                      size={16}
                      className="dropdown-item-icon"
                    />
                    <div className="dropdown-item-content">
                      <b className="dropdown-item-title">{ws.name}</b>
                    </div>
                    {isSelected && (
                      <CheckCircle2 size={16} className="dropdown-check-icon" />
                    )}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="dropdown-action-btn"
              onClick={() => {
                setIsOpen(false);
                onOpenCreateWorkspace();
              }}
            >
              <Plus size={15} />
              <span>Tạo không gian làm việc mới...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditPage({ token, project }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    viraApi
      .projectActivity(token, project.id)
      .then(setItems)
      .catch((err) => setError(errorText(err)));
  }, [token, project.id]);
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">KIỂM SOÁT</p>
          <h1>Lịch sử dự án</h1>
          <p>Theo dõi các thay đổi quan trọng trong project và công việc.</p>
        </div>
      </div>
      <div className="card audit-page">
        {error && <p className="form-error">{error}</p>}
        <div className="audit-list">
          {items.map((item) => (
            <article className="audit-item" key={item.id}>
              <div className="audit-marker" aria-hidden="true" />
              <div>
                <b>{item.actorName}</b>
                <p>
                  {item.action.replaceAll("_", " ")}
                  {item.taskCode ? ` · ${item.taskCode}` : ""}
                </p>
                <time>{new Date(item.createdAt).toLocaleString("vi-VN")}</time>
              </div>
            </article>
          ))}
          {!items.length && !error && (
            <p>Chưa có thao tác nào được ghi nhận.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ProfilePage({ token, session, onSession }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: "", avatarUrl: "" });
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    viraApi
      .profile(token)
      .then((value) => {
        setProfile(value);
        setForm({ fullName: value.fullName, avatarUrl: value.avatarUrl || "" });
      })
      .catch((err) => setError(errorText(err)));
  }, [token]);
  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const next = await viraApi.updateProfile(token, form);
      setProfile(next);
      const nextSession = { ...session, user: { ...session.user, ...next } };
      localStorage.setItem("vira.session", JSON.stringify(nextSession));
      onSession(nextSession);
      setMessage("Đã lưu hồ sơ.");
    } catch (err) {
      setError(errorText(err));
    }
  };
  const changePassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      await viraApi.changePassword(token, passwords);
      setPasswords({ currentPassword: "", newPassword: "" });
      setMessage("Đã đổi mật khẩu.");
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">TÀI KHOẢN</p>
          <h1>Hồ sơ cá nhân</h1>
          <p>Quản lý thông tin và bảo mật tài khoản.</p>
        </div>
      </div>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <div className="profile-grid">
        <form className="card settings-form" onSubmit={saveProfile}>
          <h2>Thông tin hồ sơ</h2>
          <label>
            Email
            <input value={profile?.email || ""} readOnly aria-readonly="true" />
          </label>
          <label>
            Họ và tên
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label>
            URL ảnh đại diện
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
          </label>
          <button className="btn primary">Lưu hồ sơ</button>
        </form>
        <form className="card settings-form" onSubmit={changePassword}>
          <h2>Đổi mật khẩu</h2>
          <label>
            Mật khẩu hiện tại
            <input
              required
              type={showPassword ? "text" : "password"}
              value={passwords.currentPassword}
              onChange={(e) =>
                setPasswords({ ...passwords, currentPassword: e.target.value })
              }
            />
          </label>
          <label>
            Mật khẩu mới (ít nhất 8 ký tự)
            <div className="password-field">
              <input
                required
                minLength="8"
                type={showPassword ? "text" : "password"}
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>
          <button className="btn primary">Đổi mật khẩu</button>
        </form>
      </div>
    </section>
  );
}

function WorkspaceHome({ token, workspace, selectProject, switchWorkspace, archiveWorkspace }) {
  const [projects, setProjects] = useState([]);
  const [archived, setArchived] = useState([]);
  const [error, setError] = useState("");
  const [newProject, setNewProject] = useState({
    name: "",
    projectKey: "",
    projectType: "KANBAN",
  });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [active, archivedItems] = await Promise.all([
        viraApi.projects(token, workspace.id),
        viraApi.archivedProjects(token, workspace.id),
      ]);
      setProjects(active);
      setArchived(archivedItems);
    } catch (err) {
      setError(errorText(err));
    }
  }, [token, workspace.id]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (item) => {
    try {
      selectProject(await viraApi.restoreProject(token, item.id));
    } catch (err) {
      setError(errorText(err));
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setError("");
    setCreating(true);
    try {
      const created = await viraApi.createProject(token, workspace.id, {
        name: newProject.name.trim(),
        projectKey: newProject.projectKey.trim().toUpperCase(),
        description: "",
        projectType: newProject.projectType || "KANBAN",
      });
      selectProject(created);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="auth-page workspace-home">
      <section className="auth-card wide-card">
        <div className="brand">
          <div className="brand-mark">V</div>
          <span>vira</span>
        </div>
        <p className="eyebrow">KHÔNG GIAN LÀM VIỆC</p>
        <h1>{workspace.name}</h1>
        <p>Chọn dự án để tiếp tục hoặc khôi phục dự án đã lưu trữ.</p>
        {error && <p className="form-error">{error}</p>}
        <div className="project-choice-list">
          {projects.map((item) => (
            <button key={item.id} onClick={() => selectProject(item)}>
              <b>
                {item.projectKey} · {item.name}
              </b>
              <span>{item.projectType}</span>
            </button>
          ))}
          {!projects.length && <p>Chưa có dự án hoạt động.</p>}
        </div>
        {archived.length > 0 && (
          <>
            <h2 className="archived-heading">Dự án đã lưu trữ</h2>
            <div className="project-choice-list">
              {archived.map((item) => (
                <div className="archived-project" key={item.id}>
                  <div>
                    <b>
                      {item.projectKey} · {item.name}
                    </b>
                    <span>Đã lưu trữ</span>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() => restore(item)}
                  >
                    Khôi phục
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <form className="create-workspace-form" onSubmit={handleCreateProject}>
          <label>
            Tạo dự án mới
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "8px", marginTop: "6px" }}>
              <input
                required
                placeholder="Tên dự án (ví dụ: Phát triển Web)"
                value={newProject.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const autoKey = val.split(/\s+/).map(w => w[0]).join("").slice(0, 5).toUpperCase();
                  setNewProject(prev => ({
                    ...prev,
                    name: val,
                    projectKey: prev.projectKey ? prev.projectKey : autoKey,
                  }));
                }}
              />
              <input
                required
                placeholder="Mã (KEY)"
                maxLength={10}
                style={{ textTransform: "uppercase" }}
                value={newProject.projectKey}
                onChange={(e) => setNewProject({ ...newProject, projectKey: e.target.value.toUpperCase() })}
              />
              <select
                value={newProject.projectType}
                onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
              >
                <option value="KANBAN">Kanban</option>
                <option value="SCRUM">Scrum</option>
              </select>
            </div>
          </label>
          <button className="btn primary" disabled={creating} style={{ marginTop: "10px" }}>
            {creating ? "Đang tạo..." : "Tạo dự án"}
          </button>
        </form>
        <div style={{ marginTop: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button" className="text-btn" onClick={switchWorkspace}>
            ← Đổi không gian làm việc khác
          </button>
          <button type="button" className="text-danger-btn" onClick={archiveWorkspace}>
            Lưu trữ workspace này
          </button>
        </div>
      </section>
    </main>
  );
}

function WorkspaceLanding({ token, chooseWorkspace, onLogout }) {
  const [active, setActive] = useState([]);
  const [archived, setArchived] = useState([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      const [current, old] = await Promise.all([
        viraApi.workspaces(token),
        viraApi.archivedWorkspaces(token),
      ]);
      setActive(current);
      setArchived(old);
    } catch (err) {
      setError(errorText(err));
      if (err?.status === 401 && onLogout) {
        onLogout();
      }
    }
  }, [token, onLogout]);
  useEffect(() => {
    load();
  }, [load]);
  const create = async (event) => {
    event.preventDefault();
    try {
      chooseWorkspace(
        await viraApi.createWorkspace(token, { name, description: "" }),
      );
    } catch (err) {
      setError(errorText(err));
    }
  };
  const restore = async (item) => {
    try {
      chooseWorkspace(await viraApi.restoreWorkspace(token, item.id));
    } catch (err) {
      setError(errorText(err));
    }
  };
  return (
    <main className="auth-page workspace-home">
      <section className="auth-card wide-card">
        <div className="brand">
          <div className="brand-mark">V</div>
          <span>vira</span>
        </div>
        <p className="eyebrow">KHÔNG GIAN LÀM VIỆC</p>
        <h1>Chọn không gian làm việc</h1>
        <p>
          Chọn workspace đang hoạt động hoặc khôi phục workspace đã lưu trữ.
        </p>
        {error && <p className="form-error">{error}</p>}
        <div className="project-choice-list">
          {active.map((item) => (
            <button key={item.id} onClick={() => chooseWorkspace(item)}>
              <b>{item.name}</b>
              <span>Workspace đang hoạt động</span>
            </button>
          ))}
          {!active.length && <p>Chưa có workspace hoạt động.</p>}
        </div>
        {archived.length > 0 && (
          <>
            <h2 className="archived-heading">Workspace đã lưu trữ</h2>
            <div className="project-choice-list">
              {archived.map((item) => (
                <div className="archived-project" key={item.id}>
                  <div>
                    <b>{item.name}</b>
                    <span>Đã lưu trữ</span>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() => restore(item)}
                  >
                    Khôi phục
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
        <form className="create-workspace-form" onSubmit={create}>
          <label>
            Tạo workspace mới
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Tên workspace"
            />
          </label>
          <button className="btn primary">Tạo</button>
        </form>
        <div style={{ marginTop: "16px", textAlign: "center", display: "flex", justifyContent: "center", gap: "10px" }}>
          {error && (
            <button
              type="button"
              className="btn secondary"
              onClick={load}
            >
              Thử lại
            </button>
          )}
          {onLogout && (
            <button type="button" className="text-btn" onClick={onLogout}>
              Đăng xuất / Đăng nhập tài khoản khác
            </button>
          )}
        </div>
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
  const [isNewUser, setIsNewUser] = useState(false);
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false);
  const [createWorkspaceModalOpen, setCreateWorkspaceModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [overview, setOverview] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [members, setMembers] = useState([]);
  const [page, setPage] = useState("Tổng quan");
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState("");
  const [mobile, setMobile] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const loadProject = useCallback(async (token, value) => {
    const [loadedTasks, loadedOverview, loadedSprints, loadedMembers] = await Promise.all([
      viraApi.tasks(token, value.id),
      viraApi.overview(token, value.id),
      viraApi.sprints(token, value.id),
      viraApi.members(token, value.id).catch(() => []),
    ]);
    setTasks(loadedTasks);
    setOverview(loadedOverview);
    setSprints(loadedSprints);
    setMembers(loadedMembers);
  }, []);
  const bootstrap = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const workspaces = await viraApi.workspaces(session.accessToken);
      if (!workspaces.length) {
        setIsNewUser(true);
        setWorkspace(null);
        setProject(null);
        return;
      }
      setIsNewUser(false);
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
  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem("vira.session");
      setSession(null);
      setWorkspace(null);
      setProject(null);
    };
    window.addEventListener("vira:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("vira:unauthorized", handleUnauthorized);
  }, []);
  const authenticated = (next) => {
    localStorage.setItem("vira.session", JSON.stringify(next));
    setSession(next);
  };
  const ready = async (newWorkspace, newProject) => {
    setWorkspace(newWorkspace);
    setProject(newProject);
    setPage("Bảng công việc");
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
  const moveTask = async (taskId, targetStatusOrPosition, maybePosition) => {
    const task = tasks.find((item) => String(item.id) === String(taskId));
    if (!task) return;

    let targetStatus = task.status;
    let position = 0;

    if (typeof targetStatusOrPosition === "string") {
      targetStatus = targetStatusOrPosition;
      position = typeof maybePosition === "number" ? maybePosition : 0;
    } else if (typeof targetStatusOrPosition === "number") {
      position = targetStatusOrPosition;
    }

    try {
      setTasks((current) =>
        current.map((t) =>
          String(t.id) === String(taskId)
            ? { ...t, status: targetStatus }
            : t,
        ),
      );

      await viraApi.moveTask(session.accessToken, project.id, task.id, {
        status: targetStatus,
        position,
        version: task.version,
      });

      const [freshTasks, freshOverview] = await Promise.all([
        viraApi.tasks(session.accessToken, project.id),
        viraApi.overview(session.accessToken, project.id),
      ]);
      setTasks(freshTasks);
      setOverview(freshOverview);
    } catch (err) {
      const freshTasks = await viraApi
        .tasks(session.accessToken, project.id)
        .catch(() => null);
      if (freshTasks) setTasks(freshTasks);
      setError(errorText(err));
    }
  };
  const chooseWorkspace = async (nextWorkspace) => {
    setWorkspace(nextWorkspace);
    try {
      const projects = await viraApi.projects(
        session.accessToken,
        nextWorkspace.id,
      );
      if (projects.length) {
        setProject(projects[0]);
        await loadProject(session.accessToken, projects[0]);
      } else {
        setProject(null);
        setCreateProjectModalOpen(true);
      }
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
  if (isNewUser)
    return (
      <Setup
        token={session.accessToken}
        user={session.user}
        ready={async (ws, proj) => {
          setIsNewUser(false);
          await ready(ws, proj);
        }}
      />
    );
  if (!workspace)
    return (
      <WorkspaceLanding
        token={session.accessToken}
        chooseWorkspace={chooseWorkspace}
        onLogout={() => {
          localStorage.removeItem("vira.session");
          setSession(null);
          setWorkspace(null);
          setProject(null);
        }}
      />
    );
  if (!project)
    return (
      <>
        <WorkspaceHome
          token={session.accessToken}
          workspace={workspace}
          selectProject={async (item) => {
            setProject(item);
            await loadProject(session.accessToken, item);
          }}
          switchWorkspace={() => {
            setProject(null);
            setWorkspace(null);
          }}
          archiveWorkspace={async () => {
            if (!window.confirm(`Lưu trữ workspace “${workspace.name}”?`)) return;
            try {
              await viraApi.archiveWorkspace(session.accessToken, workspace.id);
              setProject(null);
              setWorkspace(null);
            } catch (err) {
              setError(errorText(err));
            }
          }}
        />
        {createProjectModalOpen && (
          <CreateProjectModal
            token={session.accessToken}
            workspaceId={workspace.id}
            onCreated={async (newProj) => {
              setProject(newProj);
              setPage("Bảng công việc");
              await loadProject(session.accessToken, newProj);
            }}
            onClose={() => setCreateProjectModalOpen(false)}
          />
        )}
      </>
    );
  const currentMember = members.find((m) => m.userId === session?.user?.id);
  const myRole = currentMember?.role || (project?.ownerId === session?.user?.id ? "OWNER" : "MEMBER");
  const isAdmin = myRole === "OWNER" || myRole === "ADMIN";

  const content =
    page === "Tổng quan" ? (
      <Overview
        overview={overview}
        tasks={tasks}
        open={setSelected}
        create={setCreating}
      />
    ) : page === "Bảng công việc" ? (
      <Board
        tasks={tasks}
        open={setSelected}
        create={setCreating}
        move={moveTask}
        token={session.accessToken}
        projectId={project.id}
        isAdmin={isAdmin}
      />
    ) : page === "Backlog" ? (
      <Backlog
        tasks={tasks}
        open={setSelected}
        create={setCreating}
        move={moveTask}
        token={session.accessToken}
        projectId={project.id}
      />
    ) : page === "Sprint" ? (
      <SprintPage
        token={session.accessToken}
        project={project}
        tasks={tasks}
        sprints={sprints}
        reload={() => loadProject(session.accessToken, project)}
        isAdmin={isAdmin}
      />
    ) : page === "Thành viên" ? (
      <MembersPage
        token={session.accessToken}
        project={project}
        currentUser={session.user}
      />
    ) : page === "Lịch sử" ? (
      <AuditPage token={session.accessToken} project={project} />
    ) : page === "Hồ sơ" ? (
      <ProfilePage
        token={session.accessToken}
        session={session}
        onSession={setSession}
      />
    ) : page === "Cài đặt dự án" ? (
      <ProjectSettings
        token={session.accessToken}
        project={project}
        saved={setProject}
        restored={(task) =>
          setTasks((current) =>
            [...current, task].sort((a, b) => a.position - b.position),
          )
        }
        archived={() => setProject(null)}
      />
    ) : (
      <Reports
        overview={overview}
        tasks={tasks}
        sprints={sprints}
        token={session.accessToken}
        projectId={project.id}
      />
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
        <WorkspaceSwitcher
          token={session.accessToken}
          currentWorkspace={workspace}
          currentProject={project}
          onSelectProject={async (p) => {
            setProject(p);
            await loadProject(session.accessToken, p);
          }}
          onSelectWorkspace={async (ws) => {
            await chooseWorkspace(ws);
          }}
          onOpenCreateProject={() => setCreateProjectModalOpen(true)}
          onOpenCreateWorkspace={() => setCreateWorkspaceModalOpen(true)}
        />
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
          {isAdmin && (
            <button onClick={() => setPage("Cài đặt dự án")}>
              <FolderKanban size={18} />
              {project.projectKey}
            </button>
          )}
          <button onClick={() => setPage("Hồ sơ")}>
            <Settings size={18} />
            Hồ sơ cá nhân
          </button>
          <div className="user-card">
            <Avatar text={initials(session.user.fullName)} />
            <div>
              <b>{session.user.fullName}</b>
              <span className={`role-pill ${(myRole || "member").toLowerCase()}`}>
                {ROLE_LABELS[myRole] || myRole}
              </span>
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
        tasks={tasks}
      />
      {creating && (
        <TaskForm
          close={() => setCreating(null)}
          submit={create}
          defaultStatus={creating}
        />
      )}
      {createProjectModalOpen && workspace && (
        <CreateProjectModal
          token={session.accessToken}
          workspaceId={workspace.id}
          onCreated={async (newProj) => {
            setProject(newProj);
            setPage("Bảng công việc");
            await loadProject(session.accessToken, newProj);
          }}
          onClose={() => setCreateProjectModalOpen(false)}
        />
      )}
      {createWorkspaceModalOpen && (
        <CreateWorkspaceModal
          token={session.accessToken}
          onCreated={async (newWs) => {
            setWorkspace(newWs);
            setProject(null);
            setCreateProjectModalOpen(true);
          }}
          onClose={() => setCreateWorkspaceModalOpen(false)}
        />
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
