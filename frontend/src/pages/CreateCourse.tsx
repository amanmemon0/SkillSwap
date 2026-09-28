import { FormEvent, useState } from 'react';
import { ArrowLeft, BookOpen, Coins, FileText, LoaderCircle, Send } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/Primitives';
import { api } from '../utils/api';

export default function CreateCourse() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creditCost, setCreditCost] = useState('25');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const credits = Number(creditCost);
    if (!name.trim() || !description.trim()) {
      setError('Add a course name and description before publishing.');
      return;
    }
    if (!Number.isInteger(credits) || credits < 0 || credits > 10000) {
      setError('Credits must be a whole number from 0 to 10,000.');
      return;
    }

    setError('');
    setSaving(true);
    try {
      const course = await api.createCourse({
        // The current API requires a skill name. Until skills are selected separately,
        // use the course name so every created course remains discoverable.
        skillName: name.trim(),
        title: name.trim(),
        description: description.trim(),
        creditCost: credits,
        status: 'published',
      });
      nav(`/teaching/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create this course. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar variant="auth" />
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
        <Link to="/teaching" className="inline-flex items-center gap-2 text-sm font-bold text-ink/55 transition hover:text-violet">
          <ArrowLeft size={16} /> Back to My Teaching
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-7">
          <p className="eyebrow">Teach</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Create a course</h1>
          <p className="mt-2 text-ink/55">Share your expertise and set the credit cost for learners.</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          onSubmit={submit}
          className="mt-8 rounded-3xl border border-ink/5 bg-white p-6 shadow-card sm:p-8"
        >
          {error && <div role="alert" className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

          <div className="space-y-6">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold"><BookOpen size={16} className="text-violet" /> Course name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={160} placeholder="e.g. Practical React for Beginners" className="field w-full" required />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold"><FileText size={16} className="text-violet" /> Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={4000} rows={6} placeholder="Explain what learners will learn and who this course is for." className="field w-full resize-y" required />
              <span className="mt-1 block text-right text-xs text-ink/40">{description.length}/4000</span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold"><Coins size={16} className="text-amber-500" /> Credits to charge</span>
              <input value={creditCost} onChange={(event) => setCreditCost(event.target.value)} type="number" min="0" max="10000" step="1" inputMode="numeric" className="field w-full sm:max-w-xs" required />
              <span className="mt-2 block text-xs text-ink/50">Learners pay this number of SkillSwap credits when they enroll. Set 0 for a free course.</span>
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-ink/5 pt-6 sm:flex-row sm:justify-end">
            <Link to="/teaching"><Button type="button" className="w-full bg-ink/5 text-ink hover:bg-ink/10 sm:w-auto">Cancel</Button></Link>
            <Button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-violet to-electric text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
              {saving ? <><LoaderCircle size={16} className="animate-spin" /> Creating...</> : <><Send size={16} /> Publish course</>}
            </Button>
          </div>
        </motion.form>
      </div>
    </main>
  );
}
