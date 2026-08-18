import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import ImsLogo from '@/components/ImsLogo';
import { Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo header */}
        <div className="flex flex-col items-center mb-8">
          <ImsLogo size="lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header band */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Admin Portal</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to manage certificates</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="form-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Lock className="w-4 h-4 text-slate-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          IMS College SA — Certificate Verification System
        </p>
      </div>
    </div>
  );
}
