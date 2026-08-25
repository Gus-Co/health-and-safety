import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { buildVerifyUrl } from '@/lib/qr';
import { extractCertificateFromPdf } from '@/lib/pdf';
import { Field } from '@/components/ui';
import {
  Plus, X, Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  User, IdCard, BookOpen, Calendar, Clock, Building2, Hash,
  GraduationCap, Award, ClipboardCheck,
} from 'lucide-react';

interface FormState {
  student_name: string;
  id_number: string;
  course_name: string;
  course_date: string;
  expiry_date: string;
  issuer_name: string;
  saqa_id: string;
  nqf_level: string;
  credits: string;
  assessor_no: string;
}

const emptyForm: FormState = {
  student_name: '', id_number: '', course_name: '', course_date: '',
  expiry_date: '', issuer_name: '', saqa_id: '', nqf_level: '',
  credits: '', assessor_no: '',
};

export default function IssueFormModal({ onClose, onSaved }: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
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
          : 'Could not extract fields from this PDF. Please fill in manually.',
      );
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setError('Could not read this PDF. Please fill in the form manually.');
    } finally {
      setUploading(false);
    }
  };

  const generateCertNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });
    const seq = String((count || 0) + 1).padStart(4, '0');
    return `CV-${year}-${seq}`;
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
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
              <span className="text-slate-400"><FileText className="w-4 h-4" /></span>
              Upload PDF to auto-fill
            </label>
            <label className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-emerald-300 bg-emerald-50/50' : 'border-slate-200 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/30'}`}>
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
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {extractionNote}
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider">or fill in manually</span></div>
          </div>

          <Field label="Student Name" icon={<User className="w-4 h-4" />} required>
            <input type="text" required value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} placeholder="e.g. John Smith" className="form-input" />
          </Field>
          <Field label="ID Number" icon={<IdCard className="w-4 h-4" />}>
            <input type="text" value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="e.g. 8901234567089" className="form-input" />
          </Field>
          <Field label="Course / Qualification" icon={<BookOpen className="w-4 h-4" />} required>
            <input type="text" required value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} placeholder="e.g. First Aid Level 1" className="form-input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Course Date" icon={<Calendar className="w-4 h-4" />} required>
              <input type="date" required value={form.course_date} onChange={(e) => setForm({ ...form, course_date: e.target.value })} className="form-input" />
            </Field>
            <Field label="Expiry Date" icon={<Clock className="w-4 h-4" />}>
              <input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} className="form-input" />
            </Field>
          </div>
          <Field label="Issuer / Training Provider" icon={<Building2 className="w-4 h-4" />} required>
            <input type="text" required value={form.issuer_name} onChange={(e) => setForm({ ...form, issuer_name: e.target.value })} placeholder="e.g. Acme Training" className="form-input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="SAQA ID" icon={<Hash className="w-4 h-4" />}>
              <input type="text" value={form.saqa_id} onChange={(e) => setForm({ ...form, saqa_id: e.target.value })} placeholder="e.g. 120456" className="form-input" />
            </Field>
            <Field label="NQF Level" icon={<GraduationCap className="w-4 h-4" />}>
              <input type="text" value={form.nqf_level} onChange={(e) => setForm({ ...form, nqf_level: e.target.value })} placeholder="e.g. 1" className="form-input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Credits" icon={<Award className="w-4 h-4" />}>
              <input type="text" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} placeholder="e.g. 5" className="form-input" />
            </Field>
            <Field label="Assessor No." icon={<ClipboardCheck className="w-4 h-4" />}>
              <input type="text" value={form.assessor_no} onChange={(e) => setForm({ ...form, assessor_no: e.target.value })} placeholder="e.g. 00083421" className="form-input" />
            </Field>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
              {saving ? 'Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
