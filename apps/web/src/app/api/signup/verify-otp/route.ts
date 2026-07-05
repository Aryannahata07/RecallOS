import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@recallos/shared';

export async function POST(req: Request) {
  try {
    const { name, email, password, otp } = await req.json();

    if (!email || !password || !otp) {
      return NextResponse.json({ error: 'Email, password, and OTP code are required' }, { status: 400 });
    }

    // Verify OTP in database
    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        token: otp,
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    if (record.expires < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
    }

    // Check if user was already created in the meantime
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Hash password and create verified User account
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    // Clean up verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Verify OTP Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
