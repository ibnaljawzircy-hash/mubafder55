import React from 'react';
import { Award, CheckCircle2, Lock, LogOut, Shield, User } from 'lucide-react';
import { Student } from '../types';

interface NavbarProps {
  currentRole: 'student' | 'teacher';
  currentStudent: Student | null;
  activeTab: string;
  pendingRequestsCount?: number;
  nonParticipatingCount?: number;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onRequestSupervisorAccess: () => void;
  onRequestStudentLogin: () => void;
  onSwitchToStudent: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  currentStudent,
  activeTab,
  pendingRequestsCount = 0,
  nonParticipatingCount = 0,
  onTabChange,
  onLogout,
  onRequestSupervisorAccess,
  onRequestStudentLogin,
  onSwitchToStudent,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#f5f5f7]/85 backdrop-blur-xl border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand - Apple minimal style */}
          <button
            onClick={() => onTabChange('programs')}
            className="flex items-center gap-2.5 text-right cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-lg bg-[#1d1d1f] text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
              مـ
            </div>
            <div className="leading-tight">
              <span className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight group-hover:text-[#0071e3] transition-colors block">
                منصة مُبادر
              </span>
              <span className="text-[10px] text-[#86868b] block -mt-0.5">
                مدرسة ابن الجوزي للموهوبين
              </span>
            </div>
          </button>

          {/* Top Actions: تسجيل دخول للطلاب أو لوحة المشرف */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {currentRole === 'teacher' ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-[12px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  لوحة المشرف مفعلة
                </span>
                <button
                  onClick={onSwitchToStudent}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-[#ffffff] hover:bg-[#e8e8ed] rounded-full border border-black/[0.08] transition-colors cursor-pointer"
                >
                  استعراض كطالب
                </button>
              </div>
            ) : currentStudent ? (
              /* If Student is Logged in */
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => onTabChange('my-tasks')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-[#ffffff] hover:bg-[#e8e8ed] rounded-full border border-black/[0.06] transition-all cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[100px] sm:max-w-[140px] truncate">{currentStudent.name.split(' ')[0]}</span>
                  <span className="font-mono text-[#86868b] text-[11px]">({currentStudent.totalHours}س)</span>
                </button>

                <button
                  onClick={onRequestSupervisorAccess}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-black/[0.04] hover:bg-black/[0.08] rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3 h-3 text-[#86868b]" />
                  <span className="hidden sm:inline">لوحة المشرف</span>
                  <span className="sm:hidden">المشرف</span>
                </button>
              </div>
            ) : (
              /* If Not Logged In */
              <div className="flex items-center gap-2">
                <button
                  onClick={onRequestStudentLogin}
                  className="px-3.5 py-1.5 text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full transition-all shadow-none flex items-center gap-1.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>تسجيل دخول للطلاب</span>
                </button>

                <button
                  onClick={onRequestSupervisorAccess}
                  className="px-3 py-1.5 text-[12px] font-medium text-[#1d1d1f] bg-[#ffffff] hover:bg-[#e8e8ed] rounded-full border border-black/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>لوحة المشرف</span>
                </button>
              </div>
            )}

            {currentStudent && (
              <button
                onClick={onLogout}
                title="تسجيل الخروج"
                className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Minimal Sub-nav for mobile & desktop switching */}
        {currentRole === 'teacher' && (
          <div className="flex items-center justify-start gap-4 py-1.5 border-t border-black/[0.04] text-[12px] overflow-x-auto">
            <button
              onClick={() => onTabChange('programs')}
              className={`whitespace-nowrap font-medium transition-colors ${
                activeTab === 'programs' ? 'text-[#0071e3] font-semibold' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              المبادرات والمهام
            </button>
            <button
              onClick={() => onTabChange('dashboard')}
              className={`whitespace-nowrap font-medium transition-colors ${
                activeTab === 'dashboard' ? 'text-[#0071e3] font-semibold' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              لوحة الإنجازات
            </button>
            <button
              onClick={() => onTabChange('attendance')}
              className={`whitespace-nowrap font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'attendance' ? 'text-[#0071e3] font-semibold' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <span>طلبات الانضمام وتوثيق الساعات</span>
              {pendingRequestsCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight font-mono">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onTabChange('students')}
              className={`whitespace-nowrap shrink-0 font-medium transition-colors ${
                activeTab === 'students' ? 'text-[#0071e3] font-semibold' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              الطلاب واستيراد إكسل
            </button>
            <button
              onClick={() => onTabChange('non-participating')}
              className={`whitespace-nowrap shrink-0 font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'non-participating' ? 'text-[#0071e3] font-semibold' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <span>الطلاب غير المشاركين</span>
              {nonParticipatingCount > 0 && (
                <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full leading-tight font-mono tabular-nums">
                  {nonParticipatingCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
