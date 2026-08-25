import { useEffect, useState } from 'react';
import type { Certificate } from '@/types';
import { buildVerifyUrl, generateQrDataUrl } from '@/lib/qr';
import { DetailRow, StatusBadge, formatDate } from '@/components/ui';
import { Award, X, Download, User, IdCard, BookOpen, Calendar, Clock, Building2, Hash, GraduationCap, ClipboardCheck } from 'lucide-react';

export default function CertificateDetailModal({ certificate, onClose }: {
  certificate: Certificate;
  onClose: () => void;
}) {
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

            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-6 border border-slate-200">
              {qrUrl ? (
                <>
                  <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-3">
                    <img src={qrUrl} alt="QR Code" className="w-44 h-44" />
                  </div>
                  <p className="text-xs text-slate-500 text-center mb-3 max-w-[200px]">
                    Print this QR code on the certificate. Scanning it opens a verification page.
                  </p>
                  <button onClick={downloadQr} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
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
