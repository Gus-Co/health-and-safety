import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Certificate, CertificateStatus } from '@/types';
import Logo from '@/components/Logo';
import { DetailRow, StatusBadge, formatDate } from '@/components/ui';
import { CheckCircle2, AlertCircle, BookOpen, Building2, Calendar, Clock, Hash, GraduationCap, Award, ClipboardCheck } from 'lucide-react';

export default function VerifyPage({ certificateId, onBack }: {
  certificateId: string;
  onBack: () => void;
}) {
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
  const displayStatus: CertificateStatus = isExpired && cert.status === 'active' ? 'expired' : cert.status;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-lg w-full">
        <div className={`rounded-2xl p-6 mb-4 text-center ${isValid ? 'bg-emerald-600' : 'bg-rose-600'}`}>
          {isValid ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-white mx-auto mb-2" />
              <h1 className="text-2xl font-bold text-white">Certificate Verified</h1>
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center gap-3">
            <Logo size="sm" />
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
                <StatusBadge status={displayStatus} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 mt-4">
          <Logo size="sm" />
          <p className="text-xs text-slate-400">
            Scanned {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
