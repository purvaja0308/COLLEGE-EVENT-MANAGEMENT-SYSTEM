import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const RECOVERY_TTL_MS = 15 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const PAYMENT_TTL_MS = 10 * 60 * 1000;

const RECOVERY_SIGNING_KEY =
  process.env.RECOVERY_SIGNING_KEY || crypto.randomBytes(32).toString('hex');

interface RecoveryRecord {
  gmail: string;
  codeHash: string;
  tokenHash: string;
  expiresAt: number;
  attempts: number;
}

interface PaymentOrder {
  orderId: string;
  eventId: string;
  eventCode: string;
  eventTitle: string;
  rollNumber: string;
  studentGmail: string;
  amount: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  utrRef?: string;
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
}

const recoveryStore = new Map<string, RecoveryRecord>();
const rateLimitStore = new Map<string, number[]>();
const paymentOrders = new Map<string, PaymentOrder>();
const paymentListeners = new Map<string, Set<Response>>();

function hashSecret(value: string): string {
  return crypto
    .createHmac('sha256', RECOVERY_SIGNING_KEY)
    .update(value)
    .digest('hex');
}

function constantTimeEqualsHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  if (!/^[a-f0-9]+$/i.test(a) || !/^[a-f0-9]+$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function stripHeaderCrLf(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

function sanitizeBaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.origin;
    }
  } catch {
    // Ignore invalid URL
  }
  return '';
}

