import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import VerifyPage from '@/components/VerifyPage';

type View = 'dashboard' | 'verify';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const match = hash.match(/^#\/verify\/(.+)$/);
      if (match) {
        setVerifyId(match[1]);
        setView('verify');
      } else {
        setView('dashboard');
        setVerifyId(null);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goDashboard = () => {
    window.location.hash = '';
    setView('dashboard');
    setVerifyId(null);
  };

  if (view === 'verify' && verifyId) {
    return <VerifyPage certificateId={verifyId} onBack={goDashboard} />;
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return <Dashboard session={session} />;
}
