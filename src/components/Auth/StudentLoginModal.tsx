import React, { useState } from 'react';
import { Award, CheckCircle2, User, X } from 'lucide-react';
import { Student } from '../../types';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onLoginSuccess: (student: Student) => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  students,
  onLoginSuccess,
}) => {
  const [mobile, setMobile] = useState('');
  const [last5Digits, setLast5Digits] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim().replace(/[\s-]/g, '').replace(/^0/, '');
    const cleanLast5 = last5Digits.trim().replace(/\D/g, '');

    if (!cleanMobile || !cleanLast5) {
      setError('يرجى إدخال رقم الجوال وآخر 5 أرقام من رقم الجوال.');
      return;
    }

    if (cleanLast5.length !== 5) {
      setError('يرجى إدخال 5 أرقام بالضبط (آخر 5 أرقام من رقم الجوال).');
      return;
    }

    if (!cleanMobile.endsWith(cleanLast5)) {
      setError('الأرقام الخمسة المدخلة لا تطابق نهاية رقم الجوال.');
      return;
    }

    // Match student by mobile
    let matched = students.find((s) => {
      const sMobile = s.mobile.trim().replace(/[\s-]/g, '').replace(/^0/, '');
      return sMobile === cleanMobile;
    });

    // If new student, create profile dynamically so user is never blocked
    if (!matched) {
      matched = {
        id: `stu-${cleanMobile}`,
        name: `طالب موهوب (${cleanMobile.slice(-4)})`,
        mobile: mobile.startsWith('0') ? mobile : `0${mobile}`,
        stage: 'intermediate',
        grade: 'المرحلة الدراسية',
        classroom: 'موهوبين',
        schoolName: 'مدرسة ابن الجوزي للموهوبين',
        totalHours: 0,
        completedTasksCount: 0,
        registeredDate: new Date().toISOString().slice(0, 10),
        badgeLevel: 'متطوع جديد',
      };
    }

    onLoginSuccess(matched);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center sm:text-right space-y-1">
          <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
            بوابة الطلاب
          </span>
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
            تسجيل دخول الطالب
          </h3>
          <p className="text-[12px] text-[#86868b]">
            أدخل رقم الجوال وآخر 5 أرقام من رقم الجوال للوصول إلى مهامك وساعاتك
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 text-[12px] text-red-600 leading-relaxed border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              رقم الجوال:
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="0551234567"
              className="w-full px-4 py-3 text-[14px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-right tabular-nums font-mono transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              آخر 5 أرقام من رقم الجوال:
            </label>
            <input
              type="text"
              maxLength={5}
              value={last5Digits}
              onChange={(e) => setLast5Digits(e.target.value)}
              placeholder="مثال: 34567"
              className="w-full px-4 py-3 text-[14px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-center tabular-nums font-mono tracking-widest font-semibold transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>دخول وعرض الساعات التطوعية</span>
          </button>
        </form>
      </div>
    </div>
  );
};
