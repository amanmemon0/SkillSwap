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
  const [adminTab, setAdminTab] = useState<'users' | 'certificates'>('users');
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
          onClick={() => setAdminTab('users')}
          className={`mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${adminTab === 'users' ? 'bg-white text-ink' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
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
                                    user.status === "Active"
                                      ? "Suspend"
                                      : "Activate",
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
          ) : (
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
          )}
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
          <Button
            onClick={() => onAction("Activate")}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <UserCheck size={16} />
            Activate
          </Button>
          <Button
            onClick={() => onAction("Suspend")}
            className="bg-amber-500 text-ink hover:bg-amber-400"
          >
            <ShieldAlert size={16} />
            Suspend
          </Button>
          <Button
            onClick={() => onAction("Ban")}
            className="bg-rose-600 text-white hover:bg-rose-700"
          >
            <Ban size={16} />
            Ban
          </Button>
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
