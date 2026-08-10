import { Check, Clock3, LockKeyhole, Send, ShieldCheck, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { skillManagementApi } from "./api";
import type { SkillCategory, SkillRequest } from "./types";

const statusStyle = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
};

function Message({ children, error = false }: { children: string; error?: boolean }) {
  return <p role="status" className={`rounded-xl px-3 py-2 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{children}</p>;
}

/** User-facing custom-skill request form. A pending request locks new requests. */
export function SkillRequestPanel({ member }: { member: { id: string; name: string; email: string } }) {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [requests, setRequests] = useState<SkillRequest[]>([]);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [nextCategories, nextRequests] = await Promise.all([skillManagementApi.getCategories(), skillManagementApi.getMyRequests(member.id)]);
      setCategories(nextCategories);
      setRequests(nextRequests);
    } catch (error) { setFeedback({ text: error instanceof Error ? error.message : "Could not load skills.", error: true }); }
  };
  useEffect(() => { void load(); }, [member.id]);
  const pending = useMemo(() => requests.find((item) => item.status === "pending"), [requests]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (pending || !name.trim()) return;
    setSaving(true); setFeedback(undefined);
    try {
      const created = await skillManagementApi.requestCustomSkill({ skillName: name.trim(), ...(categoryId ? { categoryId } : {}), requester: member });
      setRequests((items) => [created, ...items]); setName(""); setCategoryId("");
      setFeedback({ text: "Submitted for admin approval. You cannot request another skill until it is reviewed." });
    } catch (error) { setFeedback({ text: error instanceof Error ? error.message : "Could not submit the request.", error: true }); }
    finally { setSaving(false); }
  };

  return <section className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm">
    <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet"><ShieldCheck size={20} /></span><div><h2 className="text-lg font-extrabold">Request a new skill</h2><p className="mt-1 text-sm text-ink/55">Skills outside the approved categories need an admin review.</p></div></div>
    {pending ? <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><div className="flex items-center gap-2 font-bold"><LockKeyhole size={16} /> One request is awaiting approval</div><p className="mt-1 text-sm">“{pending.skillName}” was submitted {new Date(pending.requestedAt).toLocaleDateString()}. Submit another skill after an admin approves or rejects this request.</p></div> : <form className="mt-5 space-y-3" onSubmit={submit}>
      <label className="block text-sm font-bold">Skill name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required placeholder="e.g. Drone photography" className="mt-1.5 w-full rounded-xl border border-ink/15 px-3 py-2.5 outline-none focus:border-violet" /></label>
      <label className="block text-sm font-bold">Closest category <span className="font-normal text-ink/45">(optional)</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 outline-none focus:border-violet"><option value="">No matching category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Send size={16} />{saving ? "Submitting…" : "Request approval"}</button>
    </form>}
    {feedback && <div className="mt-4"><Message error={feedback.error}>{feedback.text}</Message></div>}
    {requests.length > 0 && <div className="mt-6 border-t pt-4"><h3 className="text-sm font-extrabold">Your requests</h3><ul className="mt-3 space-y-2">{requests.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold">{item.skillName}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[item.status]}`}>{item.status}</span></li>)}</ul></div>}
  </section>;
}

/** Admin-only review queue. Approve/reject immediately releases the user's request lock. */
export function SkillApprovalQueue() {
  const [items, setItems] = useState<SkillRequest[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const [busyId, setBusyId] = useState<string>();
  useEffect(() => { skillManagementApi.getPendingRequests().then(setItems).catch((error) => setFeedback({ text: error instanceof Error ? error.message : "Could not load requests.", error: true })); }, []);
  const decide = async (id: string, decision: "approved" | "rejected") => {
    setBusyId(id); setFeedback(undefined);
    try { await skillManagementApi.reviewRequest(id, decision); setItems((current) => current.filter((item) => item.id !== id)); setFeedback({ text: `Skill request ${decision}. The member can now submit another request.` }); }
    catch (error) { setFeedback({ text: error instanceof Error ? error.message : "Could not update request.", error: true }); }
    finally { setBusyId(undefined); }
  };
  return <section className="rounded-3xl border border-ink/10 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Moderation</p><h2 className="mt-1 text-xl font-extrabold">Skill approval queue</h2></div><span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">{items.length} pending</span></div>{feedback && <div className="mt-4"><Message error={feedback.error}>{feedback.text}</Message></div>}<div className="mt-4 divide-y">{items.length ? items.map((item) => <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-bold">{item.skillName}</p><p className="text-sm text-ink/55">{item.requester ? `${item.requester.name} · ${item.requester.email}` : "Member request"}{item.categoryName ? ` · ${item.categoryName}` : ""}</p></div><div className="flex gap-2"><button disabled={busyId === item.id} onClick={() => void decide(item.id, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Check size={15} />Approve</button><button disabled={busyId === item.id} onClick={() => void decide(item.id, "rejected")} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><X size={15} />Reject</button></div></article>) : <p className="py-8 text-center text-sm text-ink/50"><Clock3 className="mx-auto mb-2" size={20} />No skill requests waiting for review.</p>}</div></section>;
}
