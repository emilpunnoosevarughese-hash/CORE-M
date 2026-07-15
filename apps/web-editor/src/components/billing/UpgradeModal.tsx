import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, QrCode, Clock, AlertCircle } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);
  const [utr, setUtr] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      setTimeLeft(300);
      setIsExpired(false);
      setUtr('');
      setSubmitStatus('idle');
      return;
    }

    if (isExpired || submitStatus === 'success') return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isExpired, submitStatus]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitUtr = () => {
    if (utr.trim().length < 12) {
      alert("Please enter a valid 12-digit UTR number.");
      return;
    }
    
    setSubmitStatus('submitting');
    
    // Simulate API call to save UTR to Firebase
    setTimeout(() => {
      setSubmitStatus('success');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-black flex items-center justify-center">
              <img src="/about-logo.png" alt="CORE M" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold">Upgrade to Pro</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-foreground/60 hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          
          {submitStatus === 'success' ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Payment Submitted!</h3>
              <p className="text-foreground/70 text-sm mb-6">
                Your UTR has been recorded. Your account will be upgraded to Pro within 12-24 hours upon verification.
              </p>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <>
              {/* Price */}
              <div className="text-center mb-6">
                <div className="text-4xl font-black text-primary mb-2">₹49<span className="text-lg font-normal text-foreground/50">/lifetime</span></div>
                <p className="text-foreground/70 text-sm">Unlock the full potential of CORE M Cloud.</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8 bg-black/20 p-4 rounded-lg border border-border/50">
                {[
                  'Unlimited Video Projects',
                  '4K & 60fps Export Quality',
                  '100GB Cloud Storage',
                  'Advanced AI Tools Access',
                  'Priority Team Collaboration'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                    <span className="text-sm font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center bg-white p-6 rounded-xl text-black relative">
                
                {isExpired ? (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle size={48} className="text-red-500 mb-4" />
                    <h3 className="font-bold text-xl mb-2">Session Expired</h3>
                    <p className="text-sm text-gray-600 mb-4">You took too long to complete the payment. Please try again.</p>
                    <button 
                      onClick={() => {
                        setTimeLeft(300);
                        setIsExpired(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : null}

                <div className="flex items-center justify-between w-full mb-4">
                  <div className="flex items-center gap-2 font-bold">
                    <QrCode size={20} className="text-black" />
                    <span>Pay via UPI</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-gray-600'}`}>
                    <Clock size={16} />
                    {formatTime(timeLeft)}
                  </div>
                </div>
                
                <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-gray-300 rounded-lg relative overflow-hidden mb-6">
                  {/* Fallback placeholder QR. User can replace the src later. */}
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=emilpunnoosevarughese@okhdfcbank&pn=CoreM&cu=INR&am=49.00" 
                    alt="UPI QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* UTR Input Form */}
                <div className="w-full">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Enter 12-Digit UTR Number</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 312345678901"
                      maxLength={12}
                      value={utr}
                      onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={handleSubmitUtr}
                      disabled={submitStatus === 'submitting' || utr.length < 12}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                    >
                      {submitStatus === 'submitting' ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