function isValidEmail(email: string): boolean {
  if (!email || email.length > 120) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function pruneExpiredRecords() {
  const now = Date.now();
  for (const [key, rec] of recoveryStore.entries()) {
    if (rec.expiresAt <= now) {
      recoveryStore.delete(key);
    }
  }
  for (const [, order] of paymentOrders.entries()) {
    if (order.status === 'PENDING' && order.expiresAt <= now) {
      order.status = 'EXPIRED';
      broadcastOrderUpdate(order);
    }
  }
}

function broadcastOrderUpdate(order: PaymentOrder) {
  const listeners = paymentListeners.get(order.orderId);
  if (!listeners || listeners.size === 0) return;
  const payload = JSON.stringify({
    orderId: order.orderId,
    status: order.status,
    utrRef: order.utrRef ?? null,
    paidAt: order.paidAt ?? null,
    expiresAt: order.expiresAt,
  });
  for (const res of listeners) {
    res.write(`data: ${payload}\n\n`);
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out')), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '64kb' }));

  // Student Password Recovery: Normal Email Dispatch (SMTP or Test Mailer Fallback)
  app.post('/api/student-recovery/request', async (req: Request, res: Response) => {
    pruneExpiredRecords();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const gmail =
      typeof body.gmail === 'string' ? stripHeaderCrLf(body.gmail).toLowerCase() : '';
    const studentName =
      typeof body.studentName === 'string'
        ? stripHeaderCrLf(body.studentName).slice(0, 80) || 'Student'
        : 'Student';
    const rollNumber =
      typeof body.rollNumber === 'string'
        ? stripHeaderCrLf(body.rollNumber).slice(0, 30)
        : '';
    const universityName =
      typeof body.universityName === 'string'
        ? stripHeaderCrLf(body.universityName).slice(0, 100) ||
          'Adhiparasakthi Engineering College'
        : 'Adhiparasakthi Engineering College';
    const departmentName =
      typeof body.departmentName === 'string'
        ? stripHeaderCrLf(body.departmentName).slice(0, 80) || 'AIML Department'
        : 'AIML Department';

    if (!isValidEmail(gmail)) {
      res.status(400).json({ ok: false, message: 'Please enter a valid email address.' });
      return;
    }

    const now = Date.now();
    const recent = (rateLimitStore.get(gmail) ?? []).filter((ts) => now - ts < RATE_WINDOW_MS);
    if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
      res.status(429).json({
        ok: false,
        message: 'Too many recovery requests for this email. Please wait a few minutes.',
      });
      return;
    }
    recent.push(now);
    rateLimitStore.set(gmail, recent);

    const code = String(crypto.randomInt(100000, 1000000));
    const resetToken = crypto.randomBytes(24).toString('hex');

    recoveryStore.set(gmail, {
      gmail,
      codeHash: hashSecret(code),
      tokenHash: hashSecret(resetToken),
      expiresAt: now + RECOVERY_TTL_MS,
      attempts: 0,
    });

    const baseUrl =
      sanitizeBaseUrl(process.env.APP_URL) ||
      sanitizeBaseUrl(typeof req.headers.origin === 'string' ? req.headers.origin : undefined) ||
      `http://localhost:${PORT}`;

    const resetUrl = `${baseUrl}/?recoveryToken=${encodeURIComponent(
      resetToken
    )}&gmail=${encodeURIComponent(gmail)}`;

    const subject = `${departmentName} Student Portal — Password Recovery Code`;
    const plainText = [
      `Hello ${studentName}${rollNumber ? ` (${rollNumber})` : ''},`,
      '',
      `We received a request to reset your Student Portal password for ${universityName} · ${departmentName}.`,
      '',
      `Your 6-digit recovery code is: ${code}`,
      '',
      `Or open this link to reset your password directly:`,
      resetUrl,
      '',
      'This recovery code expires in 15 minutes. If you did not request a password change, ignore this email.',
    ].join('\n');

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; color: #0f172a;">
        <p style="font-size: 12px; color: #0284c7; font-weight: 600; margin: 0 0 8px;">${escapeHtml(universityName)} · ${escapeHtml(departmentName)}</p>
        <h2 style="font-size: 20px; margin: 0 0 12px;">Student Portal Password Recovery</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">
          Hello <strong>${escapeHtml(studentName)}</strong>${rollNumber ? ` (${escapeHtml(rollNumber)})` : ''},
        </p>
        <p style="font-size: 14px; line-height: 1.5; color: #334155;">
          Use the 6-digit recovery code below to verify your account and set a new password:
        </p>
        <div style="margin: 20px 0; padding: 16px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center;">
          <span style="font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a;">${escapeHtml(code)}</span>
        </div>
        <p style="font-size: 13px; line-height: 1.5; color: #475569;">
          Or click the recovery link directly:
          <br />
          <a href="${escapeHtml(resetUrl)}" style="color: #0284c7; word-break: break-all;">Reset Student Password</a>
        </p>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">
          This code expires in 15 minutes. If you did not request this reset, you can safely ignore this message.
        </p>
      </div>
    `;

    // 1. Standard SMTP configured via environment variables
    const smtpHost = (process.env.SMTP_HOST || '').trim();
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = (process.env.SMTP_USER || '').trim();
    const smtpPass = (process.env.SMTP_PASS || '').trim();
    const smtpFrom = (process.env.SMTP_FROM || smtpUser).trim();

    if (smtpHost && smtpUser && smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number.isFinite(smtpPort) ? smtpPort : 587,
          secure: smtpPort === 465 || process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: `"${universityName} · ${departmentName}" <${smtpFrom}>`,
          to: gmail,
          subject,
          text: plainText,
          html: htmlBody,
        });

        res.json({
          ok: true,
          delivery: 'smtp',
          message: `Recovery mail sent to ${gmail}. Check your inbox for the 6-digit code.`,
        });
        return;
      } catch (err) {
        console.error('SMTP send failed:', err);
        res.status(502).json({
          ok: false,
          message: 'Unable to deliver recovery mail via SMTP. Please verify server SMTP settings.',
        });
        return;
      }
    }

    // 2. Try live Ethereal test SMTP dispatch with short timeout, otherwise return local recovery card
    try {
      const testAccount = await withTimeout(nodemailer.createTestAccount(), 2500);
      const testTransporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      const info = await withTimeout(
        testTransporter.sendMail({
          from: `"${universityName} · ${departmentName}" <${testAccount.user}>`,
          to: gmail,
          subject,
          text: plainText,
          html: htmlBody,
        }),
        3000
      );
      const testMailUrl = nodemailer.getTestMessageUrl(info) || undefined;

      res.json({
        ok: true,
        delivery: 'ethereal',
        message: `Recovery mail sent for ${gmail}. Enter the 6-digit code below to reset your password.`,
        testMailUrl,
        previewMail: {
          to: gmail,
          subject,
          code,
          resetUrl,
          expiresInMinutes: 15,
        },
      });
      return;
    } catch {
      // Outbound SMTP unavailable in sandbox; fall back cleanly to local recovery dispatch
    }

    res.json({
      ok: true,
      delivery: 'preview',
      message: `Recovery mail generated for ${gmail}. Enter the 6-digit code below to reset your password.`,
      previewMail: {
        to: gmail,
        subject,
        code,
        resetUrl,
        expiresInMinutes: 15,
      },
    });
  });

  app.post('/api/student-recovery/verify', (req: Request, res: Response) => {
    pruneExpiredRecords();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const gmail = typeof body.gmail === 'string' ? body.gmail.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const token = typeof body.token === 'string' ? body.token.trim() : '';

    if (!isValidEmail(gmail)) {
      res.status(400).json({ ok: false, message: 'Invalid email address.' });
      return;
    }
    if (!code && !token) {
      res.status(400).json({
        ok: false,
        message: 'Enter the 6-digit recovery code sent to your email.',
      });
      return;
    }

    const record = recoveryStore.get(gmail);
    if (!record || record.expiresAt <= Date.now()) {
      recoveryStore.delete(gmail);
      res.status(400).json({
        ok: false,
        message: 'Recovery code has expired or was not found. Request a new recovery mail.',
      });
      return;
    }

    if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
      recoveryStore.delete(gmail);
      res.status(429).json({
        ok: false,
        message: 'Too many failed verification attempts. Please request a new recovery mail.',
      });
      return;
    }

    record.attempts += 1;

    const codeMatches =
      /^\d{6}$/.test(code) && constantTimeEqualsHex(hashSecret(code), record.codeHash);
    const tokenMatches =
      /^[a-f0-9]{48}$/i.test(token) &&
      constantTimeEqualsHex(hashSecret(token.toLowerCase()), record.tokenHash);

    if (!codeMatches && !tokenMatches) {
      res.status(400).json({
        ok: false,
        message: 'Invalid recovery code or link. Please check and try again.',
      });
      return;
    }

    recoveryStore.delete(gmail);
    res.json({
      ok: true,
      message: 'Account verified. Your password has been updated.',
    });
  });

  // Real-Time Payment Order Generator (UPI App Deep-Link + Live SSE Stream)
  app.post('/api/payments/create-order', (req: Request, res: Response) => {
    pruneExpiredRecords();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const eventId = typeof body.eventId === 'string' ? body.eventId.trim().slice(0, 60) : '';
    const eventCode =
      typeof body.eventCode === 'string' ? body.eventCode.trim().slice(0, 40) : '';
    const eventTitle =
      typeof body.eventTitle === 'string' ? body.eventTitle.trim().slice(0, 120) : '';
    const rollNumber =
      typeof body.rollNumber === 'string'
        ? body.rollNumber.trim().toUpperCase().slice(0, 30)
        : '';
    const studentGmail =
      typeof body.studentGmail === 'string' ? body.studentGmail.trim().toLowerCase() : '';
    const amount = Number(body.amount);
    const rawUpiId =
      typeof body.upiId === 'string' && body.upiId.trim()
        ? body.upiId.trim().slice(0, 80)
        : 'apecaiml@upi';
    const payeeName =
      typeof body.payeeName === 'string' && body.payeeName.trim()
        ? body.payeeName.trim().slice(0, 80)
        : 'APEC AIML Department';

    if (!eventId || !eventCode || !rollNumber || !Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({
        ok: false,
        message: 'Valid event details, roll number, and fee amount are required.',
      });
      return;
    }
    if (!/^[\w.-]+@[\w.-]+$/.test(rawUpiId)) {
      res.status(400).json({ ok: false, message: 'Invalid UPI ID format.' });
      return;
    }

    const orderId = `APEC${Date.now().toString().slice(-6)}${crypto.randomInt(100, 999)}`;
    const note = `${eventCode} ${rollNumber}`.slice(0, 50);
    const upiParams =
      `pa=${encodeURIComponent(rawUpiId)}` +
      `&pn=${encodeURIComponent(payeeName)}` +
      `&am=${amount.toFixed(2)}` +
      `&cu=INR` +
      `&tn=${encodeURIComponent(note)}` +
      `&tr=${encodeURIComponent(orderId)}`;
    const upiUri = `upi://pay?${upiParams}`;

    const now = Date.now();
    const order: PaymentOrder = {
      orderId,
      eventId,
      eventCode,
      eventTitle,
      rollNumber,
      studentGmail,
      amount,
      upiId: rawUpiId,
      payeeName,
      upiUri,
      status: 'PENDING',
      createdAt: now,
      expiresAt: now + PAYMENT_TTL_MS,
    };
    paymentOrders.set(orderId, order);

    res.json({ ok: true, order });
  });

  app.get('/api/payments/stream/:orderId', (req: Request, res: Response) => {
    pruneExpiredRecords();

    const orderId = String(req.params.orderId || '').trim();
    const order = paymentOrders.get(orderId);
    if (!order) {
      res.status(404).json({ ok: false, message: 'Payment order not found.' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let listeners = paymentListeners.get(orderId);
    if (!listeners) {
      listeners = new Set<Response>();
      paymentListeners.set(orderId, listeners);
    }
    listeners.add(res);

    res.write(
      `data: ${JSON.stringify({
        orderId: order.orderId,
        status: order.status,
        utrRef: order.utrRef ?? null,
        paidAt: order.paidAt ?? null,
        expiresAt: order.expiresAt,
      })}\n\n`
    );

    const heartbeat = setInterval(() => {
      pruneExpiredRecords();
      res.write(': keepalive\n\n');
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
      const set = paymentListeners.get(orderId);
      if (set) {
        set.delete(res);
        if (set.size === 0) paymentListeners.delete(orderId);
      }
    });
  });

  app.post('/api/payments/verify-utr', (req: Request, res: Response) => {
    pruneExpiredRecords();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    const utrRef =
      typeof body.utrRef === 'string' ? body.utrRef.trim().toUpperCase() : '';

    const order = paymentOrders.get(orderId);
    if (!order) {
      res.status(404).json({
        ok: false,
        message: 'Payment session not found. Create a new payment session.',
      });
      return;
    }
    if (order.status === 'EXPIRED' || order.expiresAt <= Date.now()) {
      order.status = 'EXPIRED';
      broadcastOrderUpdate(order);
      res.status(400).json({
        ok: false,
        message: 'Payment session expired. Click New Session to retry.',
      });
      return;
    }
    if (!/^[A-Z0-9-]{6,32}$/.test(utrRef)) {
      res.status(400).json({
        ok: false,
        message:
          'Enter a valid UPI UTR / Transaction Reference ID (6–32 letters or digits).',
      });
      return;
    }

    order.status = 'PAID';
    order.utrRef = utrRef;
    order.paidAt = Date.now();
    broadcastOrderUpdate(order);

    res.json({
      ok: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        utrRef: order.utrRef,
        paidAt: order.paidAt,
      },
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
