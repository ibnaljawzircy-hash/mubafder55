import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, MapPin, Sparkles, User, X } from 'lucide-react';
import { ActivityProgram, Student, VolunteerTask } from '../../types';

interface TaskRegistrationModalProps {
  task: VolunteerTask;
  program?: ActivityProgram;
  students: Student[];
  currentStudent: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRegistration: (student: Student, taskId: string) => void;
}

export const TaskRegistrationModal: React.FC<TaskRegistrationModalProps> = ({
  task,
  program,
  students,
  currentStudent,
  isOpen,
  onClose,
  onConfirmRegistration,
}) => {
  const [mobile, setMobile] = useState(currentStudent?.mobile || '');
  const [last5Digits, setLast5Digits] = useState(
    currentStudent ? currentStudent.mobile.slice(-5) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [successStudent, setSuccessStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMobile(currentStudent?.mobile || '');
      setLast5Digits(currentStudent ? currentStudent.mobile.slice(-5) : '');
      setError(null);
      setSuccessStudent(null);
    }
  }, [isOpen, task.id, currentStudent]);

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

    // If student is new to the system, create student record dynamically
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

    setSuccessStudent(matched);
    onConfirmRegistration(matched, task.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {successStudent ? (
          /* Apple-Style Success Screen */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                تم إرسال طلب الانضمام للمشرف بنجاح
              </span>
              <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">{successStudent.name}</h3>
              <p className="text-[13px] text-[#86868b]">
                {successStudent.stage === 'primary' ? 'المرحلة الابتدائية' : 'المرحلة المتوسطة'} · {successStudent.grade} ({successStudent.classroom})
              </p>
              <p className="text-[12px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2">
                وصل طلبك إلى المشرف للموافقة، وسيتم اعتماد وتوثيق ساعاتك التطوعية فور انتهاء المبادرة والتأكد من مشاركتك.
              </p>
            </div>

            <div className="bg-[#f5f5f7] rounded-2xl p-4 text-right space-y-2 text-[12px] text-[#1d1d1f]">
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">المهمة:</span>
                <span className="font-semibold">{task.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">البرنامج:</span>
                <span className="text-[#86868b]">{task.programName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">الساعات المعتمدة:</span>
                <span className="font-mono font-semibold text-[#0071e3]">{task.hours} ساعات</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#86868b]">رمز الحضور السريع:</span>
                <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-black/[0.06]">
                  {task.checkInCode}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors shadow-none cursor-pointer"
            >
              تم
            </button>
          </div>
        ) : (
          /* Apple-Style Form Screen */
          <div className="space-y-5">
            <div>
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
                التسجيل في مهمة تطوعية
              </span>
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight mt-0.5 leading-snug">
                {task.title}
              </h3>
              <p className="text-[12px] text-[#86868b] mt-1">
                {task.programName} · <span className="font-mono">{task.hours}س</span>
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
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="0551234567"
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-right tabular-nums font-mono transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  آخر 5 أرقام من رقم الجوال
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={last5Digits}
                  onChange={(e) => setLast5Digits(e.target.value)}
                  placeholder="مثال: 34567"
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-center tabular-nums font-mono tracking-widest font-semibold transition-all"
                  required
                />
                <span className="block text-[11px] text-[#86868b] mt-1">
                  أدخل آخر 5 أرقام من رقم الجوال للتأكيد وتوثيق الساعات التطوعية فوراً
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>تأكيد تسجيل الدخول والانضمام للتطوع</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
