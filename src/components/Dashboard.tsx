import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Certificate } from '@/types';
import Logo from '@/components/Logo';
import { StatCard, StatusBadge, EmptyState, formatDate } from '@/components/ui';
import IssueFormModal from '@/components/IssueFormModal';
import CertificateDetailModal from '@/components/CertificateDetailModal';
import {
  Award, Plus, Search, Eye, Trash2, Ban, RotateCcw,
  CheckCircle2, AlertCircle, LogOut,
} from 'lucide-react';

export default function Dashboard({ session }: { session: Session }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load certificates:', error);
    } else {
      setCertificates(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate? This cannot be undone.')) return;
    const { error } = await supabase.from('certificates').delete().eq('id', id);
    if (error) {
      alert('Failed to delete certificate. Please try again.');
      return;
    }
    fetchCertificates();
  };

  const handleToggleRevoke = async (cert: Certificate) => {
    const newStatus = cert.status === 'revoked' ? 'active' : 'revoked';
    const action = newStatus === 'revoked' ? 'revoke' : 'restore';
    if (!confirm(`Are you sure you want to ${action} this certificate?`)) return;
    const { error } = await supabase
      .from('certificates')
      .update({ status: newStatus })
      .eq('id', cert.id);
    if (error) {
      alert(`Failed to ${action} certificate. Please try again.`);
      return;
    }
    fetchCertificates();
  };

  const filtered = certificates.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.student_name.toLowerCase().includes(q) ||
      c.course_name.toLowerCase().includes(q) ||
      c.certificate_number.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: certificates.length,
    active: certificates.filter((c) => c.status === 'active').length,
    revoked: certificates.filter((c) => c.status === 'revoked').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-slate-500 max-w-[200px] truncate">
                {session.user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 px-3 py-2.5 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Issue Certificate</span>
                <span className="sm:hidden">Issue</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Issued" value={stats.total} icon={<Award className="w-5 h-5" />} color="slate" />
          <StatCard label="Active" value={stats.active} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
          <StatCard label="Revoked" value={stats.revoked} icon={<AlertCircle className="w-5 h-5" />} color="rose" />
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, course, or certificate number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onIssue={() => setShowForm(true)} hasCerts={certificates.length > 0} />
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Student</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Course</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cert No.</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-3.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{cert.student_name}</div>
                        <div className="text-xs text-slate-500">{cert.issuer_name}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{cert.course_name}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">{cert.certificate_number}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(cert.course_date)}</td>
                      <td className="px-6 py-4"><StatusBadge status={cert.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedCert(cert)} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="View & QR">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleToggleRevoke(cert)} className={`p-2 rounded-lg transition-colors ${cert.status === 'revoked' ? 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`} title={cert.status === 'revoked' ? 'Restore' : 'Revoke'}>
                            {cert.status === 'revoked' ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handleDelete(cert.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {filtered.map((cert) => (
                <div key={cert.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-slate-900">{cert.student_name}</div>
                      <div className="text-sm text-slate-600">{cert.course_name}</div>
                    </div>
                    <StatusBadge status={cert.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{cert.certificate_number}</span>
                    <span className="text-xs text-slate-500">{formatDate(cert.course_date)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedCert(cert)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                      <Eye className="w-4 h-4" /> View & QR
                    </button>
                    <button onClick={() => handleToggleRevoke(cert)} className={`p-2 rounded-lg transition-colors ${cert.status === 'revoked' ? 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'}`} title={cert.status === 'revoked' ? 'Restore' : 'Revoke'}>
                      {cert.status === 'revoked' ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(cert.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {showForm && (
        <IssueFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchCertificates();
          }}
        />
      )}

      {selectedCert && (
        <CertificateDetailModal
          certificate={selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
}
