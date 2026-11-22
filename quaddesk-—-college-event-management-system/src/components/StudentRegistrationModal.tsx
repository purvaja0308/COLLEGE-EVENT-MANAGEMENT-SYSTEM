import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCems } from '../context/CemsContext';
import { CollegeEvent } from '../types/cems';
import { formatDisplayDate } from '../utils/formatters';

interface StudentRegistrationModalProps {
  event: CollegeEvent | null;
  onClose: () => void;
}

interface LivePaymentOrder {
  orderId: string;
  amount: number;
  upiId: string;
  payeeName: string;
  upiUri: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED';
  utrRef?: string;
  expiresAt: number;
}

function formatCountdownMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${m}:${s}`;
}

export function StudentRegistrationModal({
  event,
  onClose,
}: StudentRegistrationModalProps) {
  const { currentStudent, registerStudentForEvent, settings } = useCems();
  const [gmail, setGmail] = useState(currentStudent?.gmail ?? '');
  const [utrInput, setUtrInput] = useState('');
  const [order, setOrder] = useState<LivePaymentOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [error, setError] = useState('');
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const isFree = (event?.registrationFee ?? 0) === 0;

  const generateLiveOrder = useCallback(async () => {
    if (!event || !currentStudent || event.registrationFee === 0) return;
    setOrderLoading(true);
    setError('');
    setUtrInput('');

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventCode: event.code,
          eventTitle: event.title,
          rollNumber: currentStudent.rollNumber,
          studentGmail: currentStudent.gmail,
          amount: event.registrationFee,
          upiId: event.upiId || 'apecaiml@upi',
          payeeName: `${settings.universityName} ${settings.departmentName}`,
        }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        order?: LivePaymentOrder;
      };
      if (!response.ok || !payload.ok || !payload.order) {
        setError(payload.message || 'Could not initialize payment session.');
        return;
      }
      setOrder(payload.order);
      setRemainingMs(Math.max(0, payload.order.expiresAt - Date.now()));
    } catch {
      setError('Unable to connect to the live payment service.');
    } finally {
      setOrderLoading(false);
    }
  }, [event, currentStudent, settings.universityName, settings.departmentName]);

  useEffect(() => {
    setGmail(currentStudent?.gmail ?? '');
    setConfirmedRef(null);
    setError('');
    setUtrInput('');
    setOrder(null);

    if (event && currentStudent && event.registrationFee > 0) {
      void generateLiveOrder();
    }
  }, [event, currentStudent, generateLiveOrder]);

  useEffect(() => {
    if (!order?.orderId) return;
    const source = new EventSource(`/api/payments/stream/${encodeURIComponent(order.orderId)}`);

    source.onmessage = (evt) => {
      try {
        const update = JSON.parse(evt.data) as {
          status?: 'PENDING' | 'PAID' | 'EXPIRED';
          utrRef?: string | null;
          expiresAt?: number;
        };
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: update.status ?? prev.status,
                utrRef: update.utrRef ?? prev.utrRef,
                expiresAt: update.expiresAt ?? prev.expiresAt,
              }
            : prev
        );
      } catch {
        // Ignore malformed frame
      }
    };

    return () => {
      source.close();
    };
  }, [order?.orderId]);

  useEffect(() => {
    if (!order || order.status !== 'PENDING') return;
    const tick = () => {
      const left = Math.max(0, order.expiresAt - Date.now());
      setRemainingMs(left);
      if (left === 0) {
        setOrder((prev) => (prev ? { ...prev, status: 'EXPIRED' } : prev));
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [order?.orderId, order?.status, order?.expiresAt]);

  const upiAppLinks = useMemo(() => {
    if (!order?.upiUri || !order.upiUri.startsWith('upi://pay?')) return null;
    const query = order.upiUri.slice('upi://pay?'.length);
    return {
      chooser: `upi://pay?${query}`,
      gpay: `tez://upi/pay?${query}`,
      phonepe: `phonepe://pay?${query}`,
      paytm: `paytmmp://pay?${query}`,
      bhim: `bhim://upi/pay?${query}`,
    };
  }, [order?.upiUri]);

  if (!event || !currentStudent) return null;

  const handleCopyUpi = async () => {
    const value = order?.upiId || event.upiId || 'apecaiml@upi';
    try {
      await navigator.clipboard.writeText(value);
      setCopiedUpi(true);
      window.setTimeout(() => setCopiedUpi(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isFree) {
      const res = registerStudentForEvent({
        eventId: event.id,
        gmail,
        transactionRef: 'FREE-PASS',
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setConfirmedRef('FREE-PASS');
      return;
    }

    if (!order) {
      setError('Please wait for the payment session to initialize.');
      return;
    }
    if (order.status === 'EXPIRED') {
      setError('Payment session expired. Click New Session to generate a fresh order.');
      return;
    }

    let finalUtr = order.utrRef || utrInput.trim().toUpperCase();
    if (order.status !== 'PAID') {
      if (!finalUtr) {
        setError('Complete your UPI payment and enter the UPI UTR / Transaction ID.');
        return;
      }

      setVerifyingPayment(true);
      try {
        const verifyRes = await fetch('/api/payments/verify-utr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.orderId,
            utrRef: finalUtr,
          }),
        });
        const verifyPayload = (await verifyRes.json()) as {
          ok?: boolean;
          message?: string;
          order?: { utrRef: string; status: 'PAID' };
        };
        if (!verifyRes.ok || !verifyPayload.ok) {
          setError(verifyPayload.message || 'UPI UTR verification failed.');
          setVerifyingPayment(false);
          return;
        }
        finalUtr = verifyPayload.order?.utrRef ?? finalUtr;
      } catch {
        setError('Could not verify payment with the server. Please try again.');
        setVerifyingPayment(false);
        return;
      } finally {
        setVerifyingPayment(false);
      }
    }

    const res = registerStudentForEvent({
      eventId: event.id,
      gmail,
      transactionRef: finalUtr,
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setConfirmedRef(finalUtr);
  };

  const handleFillDemoUtr = () => {
    const digits = String(Math.floor(100000000000 + Math.random() * 899999999999));
    setUtrInput(digits);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-reg-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border border-cyan-400/35 rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden max-h-[92vh] flex flex-col text-slate-100"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 id="student-reg-title" className="font-display text-lg font-bold text-white">
              Event Registration &amp; UPI Payment
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {event.code} · {event.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
            aria-label="Close registration modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedRef ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="font-display text-xl font-bold text-white">
              Registration &amp; Payment Confirmed
            </h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Your seat is reserved for <strong>{event.title}</strong> on{' '}
              <span className="font-mono">{formatDisplayDate(event.date)}</span> at{' '}
              <span className="font-mono">{event.time}</span>.
            </p>
            <div className="p-4 bg-white/[0.04] border border-white/10 rounded-xl text-xs space-y-1.5 text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Student</span>
                <span className="text-white font-medium">
                  {currentStudent.fullName} ({currentStudent.rollNumber})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gmail Receipt</span>
                <span className="text-cyan-300 font-mono">{gmail}</span>
              </div>
              {order && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID</span>
                  <span className="text-slate-200 font-mono">{order.orderId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid</span>
                <span className="text-white font-mono tabular-nums">
                  {isFree ? '₹0 (Free)' : `₹${event.registrationFee}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">UTR / Reference ID</span>
                <span className="text-emerald-300 font-mono">{confirmedRef}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-6 py-2.5 text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {error && (
              <div className="p-3 text-xs text-red-200 bg-red-950/70 border border-red-400/40 rounded-lg">
                {error}
              </div>
            )}

            {/* Event & Fee Summary */}
            <div className="p-4 bg-white/[0.04] border border-white/10 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-400">Timing</div>
                <div className="mt-0.5 font-mono tabular-nums text-white font-medium">
                  {formatDisplayDate(event.date)} · {event.time}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Venue</div>
                <div className="mt-0.5 text-white font-medium truncate">{event.venue}</div>
              </div>
              <div>
                <div className="text-slate-400">Registration Amount</div>
                <div className="mt-0.5 font-mono tabular-nums text-base font-bold text-cyan-300">
                  {isFree ? 'Free (₹0)' : `₹${event.registrationFee}`}
                </div>
              </div>
            </div>

            {/* Gmail Confirmation Input */}
            <div>
              <label
                htmlFor="reg-gmail"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-200 mb-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-cyan-300" />
                <span>Student Gmail for Pass &amp; Receipt</span>
              </label>
              <input
                id="reg-gmail"
                type="email"
                value={gmail}
                onChange={(e) => setGmail(e.target.value)}
                placeholder="student@gmail.com"
                required
                className="w-full px-3.5 py-2.5 text-sm bg-slate-950/80 border border-white/15 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Real-Time UPI Payment Redirect & Uploaded Event QR */}
            {!isFree ? (
              <div className="p-4 bg-white/[0.04] border border-cyan-400/25 rounded-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <Smartphone className="w-4 h-4 text-cyan-300" />
                    <span>Real-Time UPI Payment</span>
                  </div>

                  {order && (
                    <div className="flex items-center gap-2.5 text-xs">
                      <span
                        className={`font-mono tabular-nums inline-flex items-center gap-1 ${
                          order.status === 'PAID'
                            ? 'text-emerald-300'
                            : order.status === 'EXPIRED'
                            ? 'text-red-300'
                            : 'text-cyan-300'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {order.status === 'PAID'
                          ? 'Paid'
                          : order.status === 'EXPIRED'
                          ? 'Expired'
                          : formatCountdownMs(remainingMs)}
                      </span>
                      <button
                        type="button"
                        disabled={orderLoading}
                        onClick={() => void generateLiveOrder()}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-200 bg-white/5 border border-white/15 rounded-lg hover:bg-white/10"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>New Session</span>
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className={`flex flex-col ${
                    event.paymentQrUrl ? 'sm:flex-row items-center' : ''
                  } gap-5`}
                >
                  {/* Show Admin-Uploaded Event QR only if provided */}
                  {event.paymentQrUrl && (
                    <div className="relative p-2.5 bg-white rounded-xl shrink-0 w-[156px] h-[156px] flex items-center justify-center overflow-hidden">
                      <img
                        src={event.paymentQrUrl}
                        alt={`Event payment QR for ₹${event.registrationFee}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  <div className="flex-1 space-y-3 w-full">
                    <div className="text-xs text-slate-300 space-y-1.5">
                      {order && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Order ID</span>
                          <span className="font-mono text-white font-medium">
                            {order.orderId}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">UPI ID</span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="inline-flex items-center gap-1.5 font-mono text-white hover:text-cyan-300"
                        >
                          <span>{order?.upiId || event.upiId || 'apecaiml@upi'}</span>
                          {copiedUpi ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Payable Amount</span>
                        <span className="font-mono tabular-nums font-bold text-cyan-300">
                          ₹{event.registrationFee.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Direct Phone UPI App Redirection */}
                    {orderLoading ? (
                      <div className="py-2.5 text-center text-xs text-slate-400">
                        Initializing live payment session...
                      </div>
                    ) : (
                      upiAppLinks &&
                      order?.status !== 'EXPIRED' && (
                        <div className="space-y-2">
                          <a
                            href={upiAppLinks.chooser}
                            target="_top"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Pay ₹{event.registrationFee} via UPI App</span>
                          </a>

                          <div className="grid grid-cols-4 gap-1.5">
                            <a
                              href={upiAppLinks.gpay}
                              target="_top"
                              rel="noopener noreferrer"
                              className="py-1.5 text-center text-[11px] font-medium text-slate-200 bg-white/5 border border-white/15 hover:border-cyan-400/50 hover:text-cyan-200 rounded-lg transition-colors"
                            >
                              GPay
                            </a>
                            <a
                              href={upiAppLinks.phonepe}
                              target="_top"
                              rel="noopener noreferrer"
                              className="py-1.5 text-center text-[11px] font-medium text-slate-200 bg-white/5 border border-white/15 hover:border-cyan-400/50 hover:text-cyan-200 rounded-lg transition-colors"
                            >
                              PhonePe
                            </a>
                            <a
                              href={upiAppLinks.paytm}
                              target="_top"
                              rel="noopener noreferrer"
                              className="py-1.5 text-center text-[11px] font-medium text-slate-200 bg-white/5 border border-white/15 hover:border-cyan-400/50 hover:text-cyan-200 rounded-lg transition-colors"
                            >
                              Paytm
                            </a>
                            <a
                              href={upiAppLinks.bhim}
                              target="_top"
                              rel="noopener noreferrer"
                              className="py-1.5 text-center text-[11px] font-medium text-slate-200 bg-white/5 border border-white/15 hover:border-cyan-400/50 hover:text-cyan-200 rounded-lg transition-colors"
                            >
                              BHIM
                            </a>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Tap above on your phone to open installed UPI apps with ₹
                            {event.registrationFee} pre-filled, then enter your UTR ID below.
                          </p>
                        </div>
                      )
                    )}

                    {order?.status === 'EXPIRED' && (
                      <div className="p-2.5 bg-red-950/50 border border-red-400/30 rounded-lg flex items-center justify-between gap-2 text-xs">
                        <span className="text-red-200">Payment session expired</span>
                        <button
                          type="button"
                          onClick={() => void generateLiveOrder()}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-400 text-slate-950 rounded-md"
                        >
                          New Session
                        </button>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="upi-ref"
                          className="block text-[11px] font-medium text-slate-300"
                        >
                          Enter UPI UTR / Transaction ID
                        </label>
                        <button
                          type="button"
                          onClick={handleFillDemoUtr}
                          className="text-[11px] text-cyan-300 hover:text-cyan-200 hover:underline"
                        >
                          Generate Test UTR
                        </button>
                      </div>
                      <input
                        id="upi-ref"
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="12-digit UTR (e.g. 432819045612)"
                        required
                        className="w-full px-3 py-2 text-xs font-mono uppercase bg-slate-950/80 border border-white/15 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 text-xs text-emerald-200 bg-emerald-950/40 border border-emerald-400/30 rounded-xl">
                Free registration event (₹0). No payment required.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-white/5 border border-white/15 rounded-xl hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={verifyingPayment || orderLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 rounded-xl transition-all shadow-[0_0_18px_rgba(34,211,238,0.35)] hover:shadow-[0_0_26px_rgba(34,211,238,0.6)]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {verifyingPayment
                    ? 'Verifying Payment...'
                    : isFree
                    ? 'Confirm Registration'
                    : `Verify Payment (₹${event.registrationFee}) & Register`}
                </span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
