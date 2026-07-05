import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.EMAIL_FROM || 'RecallOS <onboarding@resend.dev>';

export async function sendOtpEmail(email: string, otp: string) {
  // Always log to terminal in development for fast debugging
  console.log(`\n==================================================`);
  console.log(`[Email Service] 🔑 6-Digit OTP for ${email}: ${otp}`);
  console.log(`==================================================\n`);

  if (!resend) {
    console.warn('[Email Service] RESEND_API_KEY is not configured in .env.local — logged OTP to terminal above.');
    return { success: true, mode: 'console' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [email],
      subject: `🧠 ${otp} is your RecallOS verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background-color: #0a0b0f; color: #e8eaf0; border-radius: 16px; border: 1px solid #252736;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px;">🧠</span>
            <h1 style="font-size: 24px; font-weight: 700; margin: 8px 0 0 0; background: linear-gradient(135deg, #4f8ef7, #9f7aea); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">RecallOS</h1>
          </div>
          
          <h2 style="font-size: 18px; font-weight: 600; text-align: center; margin-bottom: 8px;">Verify your email address</h2>
          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 0; margin-bottom: 24px;">Use the 6-digit code below to complete your RecallOS registration.</p>

          <div style="background-color: #13141a; border: 1px solid #252736; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f8ef7;">${otp}</span>
          </div>

          <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0;">This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('[Email Service] Resend API Error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('[Email Service] Exception sending email:', err);
    return { success: false, error: err.message };
  }
}
