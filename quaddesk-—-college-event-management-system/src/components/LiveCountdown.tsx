import { useEffect, useState } from 'react';
import { useCems } from '../context/CemsContext';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function computeTimeLeft(targetIso: string): TimeLeft {
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: false };
  }
  const diff = target - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

interface LiveCountdownProps {
  compact?: boolean;
}

export function LiveCountdown({ compact = false }: LiveCountdownProps) {
  const { settings } = useCems();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    computeTimeLeft(settings.festDateTime)
  );

  useEffect(() => {
    setTimeLeft(computeTimeLeft(settings.festDateTime));
    const timer = window.setInterval(() => {
      setTimeLeft(computeTimeLeft(settings.festDateTime));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [settings.festDateTime]);

  const blocks = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 font-mono text-xs tabular-nums text-cyan-200 bg-white/5 border border-cyan-400/25 rounded-lg px-3 py-1.5 backdrop-blur-md">
        <span className="text-slate-300 font-sans font-medium">{settings.festName}:</span>
        {timeLeft.expired ? (
          <span className="text-emerald-300 font-semibold">Fest Day Live</span>
        ) : (
          <span>
            {String(timeLeft.days).padStart(2, '0')}d :{' '}
            {String(timeLeft.hours).padStart(2, '0')}h :{' '}
            {String(timeLeft.minutes).padStart(2, '0')}m :{' '}
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium tracking-wide text-cyan-300 text-center">
        {timeLeft.expired
          ? `${settings.festName} is Underway`
          : `Countdown to ${settings.festName}`}
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-lg mx-auto">
        {blocks.map((item) => (
          <div
            key={item.label}
            className="bg-white/[0.06] backdrop-blur-xl border border-cyan-400/25 rounded-xl py-3.5 px-2 text-center shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-0.5 hover:border-cyan-300/50"
          >
            <div className="font-mono text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-[11px] font-medium text-slate-300">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
