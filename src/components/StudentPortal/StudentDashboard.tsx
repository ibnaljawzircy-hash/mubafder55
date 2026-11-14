import React, { useState } from 'react';
import { Award, Calendar, CheckCircle2, Clock, MapPin, QrCode, Search, Sparkles, Star, UserCheck } from 'lucide-react';
import { Student, VolunteerRegistration, VolunteerTask } from '../../types';

interface StudentDashboardProps {
  student: Student;
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  onCheckInByCode: (code: string) => { success: boolean; message: string };
  onViewCertificate: () => void;
  onExploreTasks: () => void;
  onRateRegistration?: (registrationId: string, rating: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  tasks,
  registrations,
  onCheckInByCode,
  onViewCertificate,
  onExploreTasks,
  onRateRegistration,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [checkInMsg, setCheckInMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const studentRegs = registrations.filter((r) => r.studentId === student.id);

  const enrichedRegs = studentRegs.map((reg) => {
    const task = tasks.find((t) => t.id === reg.taskId);
    return {
      reg,
      task,
    };
  });

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const res = onCheckInByCode(inputCode.trim());
    if (res.success) {
      setCheckInMsg({ type: 'success', text: res.message });
      setInputCode('');
    } else {
      setCheckInMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => {
      setCheckInMsg(null);
    }, 5000);
  };

  const nextTarget = student.totalHours < 5 ? 5 : student.totalHours < 9 ? 9 : student.totalHours < 13 ? 13 : 20;
  const progressPercent = Math.min(100, Math.round((student.totalHours / nextTarget) * 100));

  return (
    <div className="space-y-8">
      {/* Student Welcome & Profile Card - Apple Style */}
      <div className="bg-[#ffffff] rounded-3xl p-7 sm:p-8 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center font-semibold text-xl border border-black/[0.06] shrink-0">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">{student.name}</h2>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-[#86868b]">
                  {student.stage === 'primary' ? 'ابتدائي' : 'متوسط'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#86868b] mt-1">
                <span>{student.grade} - فصل {student.classroom}</span>
                <span>·</span>
                <span>{student.schoolName}</span>
                <span>·</span>
                <span className="font-mono tabular-nums">الجوال: {student.mobile}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onViewCertificate}
            className="w-full sm:w-auto px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-2 shadow-none cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>عرض شهادة الساعات المعتمدة</span>
          </button>
        </div>

        {/* Metrics Bar - Apple Style */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-black/[0.04]">
          <div className="p-4 bg-[#f5f5f7] rounded-2xl">
            <span className="text-[12px] text-[#86868b] block mb-1">إجمالي الساعات المعتمدة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-[#1d1d1f] font-mono tabular-nums">
                {student.totalHours}
              </span>
              <span className="text-[12px] text-[#86868b]">ساعة تطوعية</span>
            </div>
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-2xl">
            <span className="text-[12px] text-[#86868b] block mb-1">المهام المنجزة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-[#1d1d1f] font-mono tabular-nums">
                {student.completedTasksCount}
              </span>
              <span className="text-[12px] text-[#86868b]">مهمة مدرسية</span>
            </div>
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-2xl">
            <span className="text-[12px] text-[#86868b] block mb-1">الوسام والمستوى</span>
            <div className="text-sm font-semibold text-[#1d1d1f]">{student.badgeLevel}</div>
            <div className="mt-2.5 w-full bg-[#e8e8ed] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#0071e3] h-1 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Check-in Box - Apple Style */}
      <div className="bg-[#ffffff] rounded-3xl p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center shrink-0 border border-black/[0.04]">
              <QrCode className="w-5 h-5 text-[#1d1d1f]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f]">
                تسجيل الحضور الفوري برمز المهمة
              </h3>
              <p className="text-[12px] text-[#86868b] mt-0.5">
                أدخل رمز المهمة المعلن من المشرف (مثل #VOL-771) لتأكيد حضورك فورياً
              </p>
            </div>
          </div>

          <form onSubmit={handleCheckInSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="VOL-771"
              className="px-4 py-2 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-full focus:outline-none focus:border-[#0071e3] text-center font-mono font-semibold tracking-wider uppercase w-full md:w-44 transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-medium rounded-full transition-colors shrink-0 shadow-none cursor-pointer"
            >
              تسجيل الحضور
            </button>
          </form>
        </div>

        {checkInMsg && (
          <div
            className={`mt-4 p-3 rounded-2xl text-[12px] font-medium ${
              checkInMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-800 border border-red-100'
            }`}
          >
            {checkInMsg.text}
          </div>
        )}
      </div>

      {/* Registered Tasks Section - Apple Style */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
              سجل مهامي التطوعية
            </h3>
            <p className="text-[12px] text-[#86868b] mt-0.5">
              متابعة الساعات الموثقة وحالة الحضور
            </p>
          </div>
          <button
            onClick={onExploreTasks}
            className="text-[13px] text-[#0071e3] hover:underline cursor-pointer"
          >
            استعراض برامج الأنشطة ←
          </button>
        </div>

        {enrichedRegs.length === 0 ? (
          <div className="text-center py-16 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-8">
            <Calendar className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-40" />
            <h4 className="text-base font-semibold text-[#1d1d1f]">لم تسجل في أي مهمة تطوعية بعد</h4>
            <p className="text-[13px] text-[#86868b] max-w-sm mx-auto mt-1 mb-4">
              اختر نشاطاً من الخطة المركزية للأنشطة وسجل الآن لكسب ساعاتك المعتمدة.
            </p>
            <button
              onClick={onExploreTasks}
              className="px-4 py-2 bg-[#0071e3] text-white text-[13px] font-medium rounded-full cursor-pointer"
            >
              استعراض البرامج المتاحة
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {enrichedRegs.map(({ reg, task }) => (
              <div
                key={reg.id}
                className="p-5 bg-[#ffffff] rounded-3xl border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[15px] font-semibold text-[#1d1d1f]">
                      {task?.title || 'مهمة تطوعية'}
                    </h4>
                    {reg.attendanceStatus === 'completed' ? (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>موثقة ومعتمدة ({reg.hoursAwarded}س)</span>
                      </span>
                    ) : reg.approvalStatus === 'approved' || reg.attendanceStatus === 'attended' ? (
                      <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-sky-600" />
                        <span>تمت موافقة المشرف</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>بانتظار موافقة المشرف</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[12px] text-[#86868b]">
                    {task?.programName}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#86868b] pt-1">
                    <span>{task?.date} ({task?.time})</span>
                    <span>·</span>
                    <span>{task?.location}</span>
                    <span>·</span>
                    <span className="font-mono">الرمز: {task?.checkInCode}</span>
                  </div>

                  {reg.notes && (
                    <p className="text-[11px] text-[#1d1d1f] bg-[#f5f5f7] p-2 rounded-xl mt-2">
                      ملاحظة المشرف: {reg.notes}
                    </p>
                  )}

                  {/* 5-Star Rating Widget (معدل رضا الطلاب بعد إتمام النشاط) */}
                  {reg.attendanceStatus === 'completed' && (
                    <div className="pt-2 flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-[11px] font-medium text-[#86868b]">
                        تقييمك لتجربة التطوع في هذه المبادرة:
                      </span>
                      <div className="flex items-center gap-1 bg-[#f5f5f7] px-2.5 py-1 rounded-full border border-black/[0.04]">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => onRateRegistration && onRateRegistration(reg.id, star)}
                            className="p-0.5 text-amber-400 hover:scale-125 transition-transform cursor-pointer"
                            title={`${star} نجوم`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                (reg.rating || 0) >= star
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-[11px] font-bold font-mono text-amber-800 mr-1">
                          {reg.rating ? `${reg.rating}/5` : 'اضغط للتقييم'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right font-mono tabular-nums self-end sm:self-center">
                  <span className="text-xl font-semibold text-[#1d1d1f]">
                    {reg.attendanceStatus === 'completed' ? reg.hoursAwarded : task?.hours || 0}س
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
