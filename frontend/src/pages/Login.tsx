import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthShell from '../layouts/AuthShell';
import { Button } from '../components/ui/Primitives';
import { api } from '../utils/api';

const schema = z.object({
  email: z.string().email('Use a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
});
type Form = z.infer<typeof schema>;

interface LoginProps {
  initialForgot?: boolean;
}

export default function Login({ initialForgot = false }: LoginProps) {
  const nav = useNavigate();
  const [isForgot, setIsForgot] = useState(initialForgot);
  const [show, setShow] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Forgot password — two-step flow
  // Step 1: user enters email → we send token
  // Step 2: user enters token + new password → we reset
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotInfo, setForgotInfo] = useState('');
  const [forgotBusy, setForgotBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const submit = async ({ email, password }: Form) => {
    setBusy(true);
    setAuthError('');
    try {
      const user = await api.login({ email, password });
      nav(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error: any) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  };

  // Step 1: request a reset token to be sent to email
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotInfo('');
    const emailTrimmed = forgotEmail.trim();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      setForgotError('Please enter a valid email address');
      return;
    }
    setForgotBusy(true);
    try {
      const res = await api.requestPasswordReset({ email: emailTrimmed });
      setForgotInfo(res.message || 'Check your email for a reset token.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Unable to send reset email. Please try again.');
    } finally {
      setForgotBusy(false);
    }
  };

  // Step 2: consume the token and set the new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    if (!forgotToken.trim()) {
      setForgotError('Please enter the token from your email');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotBusy(true);
    try {
      const res = await api.resetPassword({ token: forgotToken.trim(), newPassword });
      setResetSuccess(res.message || 'Password reset successfully! You can now sign in.');
      setValue('email', forgotEmail);
      setIsForgot(false);
      setForgotStep(1);
      setForgotToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired token. Please request a new one.');
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <AuthShell>
      <Link to="/" className="flex items-center gap-2 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-electric text-white text-xs">
          🔄
        </span>
        SkillSwap
      </Link>

      {!isForgot ? (
        <>
          <p className="eyebrow mt-12">Welcome back</p>
          <h2 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Keep your curiosity{' '}
            <span className="gradient-text">moving.</span>
          </h2>
          <p className="mt-3 text-sm text-ink/55">
            Sign in with your registered account credentials.
          </p>

          {resetSuccess && (
            <div role="status" className="mt-6 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{resetSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
            <label className="block text-sm font-bold">
              Email
              <input
                className="field mt-2"
                type="email"
                placeholder="name@example.com"
                {...register('email')}
              />
              {errors.email && <small className="text-coral mt-1 block">{errors.email.message}</small>}
            </label>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    const currentEmail = getValues('email');
                    if (currentEmail) setForgotEmail(currentEmail);
                    setForgotError('');
                    setAuthError('');
                    setResetSuccess('');
                    setIsForgot(true);
                  }}
                  className="text-xs font-semibold text-violet hover:text-electric transition underline underline-offset-2"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-2">
                <input
                  className="field pr-10"
                  type={show ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-violet transition"
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <small className="text-coral mt-1 block">{errors.password.message}</small>}
            </div>

            {authError && (
              <p role="alert" className="rounded-xl bg-coral/10 border border-coral/20 p-3 text-xs font-bold text-coral">
                {authError}
              </p>
            )}

            <Button
              disabled={busy}
              className="w-full bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow hover:scale-[1.02]"
            >
              {busy ? (
                'Signing in…'
              ) : (
                <>
                  Enter SkillSwap <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-ink/55">
            Need an account?{' '}
            <Link className="font-bold text-violet hover:text-electric transition" to="/register">
              Create your profile
            </Link>
          </p>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setIsForgot(false);
              setForgotError('');
              setForgotInfo('');
              setForgotStep(1);
            }}
            className="mt-8 flex items-center gap-1.5 text-xs font-bold text-ink/60 hover:text-violet transition"
          >
            <ArrowLeft size={15} /> Back to Sign In
          </button>

          <p className="eyebrow mt-6">Account Recovery</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
            Reset your{' '}
            <span className="gradient-text">password.</span>
          </h2>

          {forgotStep === 1 ? (
            <>
              <p className="mt-3 text-sm text-ink/55">
                Enter your account email. We'll send you a one-time reset token.
              </p>
              <form onSubmit={handleRequestReset} className="mt-8 space-y-4">
                <label className="block text-sm font-bold">
                  Account Email
                  <input
                    className="field mt-2"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </label>

                {forgotError && (
                  <p role="alert" className="rounded-xl bg-coral/10 border border-coral/20 p-3 text-xs font-bold text-coral">
                    {forgotError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={forgotBusy}
                  className="w-full bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {forgotBusy ? 'Sending...' : <><KeyRound size={16} /> Send Reset Token</>}
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink/55">
                Check your email for the reset token, then enter it below with your new password.
              </p>
              {forgotInfo && (
                <div role="status" className="mt-4 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  <span>{forgotInfo}</span>
                </div>
              )}
              <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
                <label className="block text-sm font-bold">
                  Reset Token
                  <input
                    className="field mt-2 font-mono tracking-widest"
                    type="text"
                    required
                    placeholder="Paste token from email"
                    value={forgotToken}
                    onChange={(e) => setForgotToken(e.target.value)}
                  />
                </label>

                <div>
                  <label className="block text-sm font-bold">New Password</label>
                  <div className="relative mt-2">
                    <input
                      className="field pr-10"
                      type={showNew ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-violet transition"
                    >
                      {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold">Confirm New Password</label>
                  <div className="relative mt-2">
                    <input
                      className="field pr-10"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Toggle password visibility"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-violet transition"
                    >
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {forgotError && (
                  <p role="alert" className="rounded-xl bg-coral/10 border border-coral/20 p-3 text-xs font-bold text-coral">
                    {forgotError}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={forgotBusy}
                  className="w-full bg-gradient-to-r from-violet to-electric text-white hover:shadow-glow hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  {forgotBusy ? 'Resetting password…' : <><KeyRound size={16} /> Reset Password</>}
                </Button>

                <button
                  type="button"
                  onClick={() => { setForgotStep(1); setForgotError(''); setForgotToken(''); }}
                  className="w-full text-xs font-semibold text-ink/50 hover:text-violet transition"
                >
                  Didn't receive a token? Send again
                </button>
              </form>
            </>
          )}

          <p className="mt-7 text-center text-sm text-ink/55">
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setForgotError('');
                setForgotStep(1);
              }}
              className="font-bold text-violet hover:text-electric transition"
            >
              Sign in
            </button>
          </p>
        </>
      )}
    </AuthShell>
  );
}
