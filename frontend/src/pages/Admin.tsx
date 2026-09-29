import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Award,
  Ban,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Loader2,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Table,
  Trash2,
  UserCheck,
  Users,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  ArrowUpDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button } from "../components/ui/Primitives";
import { api } from "../utils/api";
import { SkillApprovalQueue } from "../features/skill-management/SkillManagement";
import AdminCourseModeration from "../components/AdminCourseModeration";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "Active" | "Pending" | "Suspended" | "Banned";
type Role = "User" | "Admin";
type AdminTab = "dashboard" | "users" | "database" | "certificates" | "courses";

type User = {
  id: string | number;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  teachSkills: string[];
  learnSkills: string[];
  skillLevel: string;
  learningMode: string;
  availability: string | string[];
  role: Role;
  status: Status;
  rating: number;
  totalReviews: number;
  completedSwaps: number;
  pendingSwaps: number;
  cancelledSwaps: number;
  reports: number;
  joinedAt: string;
  lastLogin: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const statuses: Status[] = ["Active", "Pending", "Suspended", "Banned"];

const statusBadge: Record<Status, string> = {
  Active: "bg-emerald-100 text-emerald-800",
  Pending: "bg-amber-100 text-amber-800",
  Suspended: "bg-orange-100 text-orange-800",
  Banned: "bg-rose-100 text-rose-800",
};

const ADMIN_TABLES = [
  { name: "users", icon: "👤", label: "Users" },
  { name: "profiles", icon: "🪪", label: "Profiles" },
  { name: "skills", icon: "🎯", label: "Skills" },
  { name: "member_skills", icon: "🔗", label: "Member Skills" },
  { name: "skill_requests", icon: "📋", label: "Skill Requests" },
  { name: "exchanges", icon: "🔄", label: "Exchanges" },
  { name: "notifications", icon: "🔔", label: "Notifications" },
  { name: "conversations", icon: "💬", label: "Conversations" },
  { name: "messages", icon: "✉️", label: "Messages" },
  { name: "reviews", icon: "⭐", label: "Reviews" },
  { name: "courses", icon: "📚", label: "Courses" },
  { name: "course_enrollments", icon: "📝", label: "Enrollments" },
  { name: "lectures", icon: "🎙️", label: "Lectures" },
  { name: "lecture_attendance", icon: "🎓", label: "Attendance" },
  { name: "exams", icon: "📄", label: "Exams" },
  { name: "exam_questions", icon: "❓", label: "Exam Questions" },
  { name: "exam_attempts", icon: "✏️", label: "Exam Attempts" },
  { name: "certificate_requests", icon: "🏅", label: "Cert Requests" },
  { name: "certificates", icon: "🎖️", label: "Certificates" },
  { name: "lecture_messages", icon: "💭", label: "Lecture Chat" },
  { name: "community_posts", icon: "📢", label: "Community Posts" },
  { name: "post_comments", icon: "💬", label: "Post Comments" },
  { name: "post_reactions", icon: "❤️", label: "Post Reactions" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (date: string) => {
  if (!date) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return date;
  }
};

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  const str = String(value);
  // Truncate long strings
  if (str.length > 80) return str.slice(0, 77) + "…";
  return str;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function UserStatusBadge({ status }: { status: Status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusBadge[status] ?? "bg-ink/5 text-ink/60"}`}>
      {status}
    </span>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl bg-[#f7f5f2] px-3 py-2.5 pr-8 text-sm font-bold text-ink/65 outline-none ring-1 ring-transparent focus:ring-violet"
      >
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
      <ChevronRight
        size={14}
        className="pointer-events-none absolute right-2 top-3 rotate-90 text-ink/40"
      />
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-ink/45">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink/70 break-words">{value || "—"}</p>
    </div>
  );
}

function UserDrawer({
  user,
  onClose,
  onAction,
}: {
  user: User;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  const avail = Array.isArray(user.availability)
    ? user.availability.join(", ")
    : (user.availability as string) || "—";

  const stat = [
    ["Total requests", user.completedSwaps + user.pendingSwaps + user.cancelledSwaps],
    ["Completed", user.completedSwaps],
    ["Cancelled", user.cancelledSwaps],
    ["Pending", user.pendingSwaps],
    ["Avg rating", user.rating ? `★ ${Number(user.rating).toFixed(1)}` : "—"],
    ["Total reviews", user.totalReviews],
    ["Reports", user.reports],
  ];

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[1px]" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-[#f7f5f2] p-5 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={user.fullName} />
            <div>
              <h2 className="font-display text-3xl">{user.fullName}</h2>
              <p className="text-sm text-ink/55">
                @{user.username} · <UserStatusBadge status={user.status} />
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl bg-white p-2">
            <X />
          </button>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-5">
          <p className="eyebrow">Personal information</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={user.email} />
            <Detail label="Phone" value={user.phone} />
            <Detail label="City" value={user.city} />
            <Detail label="Role" value={user.role} />
            <Detail label="Registered" value={formatDate(user.joinedAt)} />
            <Detail label="Last login" value={formatDate(user.lastLogin)} />
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white p-5">
          <p className="eyebrow">Profile information</p>
          {user.bio && <p className="mt-3 text-sm leading-6 text-ink/65">{user.bio}</p>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Teaches" value={user.teachSkills.join(", ")} />
            <Detail label="Wants to learn" value={user.learnSkills.join(", ")} />
            <Detail label="Skill level" value={user.skillLevel} />
            <Detail label="Learning mode" value={user.learningMode} />
            <Detail label="Availability" value={avail} />
          </div>
        </section>

        <section className="mt-4">
          <p className="eyebrow">Statistics</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat.map(([label, value]) => (
              <div key={label as string} className="rounded-2xl bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">{label}</p>
                <p className="mt-2 text-xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => onAction("Activate")} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <UserCheck size={16} /> Activate
          </Button>
          <Button onClick={() => onAction("Suspend")} className="bg-amber-500 text-ink hover:bg-amber-400">
            <ShieldAlert size={16} /> Suspend
          </Button>
          <Button onClick={() => onAction("Ban")} className="bg-rose-600 text-white hover:bg-rose-700">
            <Ban size={16} /> Ban
          </Button>
          <Button onClick={() => onAction("Delete")} className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50">
            <Trash2 size={16} /> Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}

function Confirm({
  action,
  count,
  onClose,
  onConfirm,
}: {
  action: string;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const destructive = action === "Delete" || action === "Ban";
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-ink/40 p-5 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${destructive ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
          {destructive ? <Trash2 size={20} /> : <ShieldAlert size={20} />}
        </div>
        <h2 className="mt-5 font-display text-3xl">
          {action} {count} user{count === 1 ? "" : "s"}?
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">
          {action === "Delete"
            ? "This permanently removes the selected user profiles. This action cannot be undone."
            : `The selected users will be marked as ${action.toLowerCase()}.`}
        </p>
        <div className="mt-7 flex justify-end gap-3">
          <Button onClick={onClose} className="bg-white text-ink ring-1 ring-ink/10 hover:bg-ink/5">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={destructive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-ink text-white hover:bg-violet"}
          >
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Database Table Viewer ────────────────────────────────────────────────────
function DatabaseTableViewer() {
  const [selectedTable, setSelectedTable] = useState(ADMIN_TABLES[0].name);
  const [tableData, setTableData] = useState<{ rows: Record<string, unknown>[]; total: number; columns: string[] }>({
    rows: [],
    total: 0,
    columns: [],
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTableData = useCallback(async (table: string, p: number) => {
    try {
      setLoading(true);
      setError("");
      const result = await api.adminGetTable(table, p, pageSize);
      const rows = result.rows || [];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
      setTableData({ rows, total: result.total, columns });
    } catch (err: any) {
      setError(err.message || "Failed to load table data");
      setTableData({ rows: [], total: 0, columns: [] });
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    setPage(1);
    setSearch("");
    fetchTableData(selectedTable, 1);
  }, [selectedTable, fetchTableData]);

  useEffect(() => {
    fetchTableData(selectedTable, page);
  }, [page, selectedTable, fetchTableData]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return tableData.rows;
    const q = search.toLowerCase();
    return tableData.rows.filter((row) =>
      Object.values(row).some((v) =>
        String(v ?? "").toLowerCase().includes(q)
      )
    );
  }, [tableData.rows, search]);

  const totalPages = Math.max(1, Math.ceil(tableData.total / pageSize));

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* Table list */}
      <aside className="rounded-2xl bg-white p-3 shadow-sm border h-fit">
        <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-ink/40">
          Database Tables ({ADMIN_TABLES.length})
        </p>
        <div className="mt-2 space-y-0.5 max-h-[75vh] overflow-y-auto">
          {ADMIN_TABLES.map((t) => (
            <button
              key={t.name}
              onClick={() => setSelectedTable(t.name)}
              className={`w-full text-left rounded-xl px-3 py-2 text-sm transition flex items-center gap-2 ${selectedTable === t.name
                  ? "bg-violet/10 text-violet font-bold"
                  : "text-ink/60 hover:bg-ink/5 font-medium"
                }`}
            >
              <span>{t.icon}</span>
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Table viewer */}
      <div className="space-y-4 min-w-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-bold capitalize">
              {ADMIN_TABLES.find((t) => t.name === selectedTable)?.label ?? selectedTable}
            </h2>
            <p className="text-xs text-ink/45">
              {tableData.total} total rows in <code className="bg-ink/5 px-1 rounded">{selectedTable}</code>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-ink/40" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter rows…"
                className="rounded-xl bg-[#f7f5f2] py-2 pl-8 pr-3 text-sm outline-none ring-1 ring-transparent focus:ring-violet w-48"
              />
            </div>
            <button
              onClick={() => fetchTableData(selectedTable, page)}
              className="rounded-xl bg-[#f7f5f2] p-2 text-ink/60 hover:bg-ink/10 transition"
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16 gap-3 text-ink/40">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-medium">Loading {selectedTable}…</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-16 gap-3 text-rose-500">
              <AlertCircle size={20} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          ) : tableData.columns.length === 0 ? (
            <div className="p-12 text-center text-ink/40">
              <Database size={32} className="mx-auto mb-2" />
              <p className="font-bold">No data</p>
              <p className="text-sm">This table is empty.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
                  <tr>
                    {tableData.columns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-4 py-3 font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRows.map((row, ri) => (
                    <tr key={ri} className="hover:bg-violet/[.02] transition">
                      {tableData.columns.map((col) => (
                        <td
                          key={col}
                          className="px-4 py-2.5 font-mono text-xs text-ink/70 max-w-[240px]"
                          title={String(row[col] ?? "")}
                        >
                          {formatCellValue(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && tableData.total > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <p className="text-ink/50">
                Page {page} of {totalPages} · {tableData.total} total rows
                {search && ` · ${filteredRows.length} filtered`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border p-1.5 disabled:opacity-40 hover:bg-ink/5"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="font-bold text-xs px-1">{page}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border p-1.5 disabled:opacity-40 hover:bg-ink/5"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Certificate Management (real API) ────────────────────────────────────────
function CertificateManagement({ notify }: { notify: (msg: string) => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getCertificateRequests("mine");
      setRequests(data || []);
    } catch {
      // fallback — admin scope may not exist; just show empty
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      await api.decideCertificateAsAdmin(id, decision);
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, admin_approval: decision, adminApproval: decision } : r
        )
      );
      notify(`Certificate ${decision} successfully.`);
    } catch {
      notify("Failed to update certificate status.");
    }
  };

  return (
    <section className="rounded-3xl border bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between">
        <div>
          <p className="eyebrow">Admin workspace / certificates</p>
          <h2 className="mt-1 font-display text-2xl">Certificate Requests</h2>
          <p className="mt-1 text-xs text-ink/50">
            Review and approve certificate requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink/40">{requests.length} requests</span>
          <button
            onClick={fetchRequests}
            className="rounded-xl bg-ink/5 p-2 text-ink/60 hover:bg-ink/10 transition"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 size={20} className="animate-spin text-ink/30" />
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left">
            <thead className="border-b bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
              <tr>
                {["Learner", "Course", "Teacher", "Exam Score", "Tutor Approval", "Admin Status", "Actions"].map(
                  (title) => (
                    <th key={title} className="whitespace-nowrap p-4 font-bold">
                      {title}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Award className="mx-auto text-ink/15" size={32} />
                    <p className="mt-2 font-bold text-ink/40">No certificate requests</p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const tutorApproval = req.tutor_approval ?? req.tutorApproval ?? "pending";
                  const adminApproval = req.admin_approval ?? req.adminApproval ?? "pending";
                  const canApprove = tutorApproval === "approved" && adminApproval === "pending";
                  return (
                    <tr key={req.id} className="group transition hover:bg-violet/[.02]">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={req.learner_name ?? req.learnerName ?? "?"} />
                          <span className="text-sm font-bold">{req.learner_name ?? req.learnerName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium">{req.course_name ?? req.courseName}</td>
                      <td className="p-4 text-sm text-ink/60">{req.teacher_name ?? req.teacherName}</td>
                      <td className="p-4 text-sm font-bold">
                        {req.exam_score != null ? `${req.exam_score}%` : "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${tutorApproval === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : tutorApproval === "rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {tutorApproval}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${adminApproval === "approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : adminApproval === "rejected"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                        >
                          {adminApproval}
                        </span>
                      </td>
                      <td className="p-4">
                        {canApprove ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => decide(req.id, "approved")}
                              title="Approve"
                              className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              onClick={() => decide(req.id, "rejected")}
                              title="Reject"
                              className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200 transition"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        ) : adminApproval === "approved" ? (
                          <span className="text-xs font-bold text-emerald-600">✓ Approved</span>
                        ) : adminApproval === "rejected" ? (
                          <span className="text-xs font-bold text-rose-600">Rejected</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-ink/40">
                            <Clock size={12} /> Awaiting tutor
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ─── Dashboard Overview ───────────────────────────────────────────────────────
function DashboardOverview({
  users,
  loading,
}: {
  users: User[];
  loading: boolean;
}) {
  const stats = useMemo(() => {
    if (loading) return null;
    const active = users.filter((u) => u.status === "Active").length;
    const admins = users.filter((u) => u.role === "Admin").length;
    const totalSwaps = users.reduce((s, u) => s + (u.completedSwaps ?? 0), 0);
    const avgRating =
      users.length > 0
        ? users.reduce((s, u) => s + (u.rating ?? 0), 0) / users.length
        : 0;
    return { total: users.length, active, admins, totalSwaps, avgRating };
  }, [users, loading]);

  const statCards = stats
    ? [
      { label: "Total Users", value: stats.total, icon: "👥", color: "bg-violet/10 text-violet" },
      { label: "Active Users", value: stats.active, icon: "🟢", color: "bg-emerald-50 text-emerald-700" },
      { label: "Admins", value: stats.admins, icon: "🛡️", color: "bg-amber-50 text-amber-700" },
      { label: "Total Swaps", value: stats.totalSwaps, icon: "🔄", color: "bg-blue-50 text-blue-700" },
      {
        label: "Avg Rating",
        value: stats.avgRating.toFixed(1) + " ★",
        icon: "⭐",
        color: "bg-yellow-50 text-yellow-700",
      },
    ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Admin workspace / overview</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">Dashboard</h1>
        <p className="mt-2 text-sm text-ink/55">
          Platform overview and quick statistics.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white p-5 shadow-sm border animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map(({ label, value, icon, color }) => (
            <div key={label} className={`rounded-2xl bg-white p-5 shadow-sm border`}>
              <div className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold ${color}`}>
                {icon} {label}
              </div>
              <p className="mt-3 text-3xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent users quick table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">Recently Registered Users</h3>
          <span className="text-xs text-ink/40">{users.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
              <tr>
                {["User", "Email", "City", "Status", "Rating", "Joined"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 animate-pulse rounded bg-ink/5" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                [...users]
                  .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
                  .slice(0, 10)
                  .map((user) => (
                    <tr key={user.id} className="hover:bg-violet/[.025]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={user.fullName} />
                          <div>
                            <p className="font-bold text-sm">{user.fullName}</p>
                            <p className="text-xs text-ink/40">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink/60">{user.email}</td>
                      <td className="px-4 py-3">{user.city || "—"}</td>
                      <td className="px-4 py-3">
                        <UserStatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {user.rating ? `★ ${Number(user.rating).toFixed(1)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-ink/50 whitespace-nowrap">
                        {formatDate(user.joinedAt)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Component ─────────────────────────────────────────────────────
export default function Admin() {
  const nav = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [role, setRole] = useState("All");
  const [city, setCity] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [drawer, setDrawer] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ action: string; users: (string | number)[] } | null>(null);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");

  const notify = useCallback((message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.adminGetUsers();
      setUsers(data);
    } catch (err: any) {
      console.error("Failed to fetch admin users:", err);
      notify("Failed to load users from database.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const cities = useMemo(
    () => Array.from(new Set(users.map((u) => u.city).filter(Boolean))).sort(),
    [users]
  );

  const filtered = useMemo(
    () =>
      users
        .filter((user) => {
          const searchable = `${user.fullName} ${user.username} ${user.email}`.toLowerCase();
          return (
            searchable.includes(query.toLowerCase()) &&
            (status === "All" || user.status === status) &&
            (role === "All" || user.role === role) &&
            (city === "All" || user.city === city)
          );
        })
        .sort((a, b) =>
          sort === "Oldest"
            ? a.joinedAt.localeCompare(b.joinedAt)
            : sort === "Highest Rated"
              ? (b.rating ?? 0) - (a.rating ?? 0)
              : sort === "Most Swaps"
                ? b.completedSwaps - a.completedSwaps
                : sort === "Most Reports"
                  ? b.reports - a.reports
                  : b.joinedAt.localeCompare(a.joinedAt)
        ),
    [users, query, status, role, city, sort]
  );

  const perPage = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => setPage(1), [query, status, role, city, sort]);

  const applyAction = async (action: string, ids: (string | number)[]) => {
    try {
      setLoading(true);
      if (action === "Delete") {
        await Promise.all(ids.map((id) => api.adminDeleteUser(id)));
        setUsers((cur) => cur.filter((u) => !ids.includes(u.id)));
      } else {
        const targetStatus =
          action === "Activate" ? "Active" : action === "Suspend" ? "Suspended" : "Banned";
        await Promise.all(ids.map((id) => api.adminUpdateUser(id, { status: targetStatus })));
        setUsers((cur) =>
          cur.map((u) => (ids.includes(u.id) ? { ...u, status: targetStatus } : u))
        );
      }
      setSelected([]);
      setDrawer(null);
      setConfirm(null);
      notify(`${ids.length} user${ids.length === 1 ? "" : "s"} updated.`);
    } catch {
      notify("Error updating users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string | number) =>
    setSelected((cur) =>
      cur.includes(id) ? cur.filter((i) => i !== id) : [...cur, id]
    );

  const navItems: { key: AdminTab; icon: React.ReactNode; label: string }[] = [
    { key: "dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { key: "users", icon: <Users size={18} />, label: "User Management" },
    { key: "courses", icon: <BookOpen size={18} />, label: "Course Moderation" },
    { key: "database", icon: <Database size={18} />, label: "Database Tables" },
    { key: "certificates", icon: <Award size={18} />, label: "Certificates" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-ink">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 z-40 w-64 bg-ink p-5 text-white transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-extrabold">
            <i className="grid h-9 w-9 place-items-center rounded-xl bg-violet text-white text-sm">S</i>
            SkillSwap
          </span>
          <button className="lg:hidden" onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>
        <p className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">
          Admin Workspace
        </p>
        <nav className="mt-2 space-y-0.5">
          {navItems.map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => { setAdminTab(key); setMenuOpen(false); }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === key
                  ? "bg-white text-ink"
                  : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>
        <button
          onClick={() => { api.logout(); nav("/login"); }}
          className="absolute bottom-6 left-5 flex items-center gap-2 px-3 text-sm font-bold text-white/60 hover:text-white"
        >
          Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="min-h-screen lg:ml-64">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8 bg-white border-b">
          <button className="rounded-xl bg-[#f7f5f2] p-2 lg:hidden" onClick={() => setMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2 text-sm font-bold text-ink/50">
            <span>Admin workspace</span>
            <ChevronRight size={14} />
            <span className="text-ink capitalize">{adminTab}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="rounded-xl bg-[#f7f5f2] p-2 text-ink/60 hover:bg-ink/10 transition"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
            <Avatar name="Admin" />
          </div>
        </header>

        <section className="mx-auto max-w-[1600px] px-5 pb-12 sm:px-8 pt-6">
          {/* ── Dashboard ─────────────────────────────────────────────── */}
          {adminTab === "dashboard" && (
            <DashboardOverview users={users} loading={loading} />
          )}

          {/* ── User Management ───────────────────────────────────────── */}
          {adminTab === "users" && (
            <>
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="eyebrow">Admin workspace / members</p>
                  <h1 className="mt-2 font-display text-4xl sm:text-5xl">User Management</h1>
                  <p className="mt-2 text-sm text-ink/55">
                    Review, support, and moderate the people who make SkillSwap work.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/admin/import">
                    <Button className="bg-white text-ink ring-1 ring-ink/10 hover:bg-violet hover:text-white">
                      <FileSpreadsheet size={16} /> Import users
                    </Button>
                  </Link>
                  <Button
                    onClick={() => notify("Admin invitation flow coming soon.")}
                    className="bg-ink text-white hover:bg-violet"
                  >
                    <Plus size={16} /> Add admin
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <SkillApprovalQueue />
              </div>

              {/* Filters bar */}
              <div className="rounded-3xl border bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[1fr_repeat(4,auto)]">
                  <label className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-ink/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full rounded-xl bg-[#f7f5f2] py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-transparent focus:ring-violet"
                      placeholder="Search name, username, or email"
                    />
                  </label>
                  <Select value={status} onChange={setStatus} options={["All", ...statuses]} label="Status" />
                  <Select value={role} onChange={setRole} options={["All", "User", "Admin"]} label="Role" />
                  <Select value={city} onChange={setCity} options={["All", ...cities]} label="City" />
                  <Select
                    value={sort}
                    onChange={setSort}
                    options={["Newest", "Oldest", "Highest Rated", "Most Swaps", "Most Reports"]}
                    label="Sort"
                  />
                </div>
              </div>

              {/* Bulk action bar */}
              {selected.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-violet px-4 py-3 text-sm text-white">
                  <span className="font-bold">{selected.length} selected</span>
                  {["Activate", "Suspend"].map((a) => (
                    <button
                      key={a}
                      onClick={() => applyAction(a, selected)}
                      className="rounded-lg bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
                    >
                      {a}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirm({ action: "Delete", users: selected })}
                    className="rounded-lg bg-rose-500 px-3 py-1.5 font-bold"
                  >
                    Delete
                  </button>
                  <button onClick={() => setSelected([])} className="ml-auto">
                    <X size={17} />
                  </button>
                </div>
              )}

              {/* Users table */}
              <section className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm">
                <div className="flex items-center justify-between p-5">
                  <div>
                    <h2 className="font-display text-2xl">Registered users</h2>
                    <p className="mt-1 text-xs text-ink/50">{filtered.length} matching users</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {filtered.length > 0 && (
                      <button
                        onClick={() => setSelected(filtered.map((u) => u.id))}
                        className="rounded-lg bg-violet/10 px-3 py-2 text-xs font-extrabold text-violet hover:bg-violet hover:text-white"
                      >
                        Select all {filtered.length}
                      </button>
                    )}
                    <button
                      onClick={fetchUsers}
                      className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-ink/40 hover:text-ink"
                    >
                      <Filter size={14} /> Live filters
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left">
                    <thead className="border-y bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
                      <tr>
                        <th className="p-4">
                          <input
                            aria-label="Select all visible"
                            type="checkbox"
                            checked={visible.length > 0 && visible.every((u) => selected.includes(u.id))}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? Array.from(new Set([...selected, ...visible.map((u) => u.id)]))
                                  : selected.filter((id) => !visible.some((u) => u.id === id))
                              )
                            }
                            className="accent-violet"
                          />
                        </th>
                        {["User", "Email", "City", "Skills", "Role", "Status", "Rating", "Swaps", "Joined", "Actions"].map(
                          (title) => (
                            <th key={title} className="whitespace-nowrap p-4 font-bold">{title}</th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 11 }).map((__, j) => (
                              <td key={j} className="p-4">
                                <i className="block h-5 animate-pulse rounded bg-ink/5" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : visible.length ? (
                        visible.map((user) => (
                          <tr key={user.id} className="group transition hover:bg-violet/[.025]">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={selected.includes(user.id)}
                                onChange={() => toggle(user.id)}
                                className="accent-violet"
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar name={user.fullName} />
                                <div>
                                  <p className="whitespace-nowrap text-sm font-extrabold">{user.fullName}</p>
                                  <p className="text-xs text-ink/50">@{user.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-sm text-ink/60 max-w-[200px] truncate">{user.email}</td>
                            <td className="p-4 text-sm font-medium">{user.city || "—"}</td>
                            <td className="p-4 text-sm">
                              {user.teachSkills.length + user.learnSkills.length}
                            </td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "Admin"
                                    ? "bg-violet/10 text-violet"
                                    : "bg-ink/5 text-ink/60"
                                  }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <UserStatusBadge status={user.status} />
                            </td>
                            <td className="p-4 text-sm font-bold">
                              {user.rating ? `★ ${Number(user.rating).toFixed(1)}` : "—"}
                            </td>
                            <td className="p-4 text-sm">{user.completedSwaps}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-ink/55">
                              {formatDate(user.joinedAt)}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <button
                                  title="View user"
                                  onClick={() => setDrawer(user)}
                                  className="rounded-lg p-2 text-ink/45 hover:bg-violet/10 hover:text-violet"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  title="Edit user"
                                  onClick={() => setDrawer(user)}
                                  className="rounded-lg p-2 text-ink/45 hover:bg-violet/10 hover:text-violet"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  title={user.status === "Active" ? "Suspend user" : "Activate user"}
                                  onClick={() =>
                                    setConfirm({
                                      action: user.status === "Active" ? "Suspend" : "Activate",
                                      users: [user.id],
                                    })
                                  }
                                  className="rounded-lg p-2 text-ink/45 hover:bg-violet/10 hover:text-violet"
                                >
                                  <MoreHorizontal size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={11} className="p-16 text-center">
                            <Users className="mx-auto text-ink/20" size={34} />
                            <p className="mt-3 font-bold">No users found</p>
                            <p className="mt-1 text-sm text-ink/50">Try changing your search or filters.</p>
                            <button
                              onClick={() => { setQuery(""); setStatus("All"); setRole("All"); setCity("All"); }}
                              className="mt-4 text-sm font-bold text-violet"
                            >
                              Clear filters
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t p-4 text-sm">
                  <p className="text-ink/55">
                    Showing {filtered.length ? (page - 1) * perPage + 1 : 0}–
                    {Math.min(page * perPage, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded-lg border p-2 disabled:opacity-40 hover:bg-ink/5"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-2 text-xs font-bold">Page {page} of {pages}</span>
                    <button
                      disabled={page === pages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-lg border p-2 disabled:opacity-40 hover:bg-ink/5"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ── Database Tables ───────────────────────────────────────── */}
          {adminTab === "database" && (
            <div>
              <div className="mb-8">
                <p className="eyebrow">Admin workspace / database</p>
                <h1 className="mt-2 font-display text-4xl sm:text-5xl">Database Browser</h1>
                <p className="mt-2 text-sm text-ink/55">
                  Browse all {ADMIN_TABLES.length} database tables. Data is fetched live from the server.
                </p>
              </div>
              <DatabaseTableViewer />
            </div>
          )}

          {/* ── Course Moderation ───────────────────────────────────────── */}
          {adminTab === "courses" && (
            <div>
              <AdminCourseModeration />
            </div>
          )}

          {/* ── Certificates ──────────────────────────────────────────── */}
          {adminTab === "certificates" && (
            <div>
              <CertificateManagement notify={notify} />
            </div>
          )}
        </section>
      </main>

      {/* Drawers & Modals */}
      {drawer && (
        <UserDrawer
          user={drawer}
          onClose={() => setDrawer(null)}
          onAction={(action) => setConfirm({ action, users: [drawer.id] })}
        />
      )}
      {confirm && (
        <Confirm
          action={confirm.action}
          count={confirm.users.length}
          onClose={() => setConfirm(null)}
          onConfirm={() => applyAction(confirm.action, confirm.users)}
        />
      )}

      {/* Toast */}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl flex items-center gap-2"
        >
          <Check className="text-emerald-400" size={16} />
          {notice}
        </div>
      )}
    </div>
  );
}
