import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, Clock, XCircle, Loader2, ImageIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const METHOD_LABELS = {
  bank_transfer: 'Bank Transfer',
  promptpay: 'PromptPay',
  cash: 'Cash',
  other: 'Other',
};

export default function PaymentUpload({ registration, category }) {
  const queryClient = useQueryClient();
  const [method, setMethod] = useState('bank_transfer');
  const [slipPreview, setSlipPreview] = useState(null);
  const [slipUrl, setSlipUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch existing payment for this registration
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payment', registration.id],
    queryFn: () => base44.entities.EventPayment.filter({ registration_id: registration.id }),
  });
  const existingPayment = payments[0] || null;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (existingPayment) {
        // Re-upload: update existing payment back to pending
        await base44.entities.EventPayment.update(existingPayment.id, {
          slip_image: slipUrl,
          method,
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          admin_note: null,
        });
      } else {
        await base44.entities.EventPayment.create({
          registration_id: registration.id,
          event_id: registration.event_id,
          user_email: registration.user_email,
          amount: category?.price || 0,
          method,
          slip_image: slipUrl,
          status: 'pending',
        });
      }
    },
    onSuccess: () => {
      setSlipPreview(null);
      setSlipUrl('');
      queryClient.invalidateQueries({ queryKey: ['payment', registration.id] });
      queryClient.invalidateQueries({ queryKey: ['all-payments-admin'] });
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setSlipPreview(URL.createObjectURL(file));
    const result = await base44.integrations.Core.UploadFile({ file });
    setSlipUrl(result.file_url);
    setIsUploading(false);
  };

  if (isLoading) return null;

  // Free category — no payment needed
  if (category?.price === 0) return null;

  // Approved payment
  if (existingPayment?.status === 'approved') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,210,110,0.08)', border: '1px solid rgba(0,210,110,0.2)' }}>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: 'rgb(0,210,110)' }} />
        <div>
          <p className="text-xs font-bold" style={{ color: 'rgb(0,210,110)' }}>Payment Approved</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>฿{existingPayment.amount} · {METHOD_LABELS[existingPayment.method]}</p>
        </div>
      </div>
    );
  }

  // Pending review
  if (existingPayment?.status === 'pending') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,200,80,0.08)', border: '1px solid rgba(255,200,80,0.2)' }}>
        <Clock className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,200,80,1)' }} />
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: 'rgba(255,200,80,1)' }}>Payment Under Review</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>฿{existingPayment.amount} · Submitted {format(new Date(existingPayment.created_date), 'MMM d')}</p>
        </div>
        {existingPayment.slip_image && (
          <a href={existingPayment.slip_image} target="_blank" rel="noreferrer">
            <img src={existingPayment.slip_image} alt="slip" className="w-10 h-10 rounded-lg object-cover" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
          </a>
        )}
      </div>
    );
  }

  // Rejected — show error + allow re-upload
  const showRejectBanner = existingPayment?.status === 'rejected';

  return (
    <div className="space-y-3">
      {showRejectBanner && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)' }}>
          <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,100,100,1)' }} />
          <div>
            <p className="text-xs font-bold" style={{ color: 'rgba(255,100,100,1)' }}>Payment Rejected</p>
            {existingPayment.admin_note && <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{existingPayment.admin_note}</p>}
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Please re-upload your payment slip.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {showRejectBanner ? 'Re-upload Payment Slip' : 'Upload Payment Slip'}
          </p>
          <p className="text-sm font-bold text-white">฿{category?.price?.toLocaleString()}</p>
        </div>

        <div className="px-4 py-3 space-y-3">
          {/* Method */}
          <div className="flex gap-2 flex-wrap">
            {Object.entries(METHOD_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMethod(val)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                style={method === val
                  ? { background: '#BFFF00', color: '#0A0A0A' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {/* Slip upload */}
          {slipPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ height: 120 }}>
              <img src={slipPreview} alt="slip preview" className="w-full h-full object-cover" />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              {!isUploading && (
                <button
                  onClick={() => { setSlipPreview(null); setSlipUrl(''); }}
                  className="absolute top-2 right-2 text-xs px-2 py-1 rounded-lg font-bold"
                  style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer" style={{ background: 'rgba(191,255,0,0.04)', border: '1px dashed rgba(191,255,0,0.2)', height: 80 }}>
              <ImageIcon className="w-5 h-5" style={{ color: 'rgba(191,255,0,0.3)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to upload slip</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}

          <button
            onClick={() => submitMutation.mutate()}
            disabled={!slipUrl || isUploading || submitMutation.isPending}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            style={slipUrl && !isUploading
              ? { background: '#BFFF00', color: '#0A0A0A' }
              : { background: 'rgba(191,255,0,0.15)', color: 'rgba(255,255,255,0.3)' }
            }
          >
            {submitMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Upload className="w-4 h-4" /> Submit Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
}