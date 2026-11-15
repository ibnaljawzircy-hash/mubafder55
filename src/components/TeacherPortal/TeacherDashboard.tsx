import React from 'react';
import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  GraduationCap,
  HeartHandshake,
  Percent,
  Plus,
  Send,
  Shield,
  Star,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../../types';
import {
  resolveProgramDomainId,
  resolveRegistrationDomainId,
  resolveTaskDomainId,
} from '../../utils/programHelpers';

interface TeacherDashboardProps {
  programs?: ActivityProgram[];
  students: Student[];
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  onNavigate: (tab: string) => void;
  onExportExcel: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  programs = [],
  students,
  tasks,
  registrations,
  onNavigate,
  onExportExcel,
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

  // Breakdown by Stage (Primary vs Intermediate)
  const primaryStudents = students.filter((s) => s.stage === 'primary');
  const intermediateStudents = students.filter((s) => s.stage === 'intermediate');

  const primaryHours = registrations
    .filter((r) => r.studentStage === 'primary' && r.attendanceStatus === 'completed')
    .reduce((sum, r) => sum + r.hoursAwarded, 0);

  const intermediateHours = registrations
    .filter((r) => r.studentStage === 'intermediate' && r.attendanceStatus === 'completed')
    .reduce((sum, r) => sum + r.hoursAwarded, 0);

  // Domain breakdown (authoritative based on initiative classification in the 8 domains)
  const domainStats = ACTIVITY_DOMAINS.map((domain) => {
    const domainPrograms = programs.filter((p) => resolveProgramDomainId(p) === domain.id);
    const domainTasks = tasks.filter((t) => resolveTaskDomainId(t, programs) === domain.id);
    const domainRegs = registrations.filter(
      (r) =>
        r.attendanceStatus === 'completed' &&
        resolveRegistrationDomainId(r, tasks, programs) === domain.id
    );
    const domainHours = domainRegs.reduce((sum, r) => sum + r.hoursAwarded, 0);

    return {
      ...domain,
      programCount: domainPrograms.length,
      taskCount: domainTasks.length,
      volunteerCount: domainRegs.length,
      hours: domainHours,
    };
  });

