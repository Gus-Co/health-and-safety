import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ADMIN_EMAILS = ["tshidi.motebs@gmail.com", "Info@imscollegesa.co.za"];

interface CertPayload {
  student_name: string;
  course_name: string;
  certificate_number: string;
  issuer_name: string;
  course_date: string;
  expiry_date?: string | null;
  id_number?: string | null;
  saqa_id?: string | null;
  nqf_level?: string | null;
  credits?: string | null;
  assessor_no?: string | null;
  verify_url: string;
}

function fmt(value?: string | null): string {
  return value && value.trim() ? value.trim() : "—";
}

function buildHtml(c: CertPayload): string {
  const rows = [
    ["Student Name", fmt(c.student_name)],
    ["ID Number", fmt(c.id_number)],
    ["Course / Qualification", fmt(c.course_name)],
    ["Course Date", fmt(c.course_date)],
    ["Expiry Date", fmt(c.expiry_date)],
    ["Training Provider", fmt(c.issuer_name)],
    ["Certificate Number", fmt(c.certificate_number)],
    ["SAQA ID", fmt(c.saqa_id)],
    ["NQF Level", fmt(c.nqf_level)],
    ["Credits", fmt(c.credits)],
    ["Assessor No.", fmt(c.assessor_no)],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;color:#334155;background:#f8fafc;">${label}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#0f172a;">${value}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New Certificate Issued</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f172a;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">New Certificate Issued</h1>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">A QR code has been generated for the certificate below.</p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
            ${rowsHtml}
          </table>
        </td></tr>
        <tr><td style="padding:0 32px 24px;">
          <p style="margin:0 0 12px;color:#475569;font-size:14px;">Public verification link (embedded in the QR code):</p>
          <p style="margin:0;"><a href="${c.verify_url}" style="color:#059669;font-weight:600;word-break:break-all;">${c.verify_url}</a></p>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;">
          <a href="${c.verify_url}" style="display:inline-block;padding:12px 24px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Certificate</a>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated notification from the IMS College SA certificate system.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as CertPayload;

    if (!payload?.student_name || !payload?.certificate_number || !payload?.verify_url) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = buildHtml(payload);
    const subject = `New Certificate Issued: ${payload.student_name} — ${payload.certificate_number}`;

    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "IMS Certificates <onboarding@resend.dev>",
          to: ADMIN_EMAILS,
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resend error:", errText);
        return new Response(JSON.stringify({ error: "Failed to send email", detail: errText }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.log("RESEND_API_KEY not set — logging notification instead of sending email.");
      console.log("To:", ADMIN_EMAILS.join(", "));
      console.log("Subject:", subject);
      console.log("Verify URL:", payload.verify_url);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
