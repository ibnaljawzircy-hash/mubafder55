import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Percent,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../types';

interface VolunteerIndicatorsProps {
  programs: ActivityProgram[];
  students: Student[];
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  headingLevel?: 'h1' | 'h2';
  compact?: boolean;
  actions?: React.ReactNode;
}

export const VolunteerIndicators: React.FC<VolunteerIndicatorsProps> = ({
  programs,
  students,
  tasks,
  registrations,
  headingLevel = 'h2',
  compact = false,
  actions,
}) => {
  // 1. إجمالي الساعات التطوعية المعتمدة (الرقم الأهم للتقارير الرسمية)
  const totalCertifiedHours = registrations
    .filter((r) => r.attendanceStatus === 'completed')
    .reduce((sum, r) => sum + r.hoursAwarded, 0);

  // 2. نسبة الطلاب المتطوعين (عدد الطلاب المشاركين فعلياً ÷ إجمالي طلاب المدرسة)
  const activeVolunteerStudentsCount = new Set(
    registrations
      .filter((r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended')
      .map((r) => r.studentId)
  ).size;
  const totalSchoolStudents = students.length;
  const volunteerRatioPercent =
    totalSchoolStudents > 0
      ? Math.round((activeVolunteerStudentsCount / totalSchoolStudents) * 100)
      : 0;

  // 3. عدد الفرص / المبادرات المنفذة
  const executedInitiativesCount = programs.filter((p) =>
    registrations.some(
      (r) =>
        r.attendanceStatus === 'completed' &&
        (r.programId === p.id || tasks.some((t) => t.id === r.taskId && t.programId === p.id))
    )
  ).length;
  const completedTasksCount = tasks.filter((t) =>
    registrations.some((r) => r.taskId === t.id && r.attendanceStatus === 'completed')
  ).length;

  // 4. نسبة الالتزام بالحضور (كم طالب سجل وحضر فعلياً وتجنب الغياب)
  const attendedOrCompletedCount = registrations.filter(
    (r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended'
  ).length;
  const absentCount = registrations.filter((r) => r.attendanceStatus === 'absent').length;
  const evaluatedRegistrationsCount = attendedOrCompletedCount + absentCount;
  const attendanceCommitmentRate =
    evaluatedRegistrationsCount > 0
      ? Math.round((attendedOrCompletedCount / evaluatedRegistrationsCount) * 100)
      : 100;

  // 5. معدل رضا الطلاب (تقييم سريع من 5 نجوم بعد إتمام النشاط)
  const ratedRegistrations = registrations.filter(
    (r) => typeof r.rating === 'number' && r.rating > 0
  );
  const averageSatisfaction =
    ratedRegistrations.length > 0
      ? (
          ratedRegistrations.reduce((sum, r) => sum + (r.rating || 5), 0) /
          ratedRegistrations.length
        ).toFixed(1)
      : '5.0';
  const satisfactionPercent = Math.round((parseFloat(averageSatisfaction) / 5) * 100);

  const HeadingTag = headingLevel;

  return (
    <div
      className={`bg-[#ffffff] rounded-3xl border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] ${
        compact ? 'p-3.5 sm:p-5 space-y-3' : 'p-5 sm:p-8 space-y-5 sm:space-y-6'
      }`}
    >
      {compact ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-[12px] text-[#86868b]">
            <span className="font-semibold text-emerald-800">
              لوحة مؤشرات الأداء الرسمية · 2026-2027
            </span>
            <span aria-hidden="true">·</span>
            <HeadingTag className="font-semibold text-[#1d1d1f]">
              أهم 5 مؤشرات استراتيجية للعمل التطوعي المدرسي
            </HeadingTag>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#86868b]">
              <span className="font-semibold text-emerald-800">
                لوحة مؤشرات الأداء الرسمية · 2026-2027
              </span>
              <span aria-hidden="true">·</span>
              <span>مدرسة ابن الجوزي للموهوبين</span>
            </div>
            <HeadingTag className="text-xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              أهم 5 مؤشرات استراتيجية للعمل التطوعي المدرسي.
            </HeadingTag>
            <p className="text-[13px] sm:text-[14px] text-[#86868b] max-w-2xl leading-relaxed">
              الأرقام الخمسة الأساسية المعتمدة لتقارير النشاط الطلابي والتوثيق الرسمي للدرجات والشهادات المدرسية.
            </p>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}

      {/* The 5 Strategic KPIs */}
      <div
        className={`grid pt-3 border-t border-black/[0.04] ${
          compact
            ? 'grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-4'
        }`}
      >
        {/* 1. إجمالي الساعات التطوعية المعتمدة (الرقم الأهم) */}
        <div
          className={`bg-gradient-to-br from-emerald-50/70 via-white to-white rounded-2xl border-2 border-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.08)] flex flex-col justify-between relative overflow-hidden ${
            compact ? 'p-3.5 sm:p-4 space-y-2' : 'p-5 space-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                الرقم الأهم
              </span>
            </div>
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] leading-snug pt-1">
              إجمالي الساعات المعتمدة
            </h3>
            <p className="text-[11px] text-[#86868b] leading-tight">
              الموثقة للتقارير الرسمية والشهادات
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-emerald-900 font-mono tabular-nums tracking-tight">
                {totalCertifiedHours}
              </span>
              <span className="text-[13px] font-semibold text-emerald-700">ساعة</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium block mt-1">
              جاهزة للتصدير والاعتماد الوزاري
            </span>
          </div>
        </div>

        {/* 2. نسبة الطلاب المتطوعين */}
        <div
          className={`bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between hover:bg-[#efeff2] transition-colors ${
            compact ? 'p-3.5 sm:p-4 space-y-2' : 'p-5 space-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-sky-800 inline-flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                مشاركة المدرسة
              </span>
              <Percent className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] leading-snug pt-1">
              نسبة الطلاب المتطوعين
            </h3>
            <p className="text-[11px] text-[#86868b] leading-tight">
              المشاركون فعلياً ÷ إجمالي الطلاب
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] font-mono tabular-nums tracking-tight">
                {volunteerRatioPercent}%
              </span>
            </div>
            <span className="text-[10px] text-[#86868b] font-medium block mt-1 font-mono tabular-nums">
              {activeVolunteerStudentsCount} طالب من {totalSchoolStudents} طالب
            </span>
          </div>
        </div>

        {/* 3. عدد الفرص / المبادرات المنفذة */}
        <div
          className={`bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between hover:bg-[#efeff2] transition-colors ${
            compact ? 'p-3.5 sm:p-4 space-y-2' : 'p-5 space-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-indigo-800 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                الفرص والمبادرات
              </span>
              <Calendar className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] leading-snug pt-1">
              المبادرات المنفذة
            </h3>
            <p className="text-[11px] text-[#86868b] leading-tight">
              الفرص المكتملة والجاري إتمامها
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] font-mono tabular-nums tracking-tight">
                {executedInitiativesCount}
              </span>
              <span className="text-[12px] text-[#86868b]">مبادرة</span>
            </div>
            <span className="text-[10px] text-[#86868b] font-medium block mt-1 font-mono tabular-nums">
              تتضمن {completedTasksCount} مهمة تطوعية منجزة
            </span>
          </div>
        </div>

        {/* 4. نسبة الالتزام بالحضور */}
        <div
          className={`bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between hover:bg-[#efeff2] transition-colors ${
            compact ? 'p-3.5 sm:p-4 space-y-2' : 'p-5 space-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-purple-800 inline-flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                الانضباط والتنفيذ
              </span>
              <Shield className="w-3.5 h-3.5 text-[#86868b]" />
            </div>
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] leading-snug pt-1">
              نسبة الالتزام بالحضور
            </h3>
            <p className="text-[11px] text-[#86868b] leading-tight">
              سجلوا وحضروا فعلياً وتجنبوا الغياب
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-[#0071e3] font-mono tabular-nums tracking-tight">
                {attendanceCommitmentRate}%
              </span>
            </div>
            <span className="text-[10px] text-sky-800 font-medium block mt-1 font-mono tabular-nums">
              حضر {attendedOrCompletedCount} طالب (غياب: {absentCount})
            </span>
          </div>
        </div>

        {/* 5. معدل رضا الطلاب */}
        <div
          className={`bg-gradient-to-br from-amber-50/60 via-white to-white rounded-2xl border border-amber-200/90 flex flex-col justify-between ${
            compact ? 'col-span-2 lg:col-span-1 p-3.5 sm:p-4 space-y-2' : 'p-5 space-y-3'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                تقييم الأثر
              </span>
              <span className="text-[11px] font-bold text-amber-600 font-mono tabular-nums">
                {satisfactionPercent}%
              </span>
            </div>
            <h3 className="text-[13px] font-semibold text-[#1d1d1f] leading-snug pt-1">
              معدل رضا الطلاب
            </h3>
            <p className="text-[11px] text-[#86868b] leading-tight">
              تقييم سريع من 5 نجوم بعد النشاط
            </p>
          </div>

          <div className="pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold text-amber-900 font-mono tabular-nums tracking-tight">
                {averageSatisfaction}
              </span>
              <span className="text-[13px] font-semibold text-amber-600">من 5</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1 text-amber-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i <= Math.round(parseFloat(averageSatisfaction))
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300'
                  }`}
                />
              ))}
              <span className="text-[10px] text-amber-800 font-medium mr-1 font-mono tabular-nums">
                ({ratedRegistrations.length} تقييماً معتمداً)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
