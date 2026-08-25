import { Award, CheckCircle2, AlertCircle } from 'lucide-react';
import type { CertificateStatus } from '@/types';

export function StatCard({ label, value, icon, color }: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'rose';
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 leading-tight">{value}</div>
          <div className="text-xs text-slate-500 font-medium">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: CertificateStatus }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-rose-50 text-rose-700 border-rose-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  const dot: Record<string, string> = {
    active: 'bg-emerald-500',
    revoked: 'bg-rose-500',
    expired: 'bg-amber-500',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status]}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function Field({ label, icon, required, children }: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
        <span className="text-slate-400">{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function DetailRow({ icon, label, value, mono }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className={`text-sm text-slate-900 font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

export function EmptyState({ onIssue, hasCerts }: { onIssue: () => void; hasCerts: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Award className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-1">
        {hasCerts ? 'No certificates found' : 'No certificates yet'}
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">
        {hasCerts ? 'Try adjusting your search terms.' : 'Issue your first certificate to generate a QR code for verification.'}
      </p>
      {!hasCerts && (
        <button onClick={onIssue} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">
          <Award className="w-4 h-4" /> Issue Certificate
        </button>
      )}
    </div>
  );
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export { Award, CheckCircle2, AlertCircle };
