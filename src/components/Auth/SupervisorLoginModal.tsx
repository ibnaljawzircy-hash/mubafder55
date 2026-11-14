import React, { useState } from 'react';
import { Lock, Shield, X } from 'lucide-react';

interface SupervisorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SUPERVISOR_PIN = '320320*';

export const SupervisorLoginModal: React.FC<SupervisorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === SUPERVISOR_PIN) {
      setError(false);
      setPin('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-3xl max-w-sm w-full p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center mx-auto mb-4 border border-black/[0.04]">
          <Lock className="w-5 h-5 text-[#1d1d1f]" />
        </div>

        <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
          لوحة تحكم المشرف
        </h3>
        <p className="text-[13px] text-[#86868b] mt-1 leading-relaxed">
          أدخل الرقم السري المعتمد للوصول إلى إدارة الحضور والتقارير
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <input
              type="password"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(false);
              }}
              placeholder="الرقم السري"
              className={`w-full px-4 py-3 text-center text-lg tracking-widest font-mono bg-[#f5f5f7] border rounded-2xl focus:outline-none transition-all ${
                error
                  ? 'border-red-500 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-200'
                  : 'border-black/[0.08] focus:border-[#0071e3] focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20'
              }`}
            />
            {error && (
              <span className="block text-xs text-red-500 font-medium mt-2">
                الرقم السري غير صحيح. يرجى المحاولة مجدداً
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-[13px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full transition-colors shadow-none"
            >
              تأكيد الدخول
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
