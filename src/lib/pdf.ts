import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface ExtractedCertData {
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

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .filter(Boolean);
    fullText += strings.join(' ') + '\n';
  }
  return fullText;
}

function findAfter(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*[:\\-]?\\s*([A-Za-z][A-Za-z0-9 ,.\\-/&'\\-]{2,80})`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function findValue(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*[:\\-]?\\s*([A-Za-z0-9 ,.\\-/&'\\-]{1,80})`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function findDate(text: string, labels: string[]): string | null {
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`${escaped}\\s*[:\\-]?\\s*(\\d{1,2}[\\/-]\\d{1,2}[\\/-]\\d{2,4}|\\d{4}[\\/-]\\d{1,2}[\\/-]\\d{1,2}|\\w+ \\d{1,2},? \\d{4})`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return normalizeDate(match[1].trim());
    }
  }
  return null;
}

function normalizeDate(raw: string): string {
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return raw;
}

export function parseCertificateFields(text: string): Partial<ExtractedCertData> {
  return {
    student_name:
      findAfter(text, [
        'Student Name',
        'Name',
        'Awarded To',
        'Recipient',
        'This is to certify that',
        'Participant',
        'Learner',
      ]) || '',
    id_number: findValue(text, ['ID Number', 'ID No', 'Identity Number', 'ID']) || '',
    course_name:
      findAfter(text, [
        'Course',
        'Course Name',
        'Training',
        'Programme',
        'Program',
        'Unit Standard',
        'Module',
        'Qualification',
      ]) || '',
    course_date:
      findDate(text, [
        'Course Date',
        'Completion Date',
        'Date',
        'Issue Date',
        'Date of Issue',
        'Date Completed',
      ]) || '',
    expiry_date:
      findDate(text, ['Expiry', 'Expiry Date', 'Valid Until', 'Expires', 'Valid To']) || '',
    issuer_name:
      findAfter(text, [
        'Issuer',
        'Issued By',
        'Organization',
        'Organisation',
        'Training Provider',
        'Institution',
        'College',
        'Accredited',
      ]) || '',
    saqa_id: findValue(text, ['SAQA', 'SAQA ID', 'SAQA Qualification', 'Qualification ID']) || '',
    nqf_level: findValue(text, ['NQF Level', 'NQF', 'Level']) || '',
    credits: findValue(text, ['Credits', 'Credit']) || '',
    assessor_no: findValue(text, ['Assessor', 'Assessor No', 'Assessor Number', 'Assessor Registration']) || '',
  };
}

export async function extractCertificateFromPdf(file: File): Promise<Partial<ExtractedCertData>> {
  const text = await extractTextFromPdf(file);
  return parseCertificateFields(text);
}
