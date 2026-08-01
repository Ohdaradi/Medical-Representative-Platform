import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { validatePasswordStrength } from '../lib/validation.js';
import { sendOtpEmail } from '../lib/mailer.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email, role: user.role },
    process.env.JWT_SECRET || 'devsecret',
    { expiresIn: '8h' }
  );

  await prisma.auditLog.create({
    data: {
      action: 'login',
      entity: 'user',
      details: `User ${email} signed in`,
      userEmail: email
    }
  });

  return res.json({ token, user: { id: user.id, fullName: user.fullName, email, role: user.role } });
});

router.post('/register', async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return res.status(400).json({ message: strength.errors.join(' ') });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.registrationRequest.upsert({
    where: { email },
    update: { fullName: fullName || null, password: hashedPassword, role: role || 'rep', code, expiresAt },
    create: { email, fullName: fullName || null, password: hashedPassword, role: role || 'rep', code, expiresAt }
  });

  // Actually send the OTP to the provided email address
  const delivered = await sendOtpEmail(email, code, 'registration');

  if (!delivered) {
    // If email delivery fails (invalid address, SMTP error, etc.) roll back and reject
    await prisma.registrationRequest.delete({ where: { email } }).catch(() => undefined);
    return res.status(422).json({ message: 'Could not deliver the verification email. Please check that the email address is valid and try again.' });
  }

  // Log in notification queue for audit trail
  await prisma.notification.create({
    data: {
      channel: 'email',
      recipient: email,
      subject: 'Registration Verification Code',
      body: `Your registration code is ${code}. It expires in 15 minutes.`,
      status: delivered ? 'sent' : 'failed'
    }
  });

  // Never expose the OTP in the API response — it must arrive via email only
  res.json({ message: 'A verification code has been sent to your email address. Please check your inbox.' });
});

router.post('/verify-registration', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  const reqData = await prisma.registrationRequest.findUnique({ where: { email } });
  
  if (!reqData || reqData.code !== code || reqData.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Invalid or expired verification code' });
  }

  await prisma.user.create({
    data: {
      email: reqData.email,
      fullName: reqData.fullName,
      password: reqData.password,
      role: reqData.role
    }
  });

  await prisma.registrationRequest.delete({ where: { email } });

  await prisma.auditLog.create({
    data: {
      action: 'register',
      entity: 'user',
      details: `User ${email} verified and created`,
      userEmail: email
    }
  });

  res.json({ message: 'Account successfully created' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email, code, expiresAt }
  });

  // Actually send the OTP to the registered email address
  const delivered = await sendOtpEmail(email, code, 'password-reset');

  if (!delivered) {
    return res.status(422).json({ message: 'Could not deliver the reset email. Please check that the email address is correct and try again.' });
  }

  await prisma.notification.create({
    data: {
      channel: 'email',
      recipient: email,
      subject: 'Password Reset Code',
      body: `Your reset code is ${code}. It expires in 15 minutes.`,
      status: delivered ? 'sent' : 'failed'
    }
  });

  await prisma.auditLog.create({
    data: {
      action: 'password_reset_requested',
      entity: 'user',
      details: `Password reset requested for ${email}`,
      userEmail: email
    }
  });

  // Never expose the OTP in the API response — it must arrive via email only
  res.json({ message: 'A password reset code has been sent to your email address.' });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.status(400).json({ message: 'Email, code, and password are required' });
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: {
      email,
      code,
      usedAt: null,
      expiresAt: { gt: new Date() }
    }
  });

  if (!token) {
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });

  await prisma.passwordResetToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() }
  });

  await prisma.auditLog.create({
    data: {
      action: 'password_reset',
      entity: 'user',
      details: `Password reset completed for ${email}`,
      userEmail: email
    }
  });

  res.json({ message: 'Password reset successful' });
});

router.post('/logout', async (req, res) => {
  const { email } = req.body;
  if (email) {
    await prisma.auditLog.create({
      data: {
        action: 'logout',
        entity: 'user',
        details: `User ${email} signed out`,
        userEmail: email
      }
    });
  }
  res.json({ message: 'Logged out' });
});

// Change password (authenticated)
router.post('/change-password', authenticateToken, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new passwords are required' });
  }
  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    return res.status(400).json({ message: strength.errors.join(' ') });
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });
  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await prisma.auditLog.create({
    data: { action: 'password_changed', entity: 'user', details: `Password changed for ${user.email}`, userEmail: user.email }
  });
  return res.json({ message: 'Password updated successfully' });
});

export default router;
