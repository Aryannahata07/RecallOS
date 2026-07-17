'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/' });
  };

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
              Learn faster.<br />Forget less.<br />Remember everything.
            </h2>
            <p className="auth-brand-sub">
              AI-powered spaced repetition that captures knowledge from anywhere on the web and resurfaces it exactly when you need it.
            </p>
            <div className="auth-brand-stats">
              <div className="auth-stat">
                <span className="auth-stat-num">2×</span>
                <span className="auth-stat-label">faster retention</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-num">∞</span>
                <span className="auth-stat-label">sources captured</span>
              </div>
              <div className="auth-stat-divider" />
              <div className="auth-stat">
                <span className="auth-stat-num">0</span>
                <span className="auth-stat-label">forgotten concepts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — form */}
        <div className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h1 className="auth-form-title">Welcome back</h1>
              <p className="auth-form-subtitle">Sign in to your knowledge base</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form-body">
              {error && (
                <div className="auth-alert auth-alert-error">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}

              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={14} className="auth-input-icon" />
                  <input id="email" type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoComplete="email"
                    className="auth-input" />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="password" className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <Lock size={14} className="auth-input-icon" />
                  <input id="password" type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    className="auth-input" />
                  <button type="button" className="auth-input-toggle"
                    onClick={() => setShowPassword(s => !s)} tabIndex={-1}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-btn-primary" disabled={loading}>
                {loading ? <Loader2 size={15} className="auth-spinner-icon" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider-row">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <span className="auth-divider-line" />
            </div>

            <button className="auth-btn-google" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? (
                <Loader2 size={15} className="auth-spinner-icon" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
              )}
              {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
            </button>

            <p className="auth-switch-text">
              Don&apos;t have an account? <Link href="/signup" className="auth-switch-link">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
