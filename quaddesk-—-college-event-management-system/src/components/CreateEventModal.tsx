import React, { useRef, useState } from 'react';
import { QrCode, Trash2, Upload, X } from 'lucide-react';
import { useCems } from '../context/CemsContext';
import { EventCategory, EventFormat } from '../types/cems';

interface CreateEventModalProps {
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: EventCategory[] = ['Technical', 'Workshop', 'Cultural', 'Seminar', 'Sports'];
const FORMATS: EventFormat[] = ['In-Person', 'Lab Session', 'Auditorium', 'Outdoor'];

const CATEGORY_IMAGE_DEFAULTS: Partial<Record<EventCategory, string>> = {
  Technical: '/src/assets/images/campus_tech_symposium_1795329280116.jpg',
  Workshop: '/src/assets/images/campus_robotics_workshop_1795329280424.jpg',
  Cultural: '/src/assets/images/campus_cultural_auditorium_1795329279952.jpg',
};

export function CreateEventModal({ open, onClose }: CreateEventModalProps) {
  const { createEvent, accent } = useCems();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Technical');
  const [format, setFormat] = useState<EventFormat>('In-Person');
  const [date, setDate] = useState('2026-12-06');
  const [time, setTime] = useState('10:00');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(60);
  const [registrationFee, setRegistrationFee] = useState(150);
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>('');
  const [upiId, setUpiId] = useState('');
  const [creditHours, setCreditHours] = useState(2);
  const [coordinatorName, setCoordinatorName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleCategoryChange = (nextCat: EventCategory) => {
    setCategory(nextCat);
    if (nextCat === 'Workshop') setFormat('Lab Session');
    else if (nextCat === 'Cultural') setFormat('Auditorium');
    else if (nextCat === 'Sports') setFormat('Outdoor');
    else setFormat('In-Person');
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WebP) for the QR code.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        const maxSide = 420;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          setPaymentQrUrl(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          setPaymentQrUrl(dataUrl);
        }
        setError('');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createEvent({
      title,
      category,
      format,
      date,
      time,
      venue,
      capacity,
      registrationFee,
      paymentQrUrl: registrationFee > 0 ? paymentQrUrl : undefined,
      upiId: registrationFee > 0 ? upiId : undefined,
      coordinatorName,
      creditHours,
      description,
      imageUrl: CATEGORY_IMAGE_DEFAULTS[category],
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setTitle('');
    setVenue('');
    setPaymentQrUrl('');
    setUpiId('');
    setCoordinatorName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-event-title"
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2
              id="create-event-title"
              className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Create Department Event
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Publish timing, venue, and registration fee to the Student Portal
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="evt-title"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Event Title
            </label>
            <input
              id="evt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Deep Learning & Neural Vision Symposium"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="evt-category"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="evt-category"
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as EventCategory)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="evt-format"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Event Format
              </label>
              <select
                id="evt-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as EventFormat)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="evt-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Date
              </label>
              <input
                id="evt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="evt-time"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Start Time
              </label>
              <input
                id="evt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="evt-fee"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Registration Fee (₹)
              </label>
              <input
                id="evt-fee"
                type="number"
                min={0}
                max={50000}
                value={registrationFee}
                onChange={(e) => setRegistrationFee(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {registrationFee > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <QrCode className="w-4 h-4 text-blue-600 dark:text-cyan-300" />
                  <span>Payment QR Code for Collecting ₹{registrationFee}</span>
                </div>
                {paymentQrUrl && (
                  <button
                    type="button"
                    onClick={() => setPaymentQrUrl('')}
                    className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove QR</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-24 h-24 shrink-0 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  {paymentQrUrl ? (
                    <img
                      src={paymentQrUrl}
                      alt="Event payment QR preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <QrCode className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                  )}
                </div>

                <div className="flex-1 space-y-2.5 w-full">
                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleQrUpload}
                    className="hidden"
                    aria-label="Insert payment QR code image"
                  />
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{paymentQrUrl ? 'Replace QR Image' : 'Insert QR Code Image'}</span>
                  </button>

                  <div>
                    <label
                      htmlFor="evt-upi"
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      UPI ID (Optional, shown in Student Portal)
                    </label>
                    <input
                      id="evt-upi"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="apecaiml@upi"
                      className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Upload your GPay/PhonePe/UPI QR image for this event. If left empty, a
                default payment QR is generated automatically.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="evt-venue"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Campus Venue
              </label>
              <input
                id="evt-venue"
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="AIML Seminar Hall, Block C"
                required
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="evt-capacity"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Capacity
              </label>
              <input
                id="evt-capacity"
                type="number"
                min={1}
                max={2000}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="evt-credits"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Credits
              </label>
              <input
                id="evt-credits"
                type="number"
                min={1}
                max={10}
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="evt-coord"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Faculty / Event Coordinator
            </label>
            <input
              id="evt-coord"
              type="text"
              value={coordinatorName}
              onChange={(e) => setCoordinatorName(e.target.value)}
              placeholder="Dr. Kavitha R. / AIML Coordinator"
              required
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="evt-desc"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Event Description
            </label>
            <textarea
              id="evt-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline schedule, prerequisites, or competition guidelines."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${accent.primaryBtn}`}
            >
              Publish Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
