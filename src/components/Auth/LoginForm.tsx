import React, { useState } from 'react';
import { Award, BookOpen, CheckCircle, GraduationCap, HeartHandshake, Lock, LogIn, Shield, Sparkles, User } from 'lucide-react';
import { Student } from '../../types';
import { SUPERVISOR_PIN } from './SupervisorLoginModal';

interface LoginFormProps {
  students: Student[];
  onStudentLogin: (student: Student) => void;
  onTeacherLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  students,
  onStudentLogin,
  onTeacherLogin,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [mobile, setMobile] = useState('');
  const [last5Digits, setLast5Digits] = useState('');
  const [teacherPin, setTeacherPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMobile = mobile.trim().replace(/[\s-]/g, '').replace(/^0/, '');
    const cleanLast5 = last5Digits.trim().replace(/[\s-]/g, '');

    if (!cleanMobile || !cleanLast5) {
      setError('يرجى إدخال رقم الجوال وآخر 5 أرقام.');
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

    let matched = students.find((s) => {
      const sMobile = s.mobile.trim().replace(/[\s-]/g, '').replace(/^0/, '');
      return sMobile === cleanMobile;
    });

    if (matched) {
      onStudentLogin(matched);
    } else {
      // Dynamic fallback student creation
      const newStudent: Student = {
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
      onStudentLogin(newStudent);
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (teacherPin.trim() === SUPERVISOR_PIN) {
      onTeacherLogin();
    } else {
      setError('الرقم السري للمشرف غير صحيح.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Apple style header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#1d1d1f] text-white flex items-center justify-center mx-auto text-base font-semibold shadow-xs">
            مـ
          </div>
          <h1 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
            منصة مُبادر للتطوع المدرسي
          </h1>
          <p className="text-[13px] text-[#86868b]">
            الهيئة الملكية بينبع · الأنشطة الطلابية 2026-2027
          </p>
        </div>

        {/* Apple style card */}
        <div className="bg-[#ffffff] rounded-3xl p-7 border border-black/[0.04] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Segmented control */}
          <div className="flex p-1 bg-[#f5f5f7] rounded-full mb-6 text-[12px]">
            <button
              type="button"
              onClick={() => {
                setRole('student');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                role === 'student'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              دخول الطالب
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('teacher');
                setError(null);
              }}
              className={`flex-1 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
                role === 'teacher'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              لوحة المشرف
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 text-[12px] text-red-600 leading-relaxed border border-red-100">
              {error}
            </div>
          )}

          {role === 'student' ? (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  رقم الجوال
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="مثال: 0551234567"
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-right tabular-nums transition-all"
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
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-right tabular-nums transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full shadow-none transition-colors cursor-pointer"
              >
                دخول
              </button>
            </form>
          ) : (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  الرقم السري للمشرف
                </label>
                <input
                  type="password"
                  value={teacherPin}
                  onChange={(e) => setTeacherPin(e.target.value)}
                  placeholder="أدخل الرقم السري"
                  className="w-full px-4 py-3 text-[14px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white text-center tabular-nums font-mono tracking-widest transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1d1d1f] hover:bg-black text-white text-[13px] font-medium rounded-full shadow-none transition-colors cursor-pointer"
              >
                دخول لوحة المشرف
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-[12px] text-[#86868b]">
          <span>إدارة التعليم العام بينبع 2026-2027</span>
        </div>
      </div>
    </div>
  );
};
