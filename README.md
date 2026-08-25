# Cert Verify

A certificate issuance and QR verification system built with Vite + React + TypeScript, Tailwind CSS, and Supabase.

## Features

- **Admin dashboard** — sign in to issue, search, revoke, restore, and delete certificates.
- **PDF auto-fill** — upload a certificate PDF to extract fields automatically.
- **QR code generation** — each certificate gets a QR code linking to a public verification page.
- **Public verification page** — anyone scanning a QR code sees whether the certificate is valid, expired, or revoked.
- **Email notifications** — admins receive an email when a certificate is issued (via Resend).

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + Lucide React icons
- Supabase (Postgres, Auth, Edge Functions)
- `qrcode` for QR generation, `pdfjs-dist` for PDF text extraction
