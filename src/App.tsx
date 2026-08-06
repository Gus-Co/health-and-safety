import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Certificate } from '@/types';
import { buildVerifyUrl } from '@/lib/qr';
import { generateQrDataUrl } from '@/lib/qr';
import { extractCertificateFromPdf } from '@/lib/pdf';
import ImsLogo from '@/components/ImsLogo';
import {
  ShieldCheck,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Ban,
  RotateCcw,
  X,
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  BookOpen,
  Award,
  Building2,
  Hash,
  Clock,
  IdCard,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';

type View = 'dashboard' | 'verify';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [verifyId, setVerifyId] = useState<string | null>(null);

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
  return <Dashboard />;
}

function Dashboard() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  const fetchCertificates = async () => {
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
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <ImsLogo size="md" />
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
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Issued" value={stats.total} icon={<Award className="w-5 h-5" />} color="slate" />
          <StatCard label="Active" value={stats.active} icon={<CheckCircle2 className="w-5 h-5" />} color="emerald" />
          <StatCard label="Revoked" value={stats.revoked} icon={<AlertCircle className="w-5 h-5" />} color="rose" />
        </div>

        {/* Search */}
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

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onIssue={() => setShowForm(true)} hasCerts={certificates.length > 0} />
        ) : (
          <>
            {/* Desktop table */}
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

            {/* Mobile cards */}
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

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    revoked: 'bg-rose-50 text-rose-700 border-rose-200',
    expired: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.active}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'revoked' ? 'bg-rose-500' : 'bg-amber-500'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function EmptyState({ onIssue, hasCerts }: { onIssue: () => void; hasCerts: boolean }) {
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
          <Plus className="w-4 h-4" /> Issue Certificate
        </button>
      )}
    </div>
  );
}

function IssueFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    student_name: '',
    id_number: '',
    course_name: '',
    course_date: '',
    expiry_date: '',
    issuer_name: '',
    saqa_id: '',
    nqf_level: '',
    credits: '',
    assessor_no: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractionNote, setExtractionNote] = useState<string | null>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    setUploading(true);
    setError(null);
    setExtractionNote(null);
    setFileName(file.name);
    try {
      const extracted = await extractCertificateFromPdf(file);
      setForm((prev) => ({
        student_name: extracted.student_name || prev.student_name,
        id_number: extracted.id_number || prev.id_number,
        course_name: extracted.course_name || prev.course_name,
        course_date: extracted.course_date || prev.course_date,
        expiry_date: extracted.expiry_date || prev.expiry_date,
        issuer_name: extracted.issuer_name || prev.issuer_name,
        saqa_id: extracted.saqa_id || prev.saqa_id,
        nqf_level: extracted.nqf_level || prev.nqf_level,
        credits: extracted.credits || prev.credits,
        assessor_no: extracted.assessor_no || prev.assessor_no,
      }));
      const filled = Object.values(extracted).filter((v) => v).length;
      setExtractionNote(
        filled > 0
          ? `Extracted ${filled} field${filled === 1 ? '' : 's'} from the PDF. Please review before issuing.`
          : 'Could not extract fields from this PDF. Please fill in manually.'
      );
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setError('Could not read this PDF. Please fill in the form manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const certNumber = await generateCertNumber();

    const { data: inserted, error: insertError } = await supabase
      .from('certificates')
      .insert({
        student_name: form.student_name,
        id_number: form.id_number || null,
        course_name: form.course_name,
        course_date: form.course_date,
        expiry_date: form.expiry_date || null,
        issuer_name: form.issuer_name,
        saqa_id: form.saqa_id || null,
        nqf_level: form.nqf_level || null,
        credits: form.credits || null,
        assessor_no: form.assessor_no || null,
        certificate_number: certNumber,
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      setError('Failed to issue certificate. Please check your connection and try again.');
      setSaving(false);
      return;
    }

    const verifyUrl = buildVerifyUrl(inserted.id);

    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-cert-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        student_name: form.student_name,
        id_number: form.id_number || null,
        course_name: form.course_name,
        course_date: form.course_date,
        expiry_date: form.expiry_date || null,
        issuer_name: form.issuer_name,
        certificate_number: certNumber,
        saqa_id: form.saqa_id || null,
        nqf_level: form.nqf_level || null,
        credits: form.credits || null,
        assessor_no: form.assessor_no || null,
        verify_url: verifyUrl,
      }),
    }).catch((err) => console.error('Email notification failed:', err));

    onSaved();
  };

  const generateCertNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });
    const seq = String((count || 0) + 1).padStart(4, '0');
    return `HSC-${year}-${seq}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Issue New Certificate</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* PDF Upload Zone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <span className="text-slate-400"><FileText className="w-4 h-4" /></span>
              Upload PDF to auto-fill
            </label>
            <label
              className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                uploading ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" disabled={uploading} />
              {uploading ? (
                <>
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  <span className="text-sm text-slate-600">Extracting data from PDF...</span>
                </>
              ) : fileName ? (
                <>
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <span className="text-sm text-slate-700 font-medium truncate max-w-full px-2">{fileName}</span>
                  <span className="text-xs text-slate-400">Click to upload a different PDF</span>
                </>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-sm text-slate-600 font-medium">Drop a certificate PDF here or click to browse</span>
                  <span className="text-xs text-slate-400">We'll extract the details and fill the form for you</span>
                </>
              )}
            </label>
            {extractionNote && (
              <div className="flex items-center gap-2 mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {extractionNote}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">or fill in manually</span></div>
          </div>

          <Field label="Student Name" icon={<User className="w-4 h-4" />} required>
            <input
              type="text"
              required
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
              placeholder="e.g. John Smith"
              className="form-input"
            />
          </Field>
          <Field label="ID Number" icon={<IdCard className="w-4 h-4" />}>
            <input
              type="text"
              value={form.id_number}
              onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              placeholder="e.g. 8901234567089"
              className="form-input"
            />
          </Field>
          <Field label="Course / Qualification" icon={<BookOpen className="w-4 h-4" />} required>
            <input
              type="text"
              required
              value={form.course_name}
              onChange={(e) => setForm({ ...form, course_name: e.target.value })}
              placeholder="e.g. First Aid Level 1"
              className="form-input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Course Date" icon={<Calendar className="w-4 h-4" />} required>
              <input
                type="date"
                required
                value={form.course_date}
                onChange={(e) => setForm({ ...form, course_date: e.target.value })}
                className="form-input"
              />
            </Field>
            <Field label="Expiry Date" icon={<Clock className="w-4 h-4" />}>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                className="form-input"
              />
            </Field>
          </div>
          <Field label="Issuer / Training Provider" icon={<Building2 className="w-4 h-4" />} required>
            <input
              type="text"
              required
              value={form.issuer_name}
              onChange={(e) => setForm({ ...form, issuer_name: e.target.value })}
              placeholder="e.g. IMS College SA"
              className="form-input"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SAQA ID" icon={<Hash className="w-4 h-4" />}>
              <input
                type="text"
                value={form.saqa_id}
                onChange={(e) => setForm({ ...form, saqa_id: e.target.value })}
                placeholder="e.g. 120456"
                className="form-input"
              />
            </Field>
            <Field label="NQF Level" icon={<GraduationCap className="w-4 h-4" />}>
              <input
                type="text"
                value={form.nqf_level}
                onChange={(e) => setForm({ ...form, nqf_level: e.target.value })}
                placeholder="e.g. 1"
                className="form-input"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Credits" icon={<Award className="w-4 h-4" />}>
              <input
                type="text"
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
                placeholder="e.g. 5"
                className="form-input"
              />
            </Field>
            <Field label="Assessor No." icon={<ClipboardCheck className="w-4 h-4" />}>
              <input
                type="text"
                value={form.assessor_no}
                onChange={(e) => setForm({ ...form, assessor_no: e.target.value })}
                placeholder="e.g. 00083421"
                className="form-input"
              />
            </Field>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {saving ? 'Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, icon, required, children }: { label: string; icon: React.ReactNode; required?: boolean; children: React.ReactNode }) {
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

function CertificateDetailModal({ certificate, onClose }: { certificate: Certificate; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    const verifyUrl = buildVerifyUrl(certificate.id);
    generateQrDataUrl(verifyUrl).then(setQrUrl);
  }, [certificate.id]);

  const downloadQr = () => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${certificate.certificate_number}.png`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-slate-700" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Certificate Details</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Details */}
            <div className="space-y-4">
              <DetailRow icon={<User className="w-4 h-4" />} label="Student" value={certificate.student_name} />
              {certificate.id_number && (
                <DetailRow icon={<IdCard className="w-4 h-4" />} label="ID Number" value={certificate.id_number} mono />
              )}
              <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Course / Qualification" value={certificate.course_name} />
              <DetailRow icon={<Calendar className="w-4 h-4" />} label="Course Date" value={formatDate(certificate.course_date)} />
              {certificate.expiry_date && (
                <DetailRow icon={<Clock className="w-4 h-4" />} label="Expires" value={formatDate(certificate.expiry_date)} />
              )}
              <DetailRow icon={<Building2 className="w-4 h-4" />} label="Training Provider" value={certificate.issuer_name} />
              <DetailRow icon={<Hash className="w-4 h-4" />} label="Certificate No." value={certificate.certificate_number} mono />
              {certificate.saqa_id && (
                <DetailRow icon={<Hash className="w-4 h-4" />} label="SAQA ID" value={certificate.saqa_id} mono />
              )}
              {certificate.nqf_level && (
                <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="NQF Level" value={certificate.nqf_level} />
              )}
              {certificate.credits && (
                <DetailRow icon={<Award className="w-4 h-4" />} label="Credits" value={certificate.credits} />
              )}
              {certificate.assessor_no && (
                <DetailRow icon={<ClipboardCheck className="w-4 h-4" />} label="Assessor No." value={certificate.assessor_no} mono />
              )}
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1.5">Status</div>
                <StatusBadge status={certificate.status} />
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-6 border border-slate-200">
              {qrUrl ? (
                <>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3">
                    <img src={qrUrl} alt="QR Code" className="w-44 h-44" />
                  </div>
                  <p className="text-xs text-slate-500 text-center mb-3 max-w-[200px]">
                    Print this QR code on the certificate. Scanning it opens a verification page.
                  </p>
                  <button
                    onClick={downloadQr}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                </>
              ) : (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        <div className={`text-sm text-slate-900 font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}

function VerifyPage({ certificateId, onBack }: { certificateId: string; onBack: () => void }) {
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('id', certificateId)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setCert(data);
      }
      setLoading(false);
    };
    fetchCert();
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Certificate Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">
            This QR code does not match any certificate in our system. The certificate may be invalid or has been removed.
          </p>
          <button onClick={onBack} className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!cert) return null;

  const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date();
  const isRevoked = cert.status === 'revoked';
  const isValid = cert.status === 'active' && !isExpired;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        {/* Verification banner */}
        <div className={`rounded-2xl p-6 mb-4 text-center ${isValid ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {isValid ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-white mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-white">Certificate Verified</h1>
              <h2>from IMS</h2>
              <p className="text-emerald-50 text-sm mt-1">This certificate is authentic and valid</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-14 h-14 text-white mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-white">
                {isRevoked ? 'Certificate Revoked' : 'Certificate Expired'}
              </h1>
              <p className="text-rose-50 text-sm mt-1">
                {isRevoked
                  ? 'This certificate has been revoked by the issuer'
                  : 'This certificate has passed its expiry date'}
              </p>
            </>
          )}
        </div>

        {/* Certificate card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center gap-3">
            <ImsLogo size="sm" />
          </div>

          <div className="p-6 space-y-5">
            <div className="text-center pb-4 border-b border-slate-100">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Awarded to</div>
              <div className="text-2xl font-bold text-slate-900">{cert.student_name}</div>
            </div>

            <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Course / Qualification" value={cert.course_name} />
            <DetailRow icon={<Building2 className="w-4 h-4" />} label="Training Provider" value={cert.issuer_name} />
            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Completion Date" value={formatDate(cert.course_date)} />
            {cert.expiry_date && (
              <DetailRow icon={<Clock className="w-4 h-4" />} label="Valid Until" value={formatDate(cert.expiry_date)} />
            )}
            <DetailRow icon={<Hash className="w-4 h-4" />} label="Certificate Number" value={cert.certificate_number} mono />
            {cert.saqa_id && (
              <DetailRow icon={<Hash className="w-4 h-4" />} label="SAQA ID" value={cert.saqa_id} mono />
            )}
            {cert.nqf_level && (
              <DetailRow icon={<GraduationCap className="w-4 h-4" />} label="NQF Level" value={cert.nqf_level} />
            )}
            {cert.credits && (
              <DetailRow icon={<Award className="w-4 h-4" />} label="Credits" value={cert.credits} />
            )}
            {cert.assessor_no && (
              <DetailRow icon={<ClipboardCheck className="w-4 h-4" />} label="Assessor No." value={cert.assessor_no} mono />
            )}

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Verification Status</span>
                <StatusBadge status={isExpired && cert.status === 'active' ? 'expired' : cert.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 mt-4">
          <ImsLogo size="sm" />
          <p className="text-xs text-slate-400">
            Scanned {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
