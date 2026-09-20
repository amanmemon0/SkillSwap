import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Mail,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserCheck,
  Users,
  X,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  Megaphone,
  Settings,
  AlertTriangle,
  TrendingUp,
  Send,
  Tag,
  Sliders,
  BarChart3,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, Button } from "../components/ui/Primitives";
import { api } from "../utils/api";
import { SkillApprovalQueue } from "../features/skill-management/SkillManagement";
import { useLearningStore } from "../data/learningMockData";
import { StatusBadge } from "../components/ui/StatusBadge";

type Status = "Active" | "Pending" | "Suspended" | "Banned";
type Role = "User" | "Admin";
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
  availability: string;
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
const statuses: Status[] = ["Active", "Pending", "Suspended", "Banned"];
const badge: Record<Status, string> = {
  Active: "bg-emerald-100 text-emerald-800",
  Pending: "bg-amber-100 text-amber-800",
  Suspended: "bg-orange-100 text-orange-800",
  Banned: "bg-rose-100 text-rose-800",
};
const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));

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
  const [confirm, setConfirm] = useState<{
    action: string;
    users: (string | number)[];
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<'users' | 'certificates' | 'dashboard' | 'reports' | 'broadcast' | 'settings'>('dashboard');
  const store = useLearningStore();

  useEffect(() => {
    const fetchUsers = async () => {
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
    };
    fetchUsers();
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(users.map((user) => user.city))).sort(),
    [users],
  );
  const filtered = useMemo(
    () =>
      users
        .filter((user) => {
          const searchable =
            `${user.fullName} ${user.username} ${user.email}`.toLowerCase();
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
              ? b.rating - a.rating
              : sort === "Most Swaps"
                ? b.completedSwaps - a.completedSwaps
                : sort === "Most Reports"
                  ? b.reports - a.reports
                  : b.joinedAt.localeCompare(a.joinedAt),
        ),
    [users, query, status, role, city, sort],
  );
  const perPage = 5;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  useEffect(() => setPage(1), [query, status, role, city, sort]);
  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2500);
  };
  const applyAction = async (action: string, ids: (string | number)[]) => {
    try {
      setLoading(true);
      if (action === "Delete") {
        await Promise.all(ids.map((id) => api.adminDeleteUser(id)));
        setUsers((current) => current.filter((user) => !ids.includes(user.id)));
      } else {
        const targetStatus =
          action === "Activate"
            ? "Active"
            : action === "Suspend"
              ? "Suspended"
              : "Banned";
        await Promise.all(ids.map((id) => api.adminUpdateUser(id, { status: targetStatus })));
        setUsers((current) =>
          current.map((user) =>
            ids.includes(user.id) ? { ...user, status: targetStatus } : user,
          ),
        );
      }
      setSelected([]);
      setDrawer(null);
      setConfirm(null);
      notify(`${ids.length} user${ids.length === 1 ? "" : "s"} updated.`);
    } catch (err: any) {
      console.error("Failed to apply admin action:", err);
      notify("Error updating users in the database.");
    } finally {
      setLoading(false);
    }
  };
  const toggle = (id: string | number) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  return (
    <div className="min-h-screen bg-[#f7f5f2] text-ink">
      <aside
        className={`fixed inset-y-0 z-40 w-64 bg-ink p-5 text-white transition-transform lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-extrabold">
            <i className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-ink">
              S
            </i>
            SkillSwap
          </span>
          <button className="lg:hidden" onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>
        <p className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-white/40">
          Workspace
        </p>
        <button
          onClick={() => setAdminTab('dashboard')}
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'dashboard' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <LayoutDashboard size={18} />
          Dashboard
        </button>
        <button
          onClick={() => setAdminTab('users')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'users' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Users size={18} />
          User Management
        </button>
        <button
          onClick={() => setAdminTab('certificates')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'certificates' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Award size={18} />
          Certificates
          {store.certificateRequests.filter(r => r.adminApproval === 'pending' && r.tutorApproval === 'approved').length > 0 && (
            <span className="ml-auto rounded-full bg-violet px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              {store.certificateRequests.filter(r => r.adminApproval === 'pending' && r.tutorApproval === 'approved').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('reports')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'reports' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <AlertTriangle size={18} />
          Reports
          {users.filter(u => u.reports > 0).length > 0 && (
            <span className="ml-auto rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              {users.filter(u => u.reports > 0).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminTab('broadcast')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'broadcast' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Megaphone size={18} />
          Broadcast
        </button>
        <button
          onClick={() => setAdminTab('settings')}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'settings' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
        >
          <Settings size={18} />
          Settings
        </button>
        <button
          onClick={() => {
            api.logout();
            nav("/login");
          }}
          className="mt-auto flex absolute bottom-6 items-center gap-3 px-3 text-sm font-bold text-white/60 hover:text-white"
        >
          Sign out
        </button>
      </aside>
      <main className="min-h-screen lg:ml-64">
        <header className="flex h-20 items-center justify-between px-5 sm:px-8">
          <button
            className="rounded-xl bg-white p-2 lg:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold text-ink/55 sm:block">
              Admin workspace
            </span>
            <Avatar name="Olivia Bennett" />
          </div>
        </header>
        <section className="mx-auto max-w-[1600px] px-5 pb-10 sm:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Admin workspace / members</p>
              <h1 className="mt-2 font-display text-4xl sm:text-5xl">
                User Management
              </h1>
              <p className="mt-2 text-sm text-ink/55">
                Review, support, and moderate the people who make SkillSwap
                work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/import">
                <Button className="bg-white text-ink ring-1 ring-ink/10 hover:bg-mint">
                  <FileSpreadsheet size={16} />
                  Import users
                </Button>
              </Link>
              <Button
                onClick={() => notify("Admin invitation flow opened.")}
                className="bg-ink text-white hover:bg-violet"
              >
                <Plus size={16} />
                Add admin
              </Button>
            </div>
          </div>
          <div className="mb-6">
            <SkillApprovalQueue />
          </div>
          {adminTab === 'users' ? (
          <>
          <div className="rounded-3xl border bg-white p-4 shadow-sm">
            <div className="grid gap-3 xl:grid-cols-[1fr_repeat(4,auto)]">
              <label className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-ink/40"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full rounded-xl bg-[#f7f5f2] py-2.5 pl-9 pr-3 text-sm outline-none ring-1 ring-transparent focus:ring-violet"
                  placeholder="Search name, username, or email"
                />
              </label>
              <Select
                value={status}
                onChange={setStatus}
                options={["All", ...statuses]}
                label="Status"
              />
              <Select
                value={role}
                onChange={setRole}
                options={["All", "User", "Admin"]}
                label="Role"
              />
              <Select
                value={city}
                onChange={setCity}
                options={["All", ...cities]}
                label="City"
              />
              <Select
                value={sort}
                onChange={setSort}
                options={[
                  "Newest",
                  "Oldest",
                  "Highest Rated",
                  "Most Swaps",
                  "Most Reports",
                ]}
                label="Sort"
              />
            </div>
          </div>
          {selected.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-violet px-4 py-3 text-sm text-white">
              <span className="font-bold">{selected.length} selected</span>
              <button
                onClick={() => applyAction("Activate", selected)}
                className="rounded-lg bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
              >
                Activate
              </button>
              <button
                onClick={() => applyAction("Suspend", selected)}
                className="rounded-lg bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
              >
                Suspend
              </button>
              <button
                onClick={() =>
                  notify("Notification composer opened for selected users.")
                }
                className="rounded-lg bg-white/15 px-3 py-1.5 font-bold hover:bg-white/25"
              >
                Send notification
              </button>
              <button
                onClick={() =>
                  setConfirm({ action: "Delete", users: selected })
                }
                className="rounded-lg bg-rose-500 px-3 py-1.5 font-bold"
              >
                Delete
              </button>
              <button onClick={() => setSelected([])} className="ml-auto">
                <X size={17} />
              </button>
            </div>
          )}
          <section className="mt-5 overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="flex items-center justify-between p-5">
              <div>
                <h2 className="font-display text-2xl">Registered users</h2>
                <p className="mt-1 text-xs text-ink/50">
                  {filtered.length} matching users
                </p>
              </div>
              <div className="flex items-center gap-3">
                {filtered.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelected(filtered.map((user) => user.id))}
                    className="rounded-lg bg-violet/10 px-3 py-2 text-xs font-extrabold text-violet hover:bg-violet hover:text-white"
                  >
                    Select all {filtered.length} matching
                  </button>
                )}
                <span className="hidden items-center gap-2 text-xs font-bold text-ink/45 sm:flex">
                  <Filter size={14} />
                  Filters update instantly
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left">
                <thead className="border-y bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
                  <tr>
                    <th className="p-4">
                      <input
                        aria-label="Select all users"
                        type="checkbox"
                        checked={
                          visible.length > 0 &&
                          visible.every((user) => selected.includes(user.id))
                        }
                        onChange={(event) =>
                          setSelected(
                            event.target.checked
                              ? Array.from(
                                  new Set([
                                    ...selected,
                                    ...visible.map((user) => user.id),
                                  ]),
                                )
                              : selected.filter(
                                  (id) =>
                                    !visible.some((user) => user.id === id),
                                ),
                          )
                        }
                        className="accent-violet"
                      />
                    </th>
                    {[
                      "User",
                      "Email",
                      "City",
                      "Skills",
                      "Role",
                      "Status",
                      "Rating",
                      "Swaps",
                      "Joined",
                      "Actions",
                    ].map((title) => (
                      <th
                        key={title}
                        className="whitespace-nowrap p-4 font-bold"
                      >
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 11 }).map((__, cell) => (
                          <td key={cell} className="p-4">
                            <i className="block h-5 animate-pulse rounded bg-ink/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : visible.length ? (
                    visible.map((user) => (
                      <tr
                        key={user.id}
                        className="group transition hover:bg-violet/[.025]"
                      >
                        <td className="p-4">
                          <input
                            aria-label={`Select ${user.fullName}`}
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
                              <p className="whitespace-nowrap text-sm font-extrabold">
                                {user.fullName}
                              </p>
                              <p className="text-xs text-ink/50">
                                @{user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-ink/60">
                          {user.email}
                        </td>
                        <td className="p-4 text-sm font-medium">{user.city}</td>
                        <td className="p-4 text-sm">
                          {user.teachSkills.length + user.learnSkills.length}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.role === "Admin" ? "bg-violet/10 text-violet" : "bg-ink/5 text-ink/60"}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <UserStatusBadge status={user.status} />
                        </td>
                        <td className="p-4 text-sm font-bold">
                          ★ {user.rating.toFixed(1)}
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
                              title="More actions"
                              onClick={() =>
                                setConfirm({
                                  action:
                                    user.status === "Banned"
                                      ? "Activate"
                                      : "Ban",
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
                        <p className="mt-1 text-sm text-ink/50">
                          Try changing your search or filters.
                        </p>
                        <button
                          onClick={() => {
                            setQuery("");
                            setStatus("All");
                            setRole("All");
                            setCity("All");
                          }}
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
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <p className="text-ink/55">
                Showing {filtered.length ? (page - 1) * perPage + 1 : 0}–
                {Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((current) => current - 1)}
                  className="rounded-lg border p-2 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 text-xs font-bold">
                  Page {page} of {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border p-2 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          </>
          ) : adminTab === 'certificates' ? (
          /* ═══════════════ Certificate Management ═══════════════ */
          <section className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Admin workspace / certificates</p>
                  <h2 className="mt-1 font-display text-2xl">Certificate Requests</h2>
                  <p className="mt-1 text-xs text-ink/50">
                    Review and approve certificate requests from across SkillSwap
                  </p>
                </div>
                <span className="text-sm font-bold text-ink/40">
                  {store.certificateRequests.length} total requests
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b bg-[#fcfbfa] text-[10px] uppercase tracking-wider text-ink/45">
                  <tr>
                    {['Learner', 'Course', 'Teacher', 'Exam Score', 'Tutor Approval', 'Admin Status', 'Actions'].map(title => (
                      <th key={title} className="whitespace-nowrap p-4 font-bold">{title}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {store.certificateRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center">
                        <Award className="mx-auto text-ink/15" size={32} />
                        <p className="mt-2 font-bold text-ink/40">No certificate requests</p>
                      </td>
                    </tr>
                  ) : (
                    store.certificateRequests.map(req => (
                      <tr key={req.id} className="group transition hover:bg-violet/[.02]">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={req.learnerName} />
                            <span className="text-sm font-bold">{req.learnerName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium">{req.courseName}</td>
                        <td className="p-4 text-sm text-ink/60">{req.teacherName}</td>
                        <td className="p-4 text-sm font-bold">{req.examScore}%</td>
                        <td className="p-4">
                          <StatusBadge status={req.tutorApproval} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={req.adminApproval} />
                        </td>
                        <td className="p-4">
                          {req.tutorApproval === 'approved' && req.adminApproval === 'pending' ? (
                            <div className="flex gap-1">
                              <button
                                onClick={() => { store.approveCertificateAdmin(req.id); setNotice(`Certificate approved for ${req.learnerName}`); }}
                                title="Approve"
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 transition"
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                onClick={() => { store.rejectCertificateAdmin(req.id); setNotice(`Certificate rejected for ${req.learnerName}`); }}
                                title="Reject"
                                className="rounded-lg bg-rose-100 p-2 text-rose-700 hover:bg-rose-200 transition"
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ) : req.status === 'generated' ? (
                            <span className="text-xs font-bold text-emerald-600">✓ Generated</span>
                          ) : req.adminApproval === 'approved' ? (
                            <span className="text-xs font-bold text-blue-600">Approved</span>
                          ) : req.tutorApproval === 'pending' ? (
                            <span className="flex items-center gap-1 text-xs text-ink/40"><Clock size={12} /> Awaiting tutor</span>
                          ) : req.adminApproval === 'rejected' ? (
                            <span className="text-xs font-bold text-rose-600">Rejected</span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
          ) : adminTab === 'dashboard' ? (
          <DashboardTab users={users} certificateRequests={store.certificateRequests} />
          ) : adminTab === 'reports' ? (
          <ReportsTab users={users} onView={setDrawer} onAction={(action, user) => setConfirm({ action, users: [user.id] })} />
          ) : adminTab === 'broadcast' ? (
          <BroadcastTab />
          ) : adminTab === 'settings' ? (
          <SettingsTab />
          ) : null}
        </section>
      </main>
      {drawer && (
        <UserDrawer
          user={drawer}
          onClose={() => setDrawer(null)}
          onAction={(action) => setConfirm({ action, users: [drawer.id] })}
        />
      )}{" "}
      {confirm && (
        <Confirm
          action={confirm.action}
          count={confirm.users.length}
          onClose={() => setConfirm(null)}
          onConfirm={() => applyAction(confirm.action, confirm.users)}
        />
      )}{" "}
      {notice && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white shadow-xl"
        >
          <Check className="mr-2 inline text-mint" size={16} />
          {notice}
        </div>
      )}
    </div>
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-xl bg-[#f7f5f2] px-3 py-2.5 pr-8 text-sm font-bold text-ink/65 outline-none ring-1 ring-transparent focus:ring-violet"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronRight
        size={14}
        className="pointer-events-none absolute right-2 top-3 rotate-90 text-ink/40"
      />
    </label>
  );
}
function UserStatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge[status]}`}
    >
      {status}
    </span>
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
  const stat = [
    [
      "Total requests",
      user.completedSwaps + user.pendingSwaps + user.cancelledSwaps,
    ],
    ["Completed", user.completedSwaps],
    ["Cancelled", user.cancelledSwaps],
    ["Pending", user.pendingSwaps],
    ["Average rating", `★ ${user.rating}`],
    ["Total reviews", user.totalReviews],
    ["Reports", user.reports],
  ];
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        onClick={(event) => event.stopPropagation()}
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
            <Detail label="Registered" value={formatDate(user.joinedAt)} />
            <Detail label="Last login" value={formatDate(user.lastLogin)} />
          </div>
        </section>
        <section className="mt-4 rounded-3xl bg-white p-5">
          <p className="eyebrow">Profile information</p>
          <p className="mt-3 text-sm leading-6 text-ink/65">{user.bio}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Teaches" value={user.teachSkills.join(", ")} />
            <Detail
              label="Wants to learn"
              value={user.learnSkills.join(", ")}
            />
            <Detail label="Skill level" value={user.skillLevel} />
            <Detail label="Learning mode" value={user.learningMode} />
            <Detail label="Availability" value={user.availability} />
          </div>
        </section>
        <section className="mt-4">
          <p className="eyebrow">Statistics</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat.map(([label, value]) => (
              <div key={label as string} className="rounded-2xl bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink/45">
                  {label}
                </p>
                <p className="mt-2 text-xl font-extrabold">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="mt-4 rounded-3xl bg-white p-5">
          <p className="eyebrow">Recent activity</p>
          <ol className="mt-4 space-y-3 border-l border-ink/10 pl-4 text-sm">
            <li>
              <b>Registered account</b>
              <span className="block text-ink/50">
                {formatDate(user.joinedAt)}
              </span>
            </li>
            <li>
              <b>Updated their profile</b>
              <span className="block text-ink/50">
                Added skills and availability
              </span>
            </li>
            <li>
              <b>Sent a swap request</b>
              <span className="block text-ink/50">
                Recent community activity
              </span>
            </li>
          </ol>
        </section>
        <div className="mt-6 flex flex-wrap gap-2">
          {/* Single Ban ↔ Activate toggle */}
          {user.status === "Banned" ? (
            <Button
              onClick={() => onAction("Activate")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <UserCheck size={16} />
              Activate
            </Button>
          ) : (
            <Button
              onClick={() => onAction("Ban")}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              <Ban size={16} />
              Ban
            </Button>
          )}
          <Button
            onClick={() => onAction("Delete")}
            className="bg-white text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </aside>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-ink/45">{label}</p>
      <p className="mt-1 text-sm font-bold text-ink/70">{value}</p>
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
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${destructive ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}
        >
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
          <Button
            onClick={onClose}
            className="bg-white text-ink ring-1 ring-ink/10 hover:bg-ink/5"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className={
              destructive
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-ink text-white hover:bg-violet"
            }
          >
            {action}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NEW ADMIN TABS — Dashboard, Reports, Broadcast, Settings
   All new code; nothing above was changed.
   ═══════════════════════════════════════════════════════════ */

// ── Types ────────────────────────────────────────────────────
type AdminUser = {
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
  availability: string;
  role: 'User' | 'Admin';
  status: 'Active' | 'Pending' | 'Suspended' | 'Banned';
  rating: number;
  totalReviews: number;
  completedSwaps: number;
  pendingSwaps: number;
  cancelledSwaps: number;
  reports: number;
  joinedAt: string;
  lastLogin: string;
};

// ── 1. Dashboard Tab ─────────────────────────────────────────
function DashboardTab({
  users,
  certificateRequests,
}: {
  users: AdminUser[];
  certificateRequests: { adminApproval: string; tutorApproval: string }[];
}) {
  const active = users.filter(u => u.status === 'Active').length;
  const pending = users.filter(u => u.status === 'Pending').length;
  const banned = users.filter(u => u.status === 'Banned').length;
  const suspended = users.filter(u => u.status === 'Suspended').length;
  const pendingCerts = certificateRequests.filter(
    r => r.adminApproval === 'pending' && r.tutorApproval === 'approved'
  ).length;
  const totalCerts = certificateRequests.filter(r => r.adminApproval === 'approved').length;

  // Top cities
  const cityMap: Record<string, number> = {};
  users.forEach(u => { cityMap[u.city] = (cityMap[u.city] || 0) + 1; });
  const cities = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxCity = cities[0]?.[1] || 1;

  // Top teach skills
  const skillMap: Record<string, number> = {};
  users.forEach(u => u.teachSkills.forEach(s => { skillMap[s] = (skillMap[s] || 0) + 1; }));
  const topSkills = Object.entries(skillMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Recent activity feed (derived from users sorted by joinedAt)
  const recentActivity = [...users]
    .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
    .slice(0, 6)
    .map(u => ({
      label: u.fullName,
      detail: u.status === 'Pending' ? 'Registered — awaiting approval' : `Joined as ${u.role.toLowerCase()}`,
      date: u.joinedAt,
      color: u.status === 'Pending' ? 'bg-amber-400' : u.role === 'Admin' ? 'bg-violet-500' : 'bg-emerald-400',
    }));

  const statCards = [
    { label: 'Total Users', value: users.length, icon: <Users size={20} />, color: 'bg-violet/10 text-violet' },
    { label: 'Active', value: active, icon: <UserCheck size={20} />, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Pending', value: pending, icon: <Clock size={20} />, color: 'bg-amber-100 text-amber-700' },
    { label: 'Suspended / Banned', value: suspended + banned, icon: <Ban size={20} />, color: 'bg-rose-100 text-rose-700' },
    { label: 'Certificates Issued', value: totalCerts, icon: <Award size={20} />, color: 'bg-blue-100 text-blue-700' },
    { label: 'Certs Awaiting Approval', value: pendingCerts, icon: <AlertTriangle size={20} />, color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div>
        <p className="eyebrow mb-3">Admin workspace / dashboard</p>
        <h1 className="font-display text-4xl sm:text-5xl mb-6">Overview</h1>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(card => (
            <div key={card.label} className="rounded-3xl bg-white border p-5 shadow-sm flex items-center gap-4">
              <div className={`grid h-11 w-11 place-items-center rounded-2xl ${card.color}`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink/45">{card.label}</p>
                <p className="mt-0.5 font-display text-3xl">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: cities + skills */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top cities */}
        <div className="rounded-3xl bg-white border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-violet" />
            <h2 className="font-display text-xl">Users by City</h2>
          </div>
          <div className="space-y-3">
            {cities.map(([city, count]) => (
              <div key={city}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold">{city}</span>
                  <span className="text-xs font-bold text-ink/50">{count} user{count !== 1 ? 's' : ''}</span>
                </div>
                <div className="h-2 rounded-full bg-ink/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet transition-all duration-700"
                    style={{ width: `${(count / maxCity) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {cities.length === 0 && <p className="text-sm text-ink/40 py-4 text-center">No user data yet.</p>}
          </div>
        </div>

        {/* Top skills */}
        <div className="rounded-3xl bg-white border p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-violet" />
            <h2 className="font-display text-xl">Top Taught Skills</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {topSkills.map(([skill, count]) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-violet/8 px-3 py-1.5 text-xs font-bold text-violet"
              >
                {skill}
                <span className="rounded-full bg-violet text-white px-1.5 py-0.5 text-[10px] font-extrabold">{count}</span>
              </span>
            ))}
            {topSkills.length === 0 && <p className="text-sm text-ink/40 py-4 w-full text-center">No skill data yet.</p>}
          </div>
          {/* Role split */}
          <div className="mt-5 pt-4 border-t flex gap-4">
            <div className="flex-1 rounded-2xl bg-violet/5 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Admins</p>
              <p className="mt-1 font-display text-2xl">{users.filter(u => u.role === 'Admin').length}</p>
            </div>
            <div className="flex-1 rounded-2xl bg-emerald-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Members</p>
              <p className="mt-1 font-display text-2xl">{users.filter(u => u.role === 'User').length}</p>
            </div>
            <div className="flex-1 rounded-2xl bg-amber-50 p-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40">Avg Rating</p>
              <p className="mt-1 font-display text-2xl">
                {users.length > 0
                  ? (users.reduce((s, u) => s + u.rating, 0) / users.length).toFixed(1)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-3xl bg-white border p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-violet" />
          <h2 className="font-display text-xl">Recent Activity</h2>
        </div>
        <ol className="space-y-3 border-l-2 border-ink/8 pl-5">
          {recentActivity.map((item, i) => (
            <li key={i} className="relative">
              <span className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full ${item.color} ring-2 ring-white`} />
              <p className="text-sm font-bold">{item.label}</p>
              <p className="text-xs text-ink/50">{item.detail} · {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(item.date))}</p>
            </li>
          ))}
          {recentActivity.length === 0 && <p className="text-sm text-ink/40">No activity yet.</p>}
        </ol>
      </div>
    </div>
  );
}

// ── 2. Reports Tab ───────────────────────────────────────────
type ReportEntry = {
  id: string;
  reportedUserUsername: string;
  reportedBy: string;
  reportedByUsername: string;
  category: string;
  reason: string;
  date: string;
};

const REPORT_CATEGORIES: Record<string, string> = {
  harassment: 'Harassment / Bullying',
  spam: 'Spam / Fake Profile',
  inappropriate: 'Inappropriate Content',
  fraud: 'Fraud / Scam',
  noshow: 'No-Show / Ghosting',
  other: 'Other',
};

const CATEGORY_COLOR: Record<string, string> = {
  harassment: 'bg-rose-100 text-rose-700',
  spam: 'bg-orange-100 text-orange-700',
  inappropriate: 'bg-amber-100 text-amber-700',
  fraud: 'bg-red-100 text-red-800',
  noshow: 'bg-slate-100 text-slate-700',
  other: 'bg-ink/5 text-ink/60',
};

// Mock report entries — replace with real API data when backend is ready
const MOCK_REPORTS: ReportEntry[] = [
  {
    id: 'r1', reportedUserUsername: 'sofiaframes',
    reportedBy: 'John Doe', reportedByUsername: 'johndoe',
    category: 'noshow',
    reason: 'She confirmed the swap session but never showed up. No message, no response afterwards.',
    date: '2026-07-18',
  },
  {
    id: 'r2', reportedUserUsername: 'sofiaframes',
    reportedBy: 'Arjun Rao', reportedByUsername: 'arjun.codes',
    category: 'harassment',
    reason: 'Sent repeated unwanted messages after I declined her swap request.',
    date: '2026-07-15',
  },
  {
    id: 'r3', reportedUserUsername: 'marcusl',
    reportedBy: 'Aisha Patel', reportedByUsername: 'aisha.designs',
    category: 'fraud',
    reason: 'Claimed to teach TypeScript but had no knowledge. Asked me to send money for "course materials" which is against platform rules.',
    date: '2026-07-10',
  },
  {
    id: 'r4', reportedUserUsername: 'marcusl',
    reportedBy: 'Noah Williams', reportedByUsername: 'noahteaches',
    category: 'harassment',
    reason: 'Left a fake 1-star review on my profile after I gave honest feedback. Continued harassing me in DMs.',
    date: '2026-07-08',
  },
  {
    id: 'r5', reportedUserUsername: 'marcusl',
    reportedBy: 'Sofia Chen', reportedByUsername: 'sofiaframes',
    category: 'spam',
    reason: 'Sent copy-paste swap requests to many users without reading their profiles. Clearly a bot or spam account.',
    date: '2026-07-05',
  },
  {
    id: 'r6', reportedUserUsername: 'marcusl',
    reportedBy: 'John Doe', reportedByUsername: 'johndoe',
    category: 'inappropriate',
    reason: 'Used offensive language during our live session. Made the learning environment very uncomfortable.',
    date: '2026-07-03',
  },
];

function ReportsTab({
  users,
  onView,
  onAction,
}: {
  users: AdminUser[];
  onView: (user: AdminUser) => void;
  onAction: (action: string, user: AdminUser) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [dismissedReports, setDismissedReports] = useState<string[]>([]);

  const reported = [...users]
    .filter(u => u.reports > 0)
    .sort((a, b) => b.reports - a.reports);

  const statusColor: Record<string, string> = {
    Active: 'bg-emerald-100 text-emerald-800',
    Pending: 'bg-amber-100 text-amber-800',
    Suspended: 'bg-orange-100 text-orange-800',
    Banned: 'bg-rose-100 text-rose-800',
  };

  const getReports = (username: string) =>
    MOCK_REPORTS.filter(r => r.reportedUserUsername === username && !dismissedReports.includes(r.id));

  const dismissReport = (reportId: string) =>
    setDismissedReports(prev => [...prev, reportId]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Admin workspace / reports</p>
        <h1 className="font-display text-4xl sm:text-5xl">Reports & Moderation</h1>
        <p className="mt-2 text-sm text-ink/55">
          Users flagged by the community. Click a row to see who reported them and why.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Flagged users', value: reported.length, color: 'bg-rose-50 text-rose-700' },
          { label: 'Total reports', value: reported.reduce((s, u) => s + u.reports, 0), color: 'bg-orange-50 text-orange-700' },
          { label: 'Suspended / Banned', value: reported.filter(u => u.status === 'Suspended' || u.status === 'Banned').length, color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl ${s.color} px-4 py-3`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{s.label}</p>
            <p className="mt-1 font-display text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {reported.length === 0 ? (
          <div className="rounded-3xl border bg-white p-14 text-center shadow-sm">
            <CheckCircle2 className="mx-auto text-emerald-300" size={36} />
            <p className="mt-3 font-bold text-ink/50">No reported users — community looks great!</p>
          </div>
        ) : reported.map(user => {
          const userReports = getReports(user.username);
          const isExpanded = expandedId === user.id;

          return (
            <div key={user.id} className="rounded-3xl border bg-white shadow-sm overflow-hidden">
              {/* User row — click to expand */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : user.id)}
                className="w-full text-left"
              >
                <div className={`flex flex-wrap items-center gap-4 p-5 transition ${isExpanded ? 'bg-rose-50/60' : 'hover:bg-ink/[.02]'}`}>
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                    <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-ink/8 text-sm font-extrabold text-ink">
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{user.fullName}</p>
                      <p className="text-xs text-ink/50">@{user.username} · {user.city}</p>
                    </div>
                  </div>
                  {/* Status */}
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor[user.status] ?? ''}`}>
                    {user.status}
                  </span>
                  {/* Report count */}
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-700">
                    <AlertTriangle size={11} />
                    {user.reports} report{user.reports !== 1 ? 's' : ''}
                  </span>
                  {/* Last login */}
                  <span className="text-xs text-ink/40 hidden sm:block">
                    Last seen {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(user.lastLogin))}
                  </span>
                  {/* Chevron */}
                  <ChevronRight
                    size={16}
                    className={`ml-auto text-ink/30 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </button>

              {/* Expanded report detail panel */}
              {isExpanded && (
                <div className="border-t bg-[#fafaf9]">
                  {/* Quick actions */}
                  <div className="flex flex-wrap items-center gap-2 border-b px-5 py-3 bg-white">
                    <span className="text-xs font-bold text-ink/40 mr-1">Quick actions:</span>
                    <button
                      onClick={() => onView(user as any)}
                      className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-bold hover:bg-violet/10 hover:text-violet transition"
                    >
                      <Eye size={13} /> View Full Profile
                    </button>
                    <button
                      onClick={() => onAction(user.status === 'Banned' ? 'Activate' : 'Ban', user)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${user.status === 'Banned' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                    >
                      {user.status === 'Banned' ? <UserCheck size={13} /> : <Ban size={13} />}
                      {user.status === 'Banned' ? 'Activate Account' : 'Ban User'}
                    </button>
                  </div>
                  {/* Individual reports */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink/40">
                      {userReports.length} report{userReports.length !== 1 ? 's' : ''} on file
                    </p>
                    {userReports.length === 0 ? (
                      <p className="text-sm text-ink/40 py-2">All reports have been dismissed.</p>
                    ) : userReports.map(report => (
                      <div key={report.id} className="rounded-2xl border bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <div className="grid h-6 w-6 place-items-center rounded-full bg-violet/10 text-[10px] font-extrabold text-violet">
                                {report.reportedBy.charAt(0)}
                              </div>
                              <span className="text-xs font-bold">{report.reportedBy}</span>
                              <span className="text-xs text-ink/40">@{report.reportedByUsername}</span>
                            </div>
                            <span className="text-ink/20">·</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${CATEGORY_COLOR[report.category] ?? 'bg-ink/5 text-ink/50'}`}>
                              {REPORT_CATEGORIES[report.category] ?? report.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-ink/35">
                              {new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(report.date))}
                            </span>
                            <button
                              onClick={() => dismissReport(report.id)}
                              title="Dismiss this report"
                              className="rounded-lg p-1 text-ink/30 hover:bg-rose-50 hover:text-rose-500 transition"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-ink/70 leading-6">"{report.reason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. Broadcast Tab ─────────────────────────────────────────
type Announcement = {
  id: number;
  title: string;
  message: string;
  target: string;
  type: 'info' | 'warning' | 'alert';
  sentAt: string;
};

function BroadcastTab() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('All Users');
  const [type, setType] = useState<'info' | 'warning' | 'alert'>('info');
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: 1,
      title: 'Platform Maintenance Notice',
      message: 'SkillSwap will undergo scheduled maintenance on Sunday from 2–4 AM IST. Some features may be temporarily unavailable.',
      target: 'All Users',
      type: 'warning',
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      title: 'New Certificate Feature Launched!',
      message: 'You can now earn and share verified skill certificates after completing courses and passing exams. Check your learning dashboard!',
      target: 'Active Users',
      type: 'info',
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const typeConfig = {
    info: { label: 'Info', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
    warning: { label: 'Warning', color: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    alert: { label: 'Alert', color: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  };

  const handleSend = () => {
    if (!title.trim() || !message.trim()) return;
    const newAnnouncement: Announcement = {
      id: Date.now(),
      title: title.trim(),
      message: message.trim(),
      target,
      type,
      sentAt: new Date().toISOString(),
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
    setTitle('');
    setMessage('');
  };

  const timeAgoLocal = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow mb-1">Admin workspace / broadcast</p>
        <h1 className="font-display text-4xl sm:text-5xl">Broadcast Announcements</h1>
        <p className="mt-2 text-sm text-ink/55">Send platform-wide notifications to your users.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Composer */}
        <div className="rounded-3xl bg-white border p-6 shadow-sm space-y-4">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Megaphone size={22} className="text-violet" />
            New Announcement
          </h2>
          <div>
            <label className="block text-xs font-bold text-ink/50 mb-1.5" htmlFor="bc-title">Title</label>
            <input
              id="bc-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Scheduled Maintenance on Sunday"
              className="w-full rounded-xl bg-[#f7f5f2] px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink/50 mb-1.5" htmlFor="bc-msg">Message</label>
            <textarea
              id="bc-msg"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Write your announcement here…"
              rows={4}
              className="w-full resize-none rounded-xl bg-[#f7f5f2] px-4 py-2.5 text-sm outline-none ring-1 ring-transparent focus:ring-violet"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-ink/50 mb-1.5" htmlFor="bc-target">Target Audience</label>
              <select
                id="bc-target"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full appearance-none rounded-xl bg-[#f7f5f2] px-4 py-2.5 text-sm font-bold text-ink/70 outline-none ring-1 ring-transparent focus:ring-violet"
              >
                {['All Users', 'Active Users', 'Pending Users', 'Admins Only'].map(o => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-ink/50 mb-1.5" htmlFor="bc-type">Type</label>
              <select
                id="bc-type"
                value={type}
                onChange={e => setType(e.target.value as 'info' | 'warning' | 'alert')}
                className="w-full appearance-none rounded-xl bg-[#f7f5f2] px-4 py-2.5 text-sm font-bold text-ink/70 outline-none ring-1 ring-transparent focus:ring-violet"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="alert">Alert</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!title.trim() || !message.trim()}
            className="flex items-center gap-2 rounded-xl bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet disabled:opacity-40"
          >
            <Send size={15} />
            Send Announcement
          </button>
        </div>

        {/* Preview */}
        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <h3 className="font-display text-lg mb-3 text-ink/60">Live Preview</h3>
          {title || message ? (
            <div className={`rounded-2xl p-4 ${typeConfig[type].color}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2 w-2 rounded-full ${typeConfig[type].dot}`} />
                <span className="text-xs font-extrabold uppercase tracking-wider">{typeConfig[type].label}</span>
                <span className="ml-auto text-xs opacity-60">To: {target}</span>
              </div>
              <p className="font-bold text-sm mt-1">{title || '(Title)'}</p>
              <p className="text-xs mt-1 opacity-75 leading-5">{message || '(Message)'}</p>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-ink/10 p-6 text-center">
              <Megaphone size={28} className="mx-auto text-ink/20 mb-2" />
              <p className="text-xs text-ink/35">Your announcement preview will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Sent announcements */}
      <div className="rounded-3xl bg-white border p-5 shadow-sm">
        <h2 className="font-display text-2xl mb-4 flex items-center gap-2">
          <Clock size={18} className="text-ink/40" /> Sent Announcements
        </h2>
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="rounded-2xl bg-[#f7f5f2] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full mt-1 flex-shrink-0 ${typeConfig[a.type].dot}`} />
                  <div>
                    <p className="text-sm font-bold">{a.title}</p>
                    <p className="text-xs text-ink/55 mt-0.5 leading-5">{a.message}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${typeConfig[a.type].color}`}>{typeConfig[a.type].label}</span>
                  <p className="text-[11px] text-ink/40 mt-1">{timeAgoLocal(a.sentAt)}</p>
                  <p className="text-[11px] text-ink/40">{a.target}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 4. Settings Tab ──────────────────────────────────────────
const DEFAULT_CATEGORIES = ['Tech', 'Design', 'Languages', 'Photography', 'Music', 'Business', 'Fitness', 'Cooking'];

function SettingsTab() {
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCat, setNewCat] = useState('');
  const [maxSkills, setMaxSkills] = useState(10);
  const [minRating, setMinRating] = useState(3.5);
  const [certPassScore, setCertPassScore] = useState(70);
  const [saved, setSaved] = useState(false);

  const handleAddCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories(prev => [...prev, trimmed]);
    setNewCat('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(prev => prev.filter(c => c !== cat));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="eyebrow mb-1">Admin workspace / settings</p>
        <h1 className="font-display text-4xl sm:text-5xl">Platform Settings</h1>
        <p className="mt-2 text-sm text-ink/55">Configure platform-wide rules and categories.</p>
      </div>

      {/* Skill Categories */}
      <div className="rounded-3xl bg-white border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Tag size={18} className="text-violet" />
          <h2 className="font-display text-2xl">Skill Categories</h2>
        </div>
        <p className="text-sm text-ink/50 mb-4">Manage the categories users can assign to their skills.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <span
              key={cat}
              className="flex items-center gap-1.5 rounded-full bg-violet/8 px-3 py-1.5 text-sm font-bold text-violet"
            >
              {cat}
              <button
                onClick={() => handleRemoveCategory(cat)}
                className="text-violet/50 hover:text-rose-600 transition"
                title={`Remove ${cat}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder="New category name…"
            className="flex-1 rounded-xl bg-[#f7f5f2] px-4 py-2 text-sm outline-none ring-1 ring-transparent focus:ring-violet"
          />
          <button
            onClick={handleAddCategory}
            className="flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-violet transition"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Platform Rules */}
      <div className="rounded-3xl bg-white border p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Sliders size={18} className="text-violet" />
          <h2 className="font-display text-2xl">Platform Rules</h2>
        </div>
        <p className="text-sm text-ink/50 mb-6">Adjust core thresholds and limits.</p>
        <div className="space-y-6">
          {/* Max skills */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-bold">Max skills per user</label>
              <span className="text-sm font-extrabold text-violet">{maxSkills}</span>
            </div>
            <input
              type="range" min={1} max={20} value={maxSkills}
              onChange={e => setMaxSkills(Number(e.target.value))}
              className="w-full accent-violet"
            />
            <p className="text-xs text-ink/40 mt-1">Each user can add up to {maxSkills} teach + learn skills.</p>
          </div>
          {/* Min rating to swap */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-bold">Minimum rating to request swaps</label>
              <span className="text-sm font-extrabold text-violet">{minRating.toFixed(1)} ★</span>
            </div>
            <input
              type="range" min={1} max={5} step={0.1} value={minRating}
              onChange={e => setMinRating(Number(e.target.value))}
              className="w-full accent-violet"
            />
            <p className="text-xs text-ink/40 mt-1">Users below this rating cannot send swap requests.</p>
          </div>
          {/* Certificate passing score */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-sm font-bold">Certificate passing score</label>
              <span className="text-sm font-extrabold text-violet">{certPassScore}%</span>
            </div>
            <input
              type="range" min={50} max={100} value={certPassScore}
              onChange={e => setCertPassScore(Number(e.target.value))}
              className="w-full accent-violet"
            />
            <p className="text-xs text-ink/40 mt-1">Learners must score at least {certPassScore}% to be eligible for a certificate.</p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:bg-violet"
        >
          <Check size={15} />
          Save Settings
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={16} /> Settings saved!
          </span>
        )}
      </div>
    </div>
  );
}
