'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step state: 'FORM' | 'OTP'
  const [step, setStep] = useState<'FORM' | 'OTP'>('FORM');

  // OTP State (6 boxes)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // UI state
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [resendTimer]);

  // Step 1: Send OTP request
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        setLoading(false);
        return;
      }

      setStep('OTP');
      setSuccessMsg(`Verification code sent to ${email}`);
      setResendTimer(60); // 60s cooldown
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and create account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/signup/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        setLoading(false);
        return;
      }

      // Auto login
      const loginRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (loginRes?.error) {
        setError('Account created, but automatic sign in failed. Please log in manually.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  // Handle single digit input box & auto-focus next box
  const handleOtpChange = (index: number, value: string) => {
    if (/[^0-9]/.test(value) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last char
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste 6 digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">🧠</span>
          <h1 className="auth-logo-text">RecallOS</h1>
        </div>

        {step === 'FORM' ? (
          <>
            <p className="auth-subtitle">Build your personal knowledge base</p>

            {/* Google Button */}
            <button
              className="google-btn"
              onClick={handleGoogle}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="btn-spinner" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            <div className="auth-divider">
              <span>or create an account</span>
            </div>

            {/* Form */}
            <form onSubmit={handleRequestOtp} className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  autoComplete="name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password
                  <span className="label-hint">Min. 8 characters</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Sending verification code...' : 'Continue →'}
              </button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link href="/login">Sign in →</Link>
            </p>
          </>
        ) : (
          /* STEP 2: OTP VERIFICATION */
          <div className="otp-step">
            <h2 className="otp-title">Enter 6-Digit Code</h2>
            <p className="otp-subtitle">
              We sent a verification code to <strong style={{ color: '#e8eaf0' }}>{email}</strong>
            </p>

            {successMsg && <div className="auth-success">{successMsg}</div>}
            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleVerifyOtp} className="otp-form">
              <div className="otp-inputs-grid">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="otp-box"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <span className="btn-spinner" /> : null}
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
            </form>

            <div className="otp-footer">
              <button
                type="button"
                className="resend-btn"
                onClick={() => handleRequestOtp()}
                disabled={resendTimer > 0 || loading}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend Code'}
              </button>
              <button
                type="button"
                className="change-email-btn"
                onClick={() => { setStep('FORM'); setError(''); setSuccessMsg(''); }}
              >
                ← Change Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
