import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, Award, BookOpen, MessageCircle, ArrowRightLeft,
  MapPin, Calendar, Zap, Users, CheckCircle, Clock, ChevronRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Avatar, Button, SkillTag } from '../components/ui/Primitives';
import { api } from '../utils/api';
import { getToken } from '../utils/api';

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < Math.round(rating) ? 'text-warmyellow fill-warmyellow' : 'text-ink/20'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="rounded-2xl bg-surface p-4 border border-ink/5">
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewer?.full_name || 'User'} size="sm" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{review.reviewer?.full_name || 'Anonymous'}</p>
            <StarRating rating={review.rating} />
          </div>
          {review.comment && (
            <p className="mt-1.5 text-sm text-ink/60 leading-relaxed">{review.comment}</p>
          )}
          <p className="mt-1 text-[10px] text-ink/30">
            {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PublicUserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [compatibility, setCompatibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compatLoading, setCompatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'courses' | 'reviews'>('about');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', exchangeId: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!id) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await api.getUserProfile(id);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [id]);

  useEffect(() => {
    if (!id || !isLoggedIn) return;
    const loadCompatibility = async () => {
      setCompatLoading(true);
      try {
        const data = await api.getCompatibility(id);
        setCompatibility(data);
      } catch (err) {
        console.error('Failed to load compatibility:', err);
      } finally {
        setCompatLoading(false);
      }
    };
    loadCompatibility();
  }, [id, isLoggedIn]);

  const handleStartConversation = async () => {
    if (!id) return;
    try {
      const conv = await api.createConversation(id);
      navigate('/messages', { state: { conversationId: conv.id } });
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    setReviewError('');
    try {
      await api.submitReview(id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        exchangeId: reviewForm.exchangeId || undefined,
      });
      setReviewSuccess(true);
      // Reload profile to show new review
      const updated = await api.getUserProfile(id);
      setProfile(updated);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex justify-center items-center py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet border-t-transparent" />
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-surface">
        <Navbar />
        <div className="section-container py-20 text-center">
          <p className="text-2xl font-bold">User not found</p>
          <Link to="/explore" className="mt-4 inline-block text-violet font-bold">← Browse skills</Link>
        </div>
      </main>
    );
  }

  const avgRating = profile.rating ? Number(profile.rating).toFixed(1) : null;
  const compatScore = compatibility?.compatibility ?? null;

  return (
    <main className="min-h-screen bg-surface text-ink">
      <Navbar />

      <section className="section-container py-8">
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-sm font-bold text-ink/50 hover:text-violet transition mb-6"
        >
          <ArrowLeft size={16} /> Back to Explore
        </Link>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Sidebar — Profile Card */}
          <div className="space-y-4">
            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white p-6 shadow-card border border-ink/5"
            >
              <div className="text-center">
                <div className="mx-auto mb-4">
                  <Avatar name={profile.full_name} size="xl" showStatus status="online" />
                </div>
                <h1 className="font-display text-2xl font-bold">{profile.full_name}</h1>
                {profile.username && (
                  <p className="mt-0.5 text-sm text-ink/40">@{profile.username}</p>
                )}
                {profile.location && (
                  <p className="mt-1.5 flex items-center justify-center gap-1 text-xs text-ink/50">
                    <MapPin size={11} /> {profile.location}
                  </p>
                )}

                {/* Rating */}
                {avgRating && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <StarRating rating={Number(avgRating)} />
                    <span className="text-sm font-bold">{avgRating}</span>
                    <span className="text-xs text-ink/40">({profile.reviews?.length || 0} reviews)</span>
                  </div>
                )}

                {/* Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-surface p-3 text-center">
                    <p className="text-lg font-bold text-violet">{profile.completed_swaps || 0}</p>
                    <p className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">Swaps</p>
                  </div>
                  <div className="rounded-2xl bg-surface p-3 text-center">
                    <p className="text-lg font-bold text-electric">{profile.courses?.length || 0}</p>
                    <p className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">Courses</p>
                  </div>
                </div>
              </div>

              {/* Skill Level Badge */}
              {profile.skill_level && (
                <div className="mt-4 flex justify-center">
                  <span className="rounded-full bg-violet/10 px-3 py-1 text-xs font-bold text-violet">
                    {profile.skill_level}
                  </span>
                </div>
              )}

              {/* Availability */}
              {Array.isArray(profile.availability) && profile.availability.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/40 mb-2">Available</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.availability.map((slot: string) => (
                      <span key={slot} className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <Clock size={9} /> {slot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode */}
              {profile.learning_mode && (
                <div className="mt-3 flex items-center gap-2 text-xs text-ink/50">
                  <Zap size={12} className="text-violet" />
                  Prefers: <span className="font-bold text-ink">{profile.learning_mode}</span>
                </div>
              )}
            </motion.div>

            {/* Compatibility Card (only if logged in) */}
            {isLoggedIn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl bg-white p-5 shadow-card border border-ink/5"
              >
                <p className="eyebrow">Compatibility</p>
                <div className="mt-3 text-center">
                  {compatLoading ? (
                    <div className="py-4 flex justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet border-t-transparent" />
                    </div>
                  ) : compatScore !== null ? (
                    <>
                      <div className="relative mx-auto h-20 w-20">
                        <svg viewBox="0 0 36 36" className="rotate-[-90deg]">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f0f0f5" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.9" fill="none"
                            stroke="url(#compat-grad)" strokeWidth="3"
                            strokeDasharray={`${compatScore} ${100 - compatScore}`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="compat-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#7C3AED" />
                              <stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{compatScore}%</span>
                        </div>
                      </div>
                      <p className="mt-2 text-xs font-bold">
                        {compatScore >= 80 ? '🌟 Excellent' : compatScore >= 60 ? '✅ Good' : compatScore >= 40 ? '💡 Fair' : '🔍 Potential'} Match
                      </p>
                      {compatibility?.reasons?.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {compatibility.reasons.map((r: string, i: number) => (
                            <li key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                              <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-ink/40">Log in to see compatibility</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            {isLoggedIn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                <Link
                  to="/exchange-request"
                  state={{ matchedUser: profile }}
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-violet to-electric text-white shadow-glow hover:scale-[1.02]">
                    <ArrowRightLeft size={15} /> Propose Exchange
                  </Button>
                </Link>
                <Button
                  onClick={handleStartConversation}
                  className="w-full bg-white text-ink ring-1 ring-ink/10 hover:bg-violet/5 hover:text-violet"
                >
                  <MessageCircle size={15} /> Send Message
                </Button>
              </motion.div>
            )}
          </div>

          {/* Right Content — Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            {/* Tabs */}
            <div className="flex gap-1 rounded-2xl bg-white p-1.5 shadow-card border border-ink/5 mb-5 w-fit">
              {(['about', 'courses', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-violet to-electric text-white shadow-sm'
                      : 'text-ink/50 hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                {/* Bio */}
                {profile.bio && (
                  <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
                    <h2 className="font-display text-lg font-bold mb-3">About</h2>
                    <p className="text-sm text-ink/60 leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Skills Offered */}
                {profile.offeredSkills?.length > 0 && (
                  <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
                    <h2 className="font-display text-lg font-bold mb-4">
                      <span className="text-violet">Skills They Offer</span>
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.offeredSkills.map((skill: any) => (
                        <SkillTag key={skill.id} skill={skill.name} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Wanted */}
                {profile.wantedSkills?.length > 0 && (
                  <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
                    <h2 className="font-display text-lg font-bold mb-4">
                      <span className="text-electric">Skills They Want to Learn</span>
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.wantedSkills.map((skill: any) => (
                        <SkillTag key={skill.id} skill={skill.name} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary skill fallback */}
                {profile.offeredSkills?.length === 0 && profile.primary_skill && (
                  <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
                    <h2 className="font-display text-lg font-bold mb-4">Primary Skill</h2>
                    <SkillTag skill={profile.primary_skill} />
                  </div>
                )}
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                {profile.courses?.length > 0 ? (
                  profile.courses.map((course: any) => (
                    <div key={course.id} className="rounded-3xl bg-white p-5 shadow-card border border-ink/5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet/10 to-electric/10 text-xl">
                          💻
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold">{course.skill_name}</h3>
                          {course.description && (
                            <p className="mt-0.5 text-xs text-ink/50 line-clamp-2">{course.description}</p>
                          )}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          course.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {course.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl bg-white p-12 text-center border border-ink/5 shadow-card">
                    <BookOpen size={28} className="mx-auto mb-2 text-ink/20" />
                    <p className="text-sm text-ink/40 font-bold">No courses published yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Review Form */}
                {isLoggedIn && (
                  <div className="rounded-3xl bg-white p-6 shadow-card border border-ink/5">
                    <h2 className="font-display text-lg font-bold mb-4">Leave a Review</h2>
                    {reviewSuccess ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <CheckCircle size={18} /> Review submitted! Thank you.
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div>
                          <label className="text-sm font-bold block mb-2">Rating</label>
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setReviewForm(f => ({ ...f, rating: n }))}
                                className="transition hover:scale-110"
                              >
                                <Star
                                  size={28}
                                  className={n <= reviewForm.rating ? 'text-warmyellow fill-warmyellow' : 'text-ink/20'}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-bold block mb-2">Comment (optional)</label>
                          <textarea
                            value={reviewForm.comment}
                            onChange={(e) => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                            className="field min-h-24 resize-y"
                            placeholder="Share your experience with this person..."
                            maxLength={500}
                          />
                        </div>
                        {reviewError && (
                          <p className="text-sm font-bold text-rose-600">{reviewError}</p>
                        )}
                        <Button
                          type="submit"
                          disabled={submittingReview}
                          className="bg-gradient-to-r from-violet to-electric text-white disabled:opacity-50"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {profile.reviews?.length > 0 ? (
                    profile.reviews.map((review: any) => (
                      <ReviewCard key={review.id} review={review} />
                    ))
                  ) : (
                    <div className="rounded-3xl bg-white p-12 text-center border border-ink/5 shadow-card">
                      <Award size={28} className="mx-auto mb-2 text-ink/20" />
                      <p className="text-sm text-ink/40 font-bold">No reviews yet</p>
                      {isLoggedIn && <p className="mt-1 text-xs text-ink/30">Be the first to leave a review!</p>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
