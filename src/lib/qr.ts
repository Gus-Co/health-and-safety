import QRCode from 'qrcode';

export async function generateQrDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 400,
    margin: 2,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

export function buildVerifyUrl(certificateId: string): string {
  const origin = window.location.origin;
  return `${origin}/#/verify/${certificateId}`;
}
