import { NextResponse } from 'next/server';
import { prisma } from '@recallos/shared';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert verification token in Prisma
    await prisma.verificationToken.upsert({
      where: { identifier_token: { identifier: email, token: otp } },
      update: { expires },
      create: {
        identifier: email,
        token: otp,
        expires,
      },
    });

    // Send email via Resend
    const mailResult = await sendOtpEmail(email, otp);

    if (!mailResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Development Fallback] Failed to send email via Resend: ${mailResult.error}. Bypassing since we are in dev mode.`);
        return NextResponse.json({ success: true, message: 'OTP generated (read from console logs)' });
      }
      return NextResponse.json({ error: `Failed to send email: ${mailResult.error}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully' });
  } catch (error: any) {
    console.error('[API] Send OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