  // Non-participating students (0 certified hours and no attended/completed participation)
  const nonParticipatingStudents = students.filter((stu) => {
    const stuRegs = registrations.filter((r) => r.studentId === stu.id);
    const hasActive =
      stu.totalHours > 0 ||
      stuRegs.some(
        (r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended'
      );
    return !hasActive;
  });

  const neverRegisteredCount = nonParticipatingStudents.filter(
    (stu) => !registrations.some((r) => r.studentId === stu.id)
  ).length;
  const incompleteOnlyCount = nonParticipatingStudents.length - neverRegisteredCount;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner and Quick Actions */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                لوحة مؤشرات الأداء الرسمية · 2026-2027
              </span>
              <span className="text-[11px] text-[#86868b] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full font-mono">
                مدرسة ابن الجوزي للموهوبين
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              أهم 5 مؤشرات استراتيجية للعمل التطوعي المدرسي.
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#86868b] max-w-2xl leading-relaxed">
              الأرقام الخمسة الأساسية المعتمدة لتقارير النشاط الطلابي والتوثيق الرسمي للدرجات والشهادات المدرسية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-all flex items-center gap-1.5 shadow-none cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تحضير وتوثيق الساعات</span>
            </button>

            <button
              onClick={() => onNavigate('programs')}
              className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#0071e3]" />
              <span>إدارة المبادرات</span>
            </button>

            <button
              onClick={() => onNavigate('non-participating')}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[13px] font-medium rounded-full border border-amber-200/80 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>غير المشاركين</span>
              <span className="font-mono tabular-nums font-bold">({nonParticipatingStudents.length})</span>
            </button>

            <button
              onClick={onExportExcel}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 border border-emerald-200/80 cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>تصدير تقرير إكسل</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            ⭐️ THE 5 FOCUSED NUMBERS (أهم 5 أرقام تركز عليها المنصة)
            ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-4 border-t border-black/[0.04]">
          {/* 1. إجمالي الساعات التطوعية المعتمدة (الرقم الأهم) */}
          <div className="p-5 bg-gradient-to-br from-emerald-50/70 via-white to-white rounded-2xl border-2 border-emerald-300 shadow-[0_4px_16px_rgba(16,185,129,0.08)] flex flex-col justify-between space-y-3 relative overflow-hidden group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600" />
                  الرقم الأهم
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
          <div className="p-5 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between space-y-3 group hover:bg-[#efeff2] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Users className="w-3 h-3 text-sky-600" />
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
              <span className="text-[10px] text-[#86868b] font-medium block mt-1 font-mono">
                {activeVolunteerStudentsCount} طالب من {totalSchoolStudents} طالب
              </span>
            </div>
          </div>

          {/* 3. عدد الفرص / المبادرات المنفذة */}
          <div className="p-5 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between space-y-3 group hover:bg-[#efeff2] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-indigo-600" />
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
              <span className="text-[10px] text-[#86868b] font-medium block mt-1 font-mono">
                تتضمن {completedTasksCount} مهمة تطوعية منجزة
              </span>
            </div>
          </div>

          {/* 4. نسبة الالتزام بالحضور */}
          <div className="p-5 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between space-y-3 group hover:bg-[#efeff2] transition-colors">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-purple-600" />
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
              <span className="text-[10px] text-sky-800 font-medium block mt-1 font-mono">
                حضر {attendedOrCompletedCount} طالب (غياب: {absentCount})
              </span>
            </div>
          </div>

          {/* 5. معدل رضا الطلاب */}
          <div className="p-5 bg-gradient-to-br from-amber-50/60 via-white to-white rounded-2xl border border-amber-200/90 flex flex-col justify-between space-y-3 group">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                  تقييم الأثر
                </span>
                <span className="text-[11px] font-bold text-amber-600 font-mono">
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
                <span className="text-[10px] text-amber-800 font-medium mr-1">
                  ({ratedRegistrations.length} تقييماً معتمداً)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Comparison (المرحلة الابتدائية vs المرحلة المتوسطة) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Primary Stage */}
        <div className="bg-[#ffffff] rounded-3xl p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#0071e3]" />
              <h3 className="text-base font-semibold text-[#1d1d1f]">المرحلة الابتدائية</h3>
            </div>
            <span className="text-[11px] text-[#86868b] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full font-mono">
              {primaryStudents.length} طالب مسجل
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-[#f5f5f7] rounded-xl">
              <span className="text-[11px] text-[#86868b] block mb-0.5">الساعات المعتمدة</span>
              <span className="text-2xl font-bold text-[#1d1d1f] font-mono">{primaryHours}س</span>
            </div>
            <div className="p-3.5 bg-[#f5f5f7] rounded-xl">
              <span className="text-[11px] text-[#86868b] block mb-0.5">المتطوعون النشطون</span>
              <span className="text-2xl font-bold text-[#0071e3] font-mono">
                {new Set(registrations.filter((r) => r.studentStage === 'primary' && (r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended')).map((r) => r.studentId)).size}
              </span>
            </div>
          </div>
        </div>

        {/* Intermediate Stage */}
        <div className="bg-[#ffffff] rounded-3xl p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-semibold text-[#1d1d1f]">المرحلة المتوسطة</h3>
            </div>
            <span className="text-[11px] text-[#86868b] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full font-mono">
              {intermediateStudents.length} طالب مسجل
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-[#f5f5f7] rounded-xl">
              <span className="text-[11px] text-[#86868b] block mb-0.5">الساعات المعتمدة</span>
              <span className="text-2xl font-bold text-[#1d1d1f] font-mono">{intermediateHours}س</span>
            </div>
            <div className="p-3.5 bg-[#f5f5f7] rounded-xl">
              <span className="text-[11px] text-[#86868b] block mb-0.5">المتطوعون النشطون</span>
              <span className="text-2xl font-bold text-emerald-700 font-mono">
                {new Set(registrations.filter((r) => r.studentStage === 'intermediate' && (r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended')).map((r) => r.studentId)).size}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Domains Breakdown & Honor Roll */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Domain breakdown */}
        <div className="lg:col-span-2 bg-[#ffffff] rounded-3xl p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">
                توزيع الساعات المعتمدة حسب مجالات النشاط الثمانية
              </h3>
              <p className="text-[12px] text-[#86868b]">
                الخطة المركزية المعتمدة لمدارس الهيئة الملكية بينبع
              </p>
            </div>
            <BarChart3 className="w-4 h-4 text-[#86868b]" />
          </div>

          <div className="space-y-2.5 pt-1">
            {domainStats.map((d) => {
              const maxHours = Math.max(1, ...domainStats.map((item) => item.hours));
              const percent = Math.round((d.hours / maxHours) * 100);

              return (
                <div key={d.id} className="p-3.5 bg-[#f5f5f7] rounded-2xl space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] border ${d.bgColor} ${d.badgeColor}`}>
                        {d.name}
                      </span>
                      <span className="text-[#86868b] font-mono text-[11px]">
                        {d.programCount} مبادرة · {d.taskCount} مهمة
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="text-[#86868b]">{d.volunteerCount} مشاركة</span>
                      <span className="font-semibold text-[#1d1d1f]">{d.hours}س</span>
                    </div>
                  </div>
                  <div className="w-full bg-[#e8e8ed] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0071e3] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${d.hours > 0 ? Math.max(4, percent) : 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Volunteers */}
        <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-[#1d1d1f]">
                  لوحة الشرف والرواد
                </h3>
                <p className="text-[12px] text-[#86868b]">
                  الطلاب الأكثر عطاءً وتوثيقاً للساعات
                </p>
              </div>
              <Award className="w-4 h-4 text-amber-500" />
            </div>

            {students.length === 0 ? (
              <div className="py-10 px-4 text-center bg-[#f5f5f7]/70 rounded-2xl border border-dashed border-black/[0.08] space-y-2">
                <Users className="w-8 h-8 text-[#86868b] mx-auto opacity-45" />
                <p className="text-[13px] font-semibold text-[#1d1d1f]">
                  لا يوجد طلاب مضافون حالياً
                </p>
                <p className="text-[11px] text-[#86868b] leading-relaxed">
                  ستظهر هنا قائمة الطلاب المضافين للمنصة مرتبة تلقائياً حسب الأكثر ساعات تطوعية فور إضافة الطلاب أو استيرادهم من ملف إكسل.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04]">
                {[...students]
                  .sort(
                    (a, b) =>
                      b.totalHours - a.totalHours ||
                      b.completedTasksCount - a.completedTasksCount
                  )
                  .slice(0, 5)
                  .map((s, idx) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-[11px] font-semibold flex items-center justify-center font-mono border border-black/[0.04]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-[13px] font-semibold text-[#1d1d1f] block">
                            {s.name}
                          </span>
                          <span className="text-[11px] text-[#86868b] block">
                            {s.stage === 'primary' ? 'ابتدائي' : 'متوسط'} · {s.grade}
                          </span>
                        </div>
                      </div>

                      <div className="text-left font-mono tabular-nums">
                        <span className="text-[13px] font-bold text-[#0071e3] block">
                          {s.totalHours}س
                        </span>
                        <span className="text-[10px] text-[#86868b] block">
                          {s.badgeLevel}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => onNavigate('students')}
              className="w-full py-2.5 text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors text-center cursor-pointer"
            >
              عرض سجلات الطلاب وقوائم الإكسل ←
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full py-2.5 text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full transition-colors text-center cursor-pointer shadow-none"
            >
              تحضير وتوثيق الساعات الجديدة ←
            </button>
          </div>
        </div>
      </div>

      {/* Non-Participating Students Follow-up Section */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[12px] text-[#86868b]">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>متابعة المشاركة الطلابية</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {nonParticipatingStudents.length} طالب بدون ساعات تطوعية
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[#1d1d1f]">
              الطلاب غير المشاركين — للمتابعة والتحفيز وتخصيص المبادرات
            </h3>
            <p className="text-[12px] text-[#86868b]">
              لم يسجلوا: <span className="font-mono font-semibold text-[#1d1d1f] tabular-nums">{neverRegisteredCount}</span>
              <span className="mx-2" aria-hidden="true">·</span>
              مسجلون دون اعتماد ساعات: <span className="font-mono font-semibold text-[#1d1d1f] tabular-nums">{incompleteOnlyCount}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('non-participating')}
              className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>فتح قسم غير المشاركين وتحفيزهم</span>
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="py-6 px-4 text-center bg-[#f5f5f7]/70 rounded-2xl border border-dashed border-black/[0.08] text-[12px] text-[#86868b]">
            أضف الطلاب من سجل الطلاب أو استورد ملف إكسل لرصد غير المشاركين تلقائياً ومتابعتهم.
          </div>
        ) : nonParticipatingStudents.length === 0 ? (
          <div className="py-6 px-4 text-center bg-emerald-50/70 rounded-2xl border border-emerald-200/70 text-[13px] font-medium text-emerald-900">
            جميع الطلاب المضافين لديهم مشاركات فعلية أو ساعات تطوعية معتمدة.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {nonParticipatingStudents.slice(0, 4).map((stu) => {
              const hasReg = registrations.some((r) => r.studentId === stu.id);
              return (
                <div
                  key={stu.id}
                  className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] flex flex-col justify-between gap-2"
                >
                  <div>
                    <span className="text-[13px] font-semibold text-[#1d1d1f] block truncate">
                      {stu.name}
                    </span>
                    <span className="text-[11px] text-[#86868b] block mt-0.5">
                      {stu.stage === 'primary' ? 'ابتدائي' : 'متوسط'} · {stu.grade} · {stu.classroom}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-black/[0.05] text-[11px]">
                    <span className={hasReg ? 'text-[#0071e3] font-medium' : 'text-amber-700 font-medium'}>
                      {hasReg ? 'مسجل ولم يكمل' : 'لم يسجل بعد'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onNavigate('non-participating')}
                      className="text-[#0071e3] hover:underline font-medium cursor-pointer"
                    >
                      متابعة ←
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
