'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, FileText, Video, Code2, MessageSquare } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup/send-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send code'); setLoading(false); return; }
      setStep('OTP');
      setSuccessMsg(`6-digit code sent to ${email}`);
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) { setError('Please enter the complete 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup/verify-otp', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Verification failed'); setLoading(false); return; }
      const loginRes = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);
      if (loginRes?.error) { setError('Account created, but sign-in failed. Please log in.'); }
      else { router.push('/'); router.refresh(); }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (/[^0-9]/.test(value) && value !== '') return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) { setOtp(pasted.split('')); inputRefs.current[5]?.focus(); }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  const features = [
    { Icon: FileText, text: 'Chrome Extension for instant capture' },
    { Icon: CheckCircle2, text: 'AI-generated flashcards & quizzes' },
    { Icon: CheckCircle2, text: 'FSRS-powered review scheduling' },
    { Icon: Mail, text: 'Email reminders for due concepts' },
  ];

  return (
    <div className="auth-root">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-container">
        {/* Left — branding */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="RecallOS" className="auth-brand-logo-img" />
              <span className="auth-brand-name">RecallOS</span>
            </div>
            <h2 className="auth-brand-headline">
              Your second brain.<br />Always learning.<br />Never forgetting.
            </h2>
            <p className="auth-brand-sub">
              Capture knowledge from YouTube, LeetCode, ChatGPT, and articles. RecallOS turns it into a personalized spaced-repetition system that makes mastery inevitable.
            </p>
            <div className="auth-feature-list">
              {features.map(({ Icon, text }) => (
                <div key={text} className="auth-feature-item">
                  <span className="auth-feature-check"><Icon size={10} /></span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="auth-form-panel">
          <div className="auth-form-card">

            {step === 'FORM' ? (
              <>
                <div className="auth-form-header">
                  <h1 className="auth-form-title">Create your account</h1>
                  <p className="auth-form-subtitle">Start building your knowledge base today</p>
                </div>

                <form onSubmit={handleRequestOtp} className="auth-form-body">
                  {error && (
                    <div className="auth-alert auth-alert-error">
                      <AlertCircle size={15} /> {error}
                    </div>
                  )}

                  <div className="auth-field">
                    <label htmlFor="name" className="auth-label">Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={14} className="auth-input-icon" />
                      <input id="name" type="text" value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Alex Johnson" autoComplete="name" className="auth-input" />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="email" className="auth-label">Email address</label>
                    <div className="auth-input-wrap">
                      <Mail size={14} className="auth-input-icon" />
                      <input id="email" type="email" value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com" required autoComplete="email" className="auth-input" />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label htmlFor="password" className="auth-label">
                      Password <span className="auth-label-hint">Min. 8 characters</span>
                    </label>
                    <div className="auth-input-wrap">
                      <Lock size={14} className="auth-input-icon" />
                      <input id="password" type={showPassword ? 'text' : 'password'}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required minLength={8} autoComplete="new-password"
                        className="auth-input" />
                      <button type="button" className="auth-input-toggle"
                        onClick={() => setShowPassword(s => !s)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-primary" disabled={loading}>
                    {loading ? <Loader2 size={15} className="auth-spinner-icon" /> : null}
                    {loading ? 'Sending code...' : 'Continue'}
                  </button>
                </form>

                <div className="auth-divider-row">
                  <span className="auth-divider-line" />
                  <span className="auth-divider-text">or sign up with</span>
                  <span className="auth-divider-line" />
                </div>

                <button className="auth-btn-google" onClick={handleGoogle} disabled={googleLoading}>
                  {googleLoading ? <Loader2 size={15} className="auth-spinner-icon" /> : (
                    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                  )}
                  {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
                </button>

                <p className="auth-switch-text">
                  Already have an account? <Link href="/login" className="auth-switch-link">Sign in</Link>
                </p>
              </>
            ) : (
              /* OTP Step */
              <div className="auth-otp-step">
                <div className="auth-otp-icon-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="RecallOS" style={{ height: '42px', width: 'auto', margin: '0 auto', objectFit: 'contain', display: 'block' }} />
                </div>
                <h1 className="auth-form-title">Check your inbox</h1>
                <p className="auth-form-subtitle">
                  We sent a 6-digit code to<br />
                  <strong className="auth-otp-email">{email}</strong>
                </p>

                {successMsg && (
                  <div className="auth-alert auth-alert-success">
                    <CheckCircle2 size={15} /> {successMsg}
                  </div>
                )}
                {error && (
                  <div className="auth-alert auth-alert-error">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="auth-otp-form">
                  <div className="auth-otp-grid">
                    {otp.map((digit, i) => (
                      <input key={i}
                        ref={el => { inputRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        className={`auth-otp-box ${digit ? 'auth-otp-box-filled' : ''}`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button type="submit" className="auth-btn-primary"
                    disabled={loading || otp.join('').length !== 6}>
                    {loading ? <Loader2 size={15} className="auth-spinner-icon" /> : null}
                    {loading ? 'Verifying...' : 'Verify & Create Account'}
                  </button>
                </form>

                <div className="auth-otp-actions">
                  <button className="auth-link-btn" onClick={() => handleRequestOtp()} disabled={resendTimer > 0 || loading}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
                  </button>
                  <span className="auth-otp-dot">·</span>
                  <button className="auth-link-btn" onClick={() => { setStep('FORM'); setError(''); setSuccessMsg(''); setOtp(['','','','','','']); }}>
                    Change email
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
