import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, BellRing, Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button, cn } from './ui';
import { signIn, signInWithApple, signInWithGoogle, signUp, sendPasswordReset } from '../services/auth';
import { openInAppBrowser } from '../services/native';
import loginBackground from '../../backgrounds/login.mp4';

const AUTH_INTENT_KEY = 'callmate_auth_intent';
let ssoInFlight = false;

export function SetupAnimation({ isDark, userName, onDone }: { isDark: boolean; userName: string; onDone: () => void }) {
  const [step, setStep] = React.useState(-1);
  const [showFinale, setShowFinale] = React.useState(false);
  const darkPrimaryButtonClass = 'bg-[linear-gradient(135deg,#22312b_0%,#31463d_100%)] text-white shadow-[0_18px_36px_rgba(34,49,43,0.18)] hover:brightness-[1.03]';

  const steps = [
    'Building your anxiety profile',
    'Preparing your script toolkit',
    'Activating Panic Mode & Safe lines',
    'Syncing your progress tracker',
  ];

  React.useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i), i * 1050 + 300));
    });
    timers.push(setTimeout(() => setShowFinale(true), steps.length * 1050 + 600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className={cn('app-screen warm-therapeutic-bg flex flex-col items-center justify-center px-8 transition-colors relative overflow-hidden', isDark ? 'bg-[#161d1b] text-[#f6f2ea]' : 'text-[#22312b]')}>
      <div className="w-full max-w-sm relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-black leading-tight">
            {userName ? `Setting things up for you, ${userName}.` : 'Setting things up for you.'}
          </h1>
          <p className={cn('text-sm mt-1.5', isDark ? 'text-[#9aa8a2]' : 'text-[#6f7d75]')}>This will feel calm and quick.</p>
        </motion.div>

        <div className="space-y-4 mb-10">
          {steps.map((text, i) => {
            const isDone = step >= i;
            const isActive = step === i - 1;
            return (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3"
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                    className="w-5 h-5 rounded-full bg-[#7b9d76] flex items-center justify-center shrink-0"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                ) : isActive ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#7b9d76] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className={cn('w-5 h-5 rounded-full border-2 shrink-0', isDark ? 'border-zinc-700' : 'border-zinc-300')} />
                )}
                <span className={cn(
                  'text-sm font-medium transition-colors duration-300',
                  isDone ? (isDark ? 'text-white' : 'text-[#22312b]') : (isDark ? 'text-[#899791]' : 'text-[#7d8b84]')
                )}>
                  {text}
                </span>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          animate={{ opacity: showFinale ? 1 : 0, y: showFinale ? 0 : 20 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: showFinale ? 'auto' : 'none' }}
          className="space-y-4"
        >
          <div>
            <p className={cn('text-xs font-black uppercase tracking-widest mb-1.5', isDark ? 'text-[#a9c2b5]' : 'text-[#5d8a7a]')}>All set</p>
            <h2 className="text-2xl font-black leading-tight">Your Callmate is ready.</h2>
          </div>
          <button
            onClick={onDone}
            className={cn('w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.99]', darkPrimaryButtonClass)}
          >
            Enter Callmate
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export const OnboardingNotificationsStep = React.memo(function OnboardingNotificationsStep({
  isDark,
  onContinue,
}: {
  isDark: boolean;
  onContinue: () => void;
}) {
  return (
    <div className={cn('app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden', isDark ? 'bg-[#161d1b] text-[#f6f2ea]' : 'text-[#22312b]')}>
      <div className="keyboard-aware flex-1 flex flex-col px-7 pb-8 max-w-md mx-auto w-full relative z-10 overflow-y-auto">
        <motion.div key="notifications" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }} className="flex flex-col h-full pt-3">
          <div className="flex-1 flex flex-col justify-start pt-12">
            <div className="space-y-9">
              <div className="space-y-3 text-center">
                <h2 className={cn('text-[2.25rem] font-bold tracking-tight leading-[1.02]', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>
                  Be reminded to log calls
                </h2>
              </div>

              <div className={cn(
                'mx-auto w-full max-w-[18.5rem] rounded-[1.9rem] border overflow-hidden shadow-[0_24px_70px_rgba(35,49,43,0.12)]',
                isDark ? 'bg-[#e8ddd0] border-[#d2c7bb]' : 'bg-[#ece3d8] border-[#d8cdc0]'
              )}>
                <div className="px-6 pt-7 pb-5 text-center">
                  <div className={cn(
                    'mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center',
                    isDark ? 'bg-[#f7f2eb] text-[#22312b]' : 'bg-white/85 text-[#22312b]'
                  )}>
                    <BellRing className="w-6 h-6" />
                  </div>
                  <p className="text-[1.05rem] font-medium leading-[1.3] text-[#1f1c22]">
                    Cellmate would like to
                    <br />
                    send you Notifications
                  </p>
                </div>

                <div className="grid grid-cols-2 border-t border-black/10">
                  <div className="h-[4.35rem] flex items-center justify-center text-base font-medium text-[#4e4954] bg-black/[0.04]">
                    Don&apos;t Allow
                  </div>
                  <button
                    onClick={onContinue}
                    className="h-[4.35rem] flex items-center justify-center text-base font-semibold text-[#f7f0e7] bg-[#1f1c22]"
                  >
                    Allow
                  </button>
                </div>
              </div>

              <motion.div
                aria-hidden="true"
                className="flex justify-end pr-16"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-[2rem] select-none">☝️</span>
              </motion.div>
            </div>
          </div>

          <div className="shrink-0 pt-6">
            <p className={cn('text-center text-sm leading-relaxed', isDark ? 'text-[#a7b5af]' : 'text-[#66756f]')}>
              You can change this anytime in your iPhone settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
});

export function AccountSetup({ isDark, userName, tier, selectedPlan, trialStartDate, onComplete }: {
  isDark: boolean;
  userName: string;
  tier: string;
  selectedPlan: 'monthly' | 'annual' | null;
  trialStartDate: number | null;
  onComplete: (email: string, isNewUser: boolean) => Promise<void>;
}) {
  const [mode, setMode] = React.useState<'signup' | 'login'>('signup');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [appleLoading, setAppleLoading] = React.useState(false);
  const emailAuthHidden = true;
  const selectedPlanLabel =
    tier === 'annual' || selectedPlan === 'annual'
      ? 'Annual Plan · Save 35%'
      : tier === 'monthly' || selectedPlan === 'monthly'
      ? 'Monthly Plan'
      : null;

  const trialEndDate = trialStartDate
    ? new Date(trialStartDate + 3 * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null;

  const switchMode = (next: 'signup' | 'login') => {
    setMode(next);
    setEmail('');
    setPassword('');
    setEmailError('');
    setPendingConfirmationEmail('');
  };

  const formatAuthError = (message?: string, fallback = 'Something went wrong. Please try again.') => {
    const normalized = message?.toLowerCase() ?? '';
    if (!normalized) return fallback;
    if (normalized.includes('email rate limit exceeded') || normalized.includes('over_email_send_rate_limit') || normalized.includes('429')) {
      return 'Too many attempts. Try again in a few minutes or use Google/Apple Sign In.';
    }
    if (normalized.includes('user already registered') || normalized.includes('already exists')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (normalized.includes('invalid login credentials') || normalized.includes('incorrect email or password')) {
      return 'Incorrect email or password.';
    }
    if (normalized.includes('email not confirmed')) {
      return 'Please confirm your email address first.';
    }
    if (normalized.includes('password is too short')) {
      return 'Password must be at least 6 characters.';
    }
    return message ?? fallback;
  };

  const finishSignedInUser = async (
    user: { email?: string | null; created_at?: string } | null | undefined,
    authIntent: 'signup' | 'login' = mode
  ) => {
    if (!user) {
      setEmailError('Authentication did not complete. Please try again.');
      return false;
    }

    const authEmail = user.email ?? '';
    const inferredNewUser = user.created_at
      ? Date.now() - new Date(user.created_at).getTime() < 30000
      : false;
    const isNewUser = authIntent === 'signup' || inferredNewUser;

    await onComplete(authEmail, isNewUser);
    return true;
  };

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setEmailError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setEmailError('');
    setPendingConfirmationEmail('');
    try {
      if (mode === 'signup') {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await signUp(normalizedEmail, password, userName || undefined);
        if (error) {
          setEmailError(formatAuthError(error.message));
          return;
        }
        if (data.session?.user) {
          await onComplete(data.session.user.email ?? normalizedEmail, true);
          return;
        }
        setPendingConfirmationEmail(normalizedEmail);
      } else {
        const { error } = await signIn(email.trim().toLowerCase(), password);
        if (error) {
          setEmailError('Incorrect email or password.');
          return;
        }
        await onComplete(email.trim().toLowerCase(), false);
      }
    } catch {
      setEmailError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Enter your email above first.');
      return;
    }
    const { error } = await sendPasswordReset(email.trim().toLowerCase());
    if (error) {
      setEmailError(formatAuthError(error.message));
      return;
    }
    setEmailError('Password reset email sent — check your inbox.');
  };

  const showConfirmationState = mode === 'signup' && !!pendingConfirmationEmail;

  const handleApple = async () => {
    if (ssoInFlight) return;
    ssoInFlight = true;
    setAppleLoading(true);
    setEmailError('');
    localStorage.setItem(AUTH_INTENT_KEY, mode);
    try {
      const result = await signInWithApple();
      const { error, data } = result as { error: any; data: any };
      if (error) {
        const msg = error.message?.toLowerCase() ?? '';
        setEmailError(
          msg.includes('client') || msg.includes('provider') || msg.includes('enabled')
            ? 'Apple Sign In is not configured yet — use email below.'
            : formatAuthError(error.message)
        );
      } else {
        const appleUser = data?.user ?? data?.session?.user;
        if (appleUser) {
          await finishSignedInUser(appleUser, mode);
        }
      }
    } catch (e: any) {
      const msg = e?.message ?? '';
      localStorage.removeItem(AUTH_INTENT_KEY);
      if (!msg.toLowerCase().includes('cancel')) {
        setEmailError(`Apple Sign In failed: ${formatAuthError(msg)}`);
      }
    } finally {
      ssoInFlight = false;
      setAppleLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (ssoInFlight) return;
    ssoInFlight = true;
    setLoading(true);
    setEmailError('');
    localStorage.setItem(AUTH_INTENT_KEY, mode);
    try {
      const { data, error } = await signInWithGoogle();
      if (error) {
        localStorage.removeItem(AUTH_INTENT_KEY);
        const msg = error.message?.toLowerCase() ?? '';
        setEmailError(
          msg.includes('client') || msg.includes('provider') || msg.includes('enabled')
            ? 'Google Sign In is not configured yet — use email below.'
            : formatAuthError(error.message)
        );
      } else if ('user' in data || 'session' in data) {
        const oauthResult = data as any;
        const googleUser = oauthResult?.user ?? oauthResult?.session?.user;
        if (googleUser) {
          await finishSignedInUser(googleUser, mode);
        }
      }
    } catch (e: any) {
      localStorage.removeItem(AUTH_INTENT_KEY);
      const msg = e?.message ?? '';
      if (!msg.toLowerCase().includes('cancel')) {
        setEmailError(`Google Sign In failed: ${formatAuthError(msg)}`);
      }
    } finally {
      ssoInFlight = false;
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const checkSession = async () => {
      const { supabase: sb } = await import('../services/supabase');
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const authIntent = localStorage.getItem(AUTH_INTENT_KEY) as 'signup' | 'login' | null;
        const inferredNewUser = session.user.created_at
          ? Date.now() - new Date(session.user.created_at).getTime() < 30000
          : false;
        const isNewUser = authIntent === 'signup' || inferredNewUser;
        await onComplete(session.user.email || '', isNewUser);
      }
    };
    void checkSession();
  }, [onComplete]);

  return (
    <div className={cn('app-screen warm-therapeutic-bg flex flex-col transition-colors duration-500 relative overflow-hidden', isDark ? 'bg-[#161d1b] text-[#f6f2ea]' : 'text-[#22312b]')}>
      <div className="keyboard-aware auth-keyboard-aware flex-1 flex flex-col px-5 pt-6 pb-6 overflow-y-auto max-w-lg mx-auto w-full justify-start">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="mb-4">
          <AuthBenefitHero isDark={isDark} selectedPlanLabel={selectedPlanLabel} />
        </motion.div>

        <div className="pb-2">
          {!showConfirmationState && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className={cn(
                  'space-y-3 mb-4 rounded-[2rem] border p-4 shadow-[0_24px_70px_rgba(19,28,24,0.1)] backdrop-blur-sm',
                  isDark
                    ? 'bg-[#1c2522]/92 border-[#3d4d46]'
                    : 'bg-[rgba(255,252,247,0.88)] border-[#e6dbcf]'
                )}
              >
                <button onClick={handleApple} disabled={loading || appleLoading} className={cn(
                  'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50 shadow-sm',
                  isDark ? 'bg-[#f4efe6] text-[#22312b] border-[#f4efe6] hover:bg-[#ebe4d8]' : 'bg-[#22312b] text-[#fbf8f2] border-[#22312b] hover:bg-[#2e4039]'
                )}>
                  {appleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                      {mode === 'login' ? 'Sign in with Apple' : 'Continue with Apple'}
                    </>
                  )}
                </button>
                <button onClick={handleGoogle} disabled={loading} className={cn(
                  'w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50',
                  isDark ? 'bg-[#202926] text-white border-[#46534d] hover:border-[#66756f]' : 'bg-[rgba(255,251,245,0.92)] text-[#22312b] border-[#d8cdc0] hover:border-[#b7aa96]'
                )}>
                  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  {mode === 'login' ? 'Sign in with Google' : 'Continue with Google'}
                </button>
              </motion.div>
            </>
          )}

          {!emailAuthHidden && showConfirmationState ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className={cn(
                'rounded-3xl border p-5 space-y-4 mb-5',
                isDark ? 'bg-[#202926]/85 border-[#415049]' : 'bg-[rgba(255,251,245,0.94)] border-[#d8cdc0]'
              )}
            >
              <div className="space-y-2">
                <p className={cn('text-xs font-black uppercase tracking-[0.25em]', isDark ? 'text-[#b4d0bd]' : 'text-[#7b9d76]')}>Account Created</p>
                <h2 className="text-2xl font-bold leading-tight">Check your email to finish signing up.</h2>
                <p className={cn('text-sm leading-relaxed', isDark ? 'text-[#c5d0ca]' : 'text-[#607068]')}>
                  We sent a confirmation link to <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingConfirmationEmail}</span>.
                  Tap that link and we&apos;ll finish bringing you into Callmate.
                </p>
              </div>
            </motion.div>
          ) : !emailAuthHidden ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="space-y-3 mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                className={cn(
                  'w-full px-4 py-4 rounded-2xl border text-base focus:outline-none transition-colors',
                  isDark ? 'bg-[#202926] border-[#415049] text-white placeholder:text-[#82908a] focus:border-[#7b9d76]' : 'bg-[rgba(255,251,245,0.94)] border-[#d8cdc0] text-[#22312b] placeholder:text-[#92a09a] focus:border-[#7b9d76]'
                )}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'login' ? 'Your password' : 'Create a password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setEmailError(''); }}
                  className={cn(
                    'w-full px-4 py-4 rounded-2xl border text-base focus:outline-none transition-colors pr-12',
                    isDark ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-indigo-500' : 'bg-zinc-50 border-zinc-200 text-black placeholder:text-zinc-400 focus:border-indigo-400'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className={cn('absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold uppercase tracking-widest', isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {mode === 'login' && (
                <div className="flex justify-end px-1">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className={cn('text-xs font-semibold', isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500')}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
              {emailError && (
                <p className="text-red-400 text-xs px-1">{emailError}</p>
              )}
            </motion.div>
          ) : (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className={cn('text-center text-sm leading-relaxed mb-4 px-2', isDark ? 'text-[#b8c5bf]' : 'text-[#5e6f67]')}
            >
              By continuing, you agree to our{' '}
              <button
                type="button"
                onClick={() => openInAppBrowser('https://www.trycallmate.app/terms.html')}
                className={cn('underline underline-offset-2 transition-colors', isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black')}
              >
                Terms of Service
              </button>
              {' '}and{' '}
              <button
                type="button"
                onClick={() => openInAppBrowser('https://www.trycallmate.app/privacy.html')}
                className={cn('underline underline-offset-2 transition-colors', isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-black')}
              >
                Privacy Policy
              </button>
              .
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }} className="space-y-3">
            {!emailAuthHidden && showConfirmationState ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setEmail(pendingConfirmationEmail);
                    setPassword('');
                    setEmailError('');
                    setPendingConfirmationEmail('');
                  }}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25"
                >
                  I already confirmed my email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPendingConfirmationEmail('');
                    setEmail('');
                    setPassword('');
                    setEmailError('');
                  }}
                  className={cn(
                    'w-full py-3 rounded-2xl border text-sm font-semibold transition-colors',
                    isDark ? 'border-zinc-700 text-zinc-300 hover:border-zinc-500' : 'border-zinc-200 text-zinc-700 hover:border-zinc-400'
                  )}
                >
                  Use a different email
                </button>
              </>
            ) : !emailAuthHidden ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'login' ? 'Sign In' : 'Create Account & Start Free Trial')}
              </button>
            ) : null}
            {!emailAuthHidden && mode === 'signup' && trialEndDate && (
              <p className={cn('text-center text-xs leading-relaxed', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
                Your 3-day free trial starts now. No charge until {trialEndDate}.<br />Cancel anytime.
              </p>
            )}
            {!emailAuthHidden && mode === 'signup' && (
              <p className={cn('text-center text-[11px] leading-relaxed', isDark ? 'text-zinc-600' : 'text-zinc-400')}>
                By creating an account you agree to our{' '}
                <button type="button" onClick={() => openInAppBrowser('https://www.trycallmate.app/terms.html')} className={cn('underline underline-offset-2 transition-colors', isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black')}>Terms of Service</button>
                {' '}and{' '}
                <button type="button" onClick={() => openInAppBrowser('https://www.trycallmate.app/privacy.html')} className={cn('underline underline-offset-2 transition-colors', isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black')}>Privacy Policy</button>.
              </p>
            )}
            {!emailAuthHidden && (
              <p className={cn('text-center text-sm pt-1', isDark ? 'text-zinc-500' : 'text-zinc-400')}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  className={cn('font-semibold', isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500')}
                >
                  {mode === 'login' ? 'Sign up →' : 'Sign in →'}
                </button>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function AuthBenefitHero({ isDark, selectedPlanLabel }: { isDark: boolean; selectedPlanLabel: string | null }) {
  const backgroundVideoUrl: string | null = loginBackground;
  const steps = [
    { label: 'Before', value: 'When the call starts spiraling in your head, Callmate gives you grounding and prep that stay with your account every time you come back.' },
    { label: 'Support', value: 'Callmate builds the script, organizes what to say next, and keeps that support with your account every time you come back.' },
    { label: 'Result', value: 'You come in calmer, clearer, and more ready to follow through with support that stays with your account every time you come back.' },
  ] as const;

  const [phase, setPhase] = React.useState(0);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setPhase((current) => (current + 1) % steps.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const active = steps[phase];

  return (
    <div className={cn(
      'rounded-[2.25rem] border px-5 pt-5 pb-5 overflow-hidden relative min-h-[25rem]',
      isDark
        ? 'bg-[linear-gradient(180deg,rgba(32,41,38,0.98)_0%,rgba(23,31,29,0.96)_100%)] border-[#415049]'
        : 'bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(245,239,230,0.95)_100%)] border-[#d8cdc0]'
    )}>
      {backgroundVideoUrl && (
        <video
          className="absolute inset-0 h-full w-full object-cover object-top"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        >
          <source src={backgroundVideoUrl} type="video/mp4" />
        </video>
      )}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,18,16,0.06)_0%,rgba(12,18,16,0.16)_42%,rgba(12,18,16,0.42)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none">
        <div className={cn('absolute left-[-10%] top-[-25%] w-40 h-40 rounded-full blur-3xl', isDark ? 'bg-[#dff0e4]/14' : 'bg-[#d8c5a6]/26')} />
        <div className={cn('absolute right-[-12%] top-[-20%] w-36 h-36 rounded-full blur-3xl', isDark ? 'bg-[#dff0e4]/10' : 'bg-[#8fae9e]/18')} />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0)_44%,rgba(16,24,20,0.22)_67%,rgba(16,24,20,0.72)_100%)]" />

      <div className="relative flex min-h-[22.5rem] flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[1.65rem] font-black leading-none tracking-tight text-white">Callmate</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#edf7f0]/90">Call support that calms the spiral</p>
          </div>
          {selectedPlanLabel && (
            <div className="rounded-full border border-white/25 bg-white/14 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/95 backdrop-blur-md">
              {selectedPlanLabel}
            </div>
          )}
        </div>

        <div className="mt-auto pt-28">
          <div className="max-w-[18.5rem]">
            <AnimatePresence mode="wait">
              <motion.p
                key={`eyebrow-${phase}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="mb-3 text-[11px] font-black uppercase tracking-[0.28em] text-[#edf7f0]"
              >
                {active.label}
              </motion.p>
            </AnimatePresence>
            <h2 className="text-[2.25rem] font-black leading-[0.92] tracking-[-0.04em] text-white">
              Feel ready
              <br />
              before you call.
            </h2>
            <AnimatePresence mode="wait">
              <motion.p
                key={`benefit-${phase}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24 }}
                className="mt-3 max-w-[18rem] text-[15px] leading-relaxed text-[#edf3ef]"
              >
                {active.value}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {steps.map((_, index) => (
            <motion.div
              key={index}
              animate={{ width: index === phase ? 24 : 8, opacity: index === phase ? 1 : 0.35 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className={cn('h-1.5 rounded-full', index === phase ? 'bg-[#edf7f0]' : 'bg-white/35')}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ to, duration = 2.2, active }: { to: number; duration?: number; active: boolean }) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const steps = 40;
    const stepSize = to / steps;
    const stepDuration = (duration * 1000) / steps;
    let cur = 0;
    const t = setInterval(() => {
      cur += stepSize;
      if (cur >= to) { setValue(to); clearInterval(t); }
      else setValue(Math.round(cur));
    }, stepDuration);
    return () => clearInterval(t);
  }, [active, to, duration]);
  return <>{value}</>;
}

export function OnboardingDemoDashboard({ isDark }: { isDark: boolean }) {
  const [phase, setPhase] = React.useState(1);
  React.useEffect(() => {
    const t2 = setTimeout(() => setPhase(2), 2900);
    const t3 = setTimeout(() => setPhase(3), 4500);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const demoMilestones = [
    { icon: '📞', title: 'Broke the Silence', unlocked: phase >= 2 },
    { icon: '🔥', title: 'Faced the Ring', unlocked: phase >= 2 },
    { icon: '😌', title: 'Easy Does It', unlocked: phase >= 3 },
    { icon: '📉', title: 'Turning the Corner', unlocked: false },
    { icon: '💪', title: 'Held the Line', unlocked: false },
    { icon: '🏆', title: 'Week Strong', unlocked: false },
  ];

  const benchmarkPath = 'M 0,20 C 28,20 52,24 72,34 S 118,54 152,62 S 214,70 252,70';
  const benchmarkAreaPath = `${benchmarkPath} L 252,72 L 0,72 Z`;
  const callmatePath = 'M 0,20 C 26,19 44,24 62,37 S 104,49 130,34 S 172,10 214,6 S 238,5 252,5';
  const callmateAreaPath = `${callmatePath} L 252,72 L 0,72 Z`;
  const pathLen = 290;
  const graphEase: [number, number, number, number] = [0.72, 0.02, 0.98, 0.42];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
        <AnimatePresence mode="wait">
          {phase === 0
            ? <motion.span key="before" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Week 1</motion.span>
            : <motion.span key="after" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Week 6</motion.span>
          }
        </AnimatePresence>
        <div className={cn('flex-1 h-px', isDark ? 'bg-zinc-800' : 'bg-zinc-200')} />
      </div>

      <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200')}>
        <div className="grid grid-cols-3 divide-x divide-zinc-800/50">
          {[
            { label: 'Recovery Score', value: phase >= 1 ? 72 : 0, suffix: '', color: phase >= 1 ? 'text-emerald-400' : 'text-zinc-500' },
            { label: 'Streak', value: phase >= 1 ? 14 : 0, suffix: 'D', color: phase >= 1 ? 'text-orange-400' : 'text-zinc-500' },
            { label: 'Calls Done', value: phase >= 1 ? 12 : 0, suffix: '', color: phase >= 1 ? 'text-blue-400' : 'text-zinc-500' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center px-2">
              <p className={cn('text-2xl font-black tabular-nums transition-colors', stat.color)}>
                <AnimatedCounter to={stat.value} active={phase >= 1} />{stat.suffix}
              </p>
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5 text-center">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200')}>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Call confidence over 6 weeks</p>
        <div className="flex gap-5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] rounded-full bg-[#1f2937]" />
            <p className="text-xs font-semibold text-zinc-400">Without support</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-[2px] rounded-full bg-[#7b9d76]" />
            <p className="text-xs font-semibold text-zinc-400">Callmate</p>
          </div>
        </div>
        <div className="relative">
          <svg viewBox="0 0 252 72" className="w-full" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="lineGradBenchmark" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={isDark ? '#d4d4d8' : '#1f2937'} stopOpacity="0.8" />
                <stop offset="100%" stopColor={isDark ? '#71717a' : '#52525b'} stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="lineGradCallmate" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8ca79a" />
                <stop offset="55%" stopColor="#7b9d76" />
                <stop offset="100%" stopColor="#5d8a7a" />
              </linearGradient>
              <linearGradient id="fillGradCallmate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7b9d76" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#7b9d76" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="fillGradBenchmark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? '#71717a' : '#52525b'} stopOpacity="0.1" />
                <stop offset="100%" stopColor={isDark ? '#71717a' : '#52525b'} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[20, 44, 68].map(y => (
              <line key={y} x1="0" y1={y} x2="252" y2={y} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'} strokeWidth="1" />
            ))}
            <motion.path d={benchmarkAreaPath} fill="url(#fillGradBenchmark)" initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.6, delay: 1.2 }} />
            <motion.path d={callmateAreaPath} fill="url(#fillGradCallmate)" initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.8, delay: 2.1 }} />
            <motion.path d={benchmarkPath} fill="none" stroke="url(#lineGradBenchmark)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={pathLen} initial={{ strokeDashoffset: pathLen }} animate={{ strokeDashoffset: phase >= 1 ? 0 : pathLen }} transition={{ duration: 2.9, ease: graphEase, delay: 0.18 }} />
            <motion.path d={callmatePath} fill="none" stroke="url(#lineGradCallmate)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={pathLen} initial={{ strokeDashoffset: pathLen }} animate={{ strokeDashoffset: phase >= 1 ? 0 : pathLen }} transition={{ duration: 3.1, ease: graphEase, delay: 0.42 }} />
            <circle cx="0" cy="20" r="3.6" fill={isDark ? '#f4f4f5' : '#ffffff'} stroke={isDark ? '#71717a' : '#3f3f46'} strokeWidth="1.5" />
            <circle cx="252" cy="70" r="3.8" fill={isDark ? '#161d1b' : '#ffffff'} stroke={isDark ? '#d4d4d8' : '#27272a'} strokeWidth="1.6" />
            {phase >= 1 && (
              <motion.circle cx="252" cy="5" r="3.8" fill={isDark ? '#161d1b' : '#ffffff'} stroke="#7b9d76" strokeWidth="1.8" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 3.05, type: 'spring', stiffness: 260 }} />
            )}
            {phase >= 1 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}>
                <text x="188" y="22" fontSize="10" fill={isDark ? '#c5d0ca' : '#51615b'} fontWeight="700">Callmate</text>
                <text x="188" y="32" fontSize="10" fill={isDark ? '#8f9b95' : '#8a948f'}>builds lasting</text>
                <text x="188" y="42" fontSize="10" fill={isDark ? '#8f9b95' : '#8a948f'}>confidence</text>
              </motion.g>
            )}
            {phase >= 1 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
                <text x="18" y="58" fontSize="10" fill={isDark ? '#b5b8c3' : '#6b7280'} fontWeight="700">Without support</text>
              </motion.g>
            )}
            <text x="0" y="83" fontSize="10" fill={isDark ? '#a1a1aa' : '#6b7280'}>Week 1</text>
            <text x="226" y="83" fontSize="10" fill={isDark ? '#a1a1aa' : '#6b7280'}>Week 6</text>
          </svg>
        </div>
        {phase >= 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }} className="text-center text-[10px] font-semibold leading-relaxed text-zinc-500 mt-5">
            <span className={cn('font-bold', isDark ? 'text-[#f6f2ea]' : 'text-[#22312b]')}>78%</span> of Callmate members maintain stronger call confidence by week 6.
          </motion.p>
        )}
      </div>

      <div className={cn('rounded-2xl border p-4 transition-colors', isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200')}>
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">Milestones</p>
        <div className="grid grid-cols-3 gap-2">
          {demoMilestones.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: m.unlocked ? 1 : 0.3, scale: m.unlocked ? 1 : 0.95 }}
              transition={{ delay: m.unlocked ? 0.1 * i : 0, type: 'spring', stiffness: 300 }}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-xl text-center border transition-all',
                m.unlocked
                  ? isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                  : isDark ? 'bg-zinc-800/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
              )}
            >
              <span className="text-xl">{m.unlocked ? m.icon : '🔒'}</span>
              <p className={cn('text-[9px] font-bold leading-tight', m.unlocked ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : 'text-zinc-600')}>{m.title}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
