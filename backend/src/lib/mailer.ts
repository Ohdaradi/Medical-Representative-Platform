import nodemailer from 'nodemailer';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[mailer] SMTP credentials not configured — emails will not be sent. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

/**
 * Sends an email. Returns true on success, false if SMTP is not configured or delivery fails.
 * Throws on configuration errors so the caller can handle them.
 */
export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  const transport = createTransport();

  if (!transport) {
    // SMTP not configured — log and skip silently in dev
    console.log(`[mailer] Would send to ${options.to}: ${options.subject}\n${options.text}`);
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || `<p>${options.text.replace(/\n/g, '<br/>')}</p>`
    });
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send email:', err);
    return false;
  }
}

/**
 * Sends an OTP code email for registration or password reset.
 * Returns true if the email was delivered successfully.
 * Returns false if SMTP is not configured (development fallback).
 * Throws if the email address is clearly invalid at the transport level.
 */
export async function sendOtpEmail(to: string, code: string, purpose: 'registration' | 'password-reset'): Promise<boolean> {
  const subject = purpose === 'registration'
    ? 'ITER Pharmaceuticals — Email Verification Code'
    : 'ITER Pharmaceuticals — Password Reset Code';

  const action = purpose === 'registration'
    ? 'complete your account registration'
    : 'reset your password';

  const text = [
    `Your ITER Pharmaceuticals verification code is: ${code}`,
    '',
    `Use this code to ${action}. It expires in 15 minutes.`,
    '',
    'If you did not request this, please ignore this email.',
    '',
    '— ITER Pharmaceuticals Security Team'
  ].join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fbfe; border-radius: 16px;">
      <div style="background: linear-gradient(135deg, #0f766e, #0c4a6e); color: #fff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em;">ITER Pharmaceuticals</h1>
        <p style="margin: 6px 0 0; opacity: 0.85; font-size: 0.9rem;">Medical Representative Platform</p>
      </div>
      <h2 style="margin: 0 0 8px; font-size: 1.1rem; color: #10233d;">Your Verification Code</h2>
      <p style="color: #5d6b82; margin: 0 0 20px; line-height: 1.6;">Use the code below to ${action}. It expires in <strong>15 minutes</strong>.</p>
      <div style="background: #fff; border: 2px solid rgba(15,118,110,0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 2.4rem; font-weight: 800; letter-spacing: 0.3em; color: #0f766e;">${code}</span>
      </div>
      <p style="color: #5d6b82; font-size: 0.88rem; margin: 0; line-height: 1.6;">If you did not request this, you can safely ignore this email. Do not share this code with anyone.</p>
    </div>
  `;

  return sendMail({ to, subject, text, html });
}
