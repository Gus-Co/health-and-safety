export type CertificateStatus = 'active' | 'revoked' | 'expired';

export interface Certificate {
  id: string;
  student_name: string;
  course_name: string;
  course_date: string;
  expiry_date: string | null;
  issuer_name: string;
  certificate_number: string;
  id_number: string | null;
  saqa_id: string | null;
  nqf_level: string | null;
  credits: string | null;
  assessor_no: string | null;
  status: CertificateStatus;
  created_at: string;
}

export type CertificateInput = Omit<Certificate, 'id' | 'status' | 'created_at' | 'certificate_number'> & {
  certificate_number?: string;
};
