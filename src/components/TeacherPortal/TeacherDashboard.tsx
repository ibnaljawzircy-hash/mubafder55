import React from 'react';
import {
  AlertCircle,
  Award,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  GraduationCap,
  Lock,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../../types';
import { VolunteerIndicators } from '../VolunteerIndicators';
import {
  getProgramSeatStats,
  getProgramStatus,
  resolveActivityDomainMeta,
  resolveProgramDomainId,
  resolveRegistrationDomainId,
  resolveTaskDomainId,
  sortProgramsChronologically,
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

  // Initiatives seat overview (active & upcoming first, then any full/other)
  const initiativeSeatRows = sortProgramsChronologically(programs)
    .map((prog) => {
      const status = getProgramStatus(prog);
      const seatStats = getProgramSeatStats(prog, tasks, registrations);
      const domainMeta = resolveActivityDomainMeta(prog.domain, prog.domainName);
      return { prog, status, seatStats, domainMeta };
    })
    .filter((item) => item.status !== 'completed');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner and 5 Strategic KPIs */}
      <VolunteerIndicators
        programs={programs}
        students={students}
        tasks={tasks}
        registrations={registrations}
        headingLevel="h1"
        actions={
          <>
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
          </>
        }
      />

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

      {/* Supervisor Overview: Initiatives Seat Capacity (Total & Remaining) */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[12px] text-[#86868b]">
              <Users className="w-4 h-4 text-[#0071e3]" />
              <span>سعة المقاعد في المبادرات النشطة والقادمة</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{initiativeSeatRows.length} مبادرة</span>
            </div>
            <h3 className="text-lg font-semibold text-[#1d1d1f]">
              متابعة المقاعد المتاحة والمتبقية للمبادرات
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('programs')}
            className="px-4 py-2 text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            إدارة وتعديل المقاعد ←
          </button>
        </div>

        {initiativeSeatRows.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#86868b]">
            لا توجد مبادرات جارية أو قادمة حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[12px]">
              <thead className="bg-[#f5f5f7] text-[#86868b] font-medium border-b border-black/[0.04]">
                <tr>
                  <th className="p-3">المبادرة</th>
                  <th className="p-3">المجال والتاريخ</th>
                  <th className="p-3 text-center">عدد المقاعد المتاحة</th>
                  <th className="p-3 text-center">المسجلون</th>
                  <th className="p-3 text-center">المقاعد المتبقية</th>
                  <th className="p-3 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {initiativeSeatRows.map(({ prog, status, seatStats, domainMeta }) => (
                  <tr key={prog.id} className="hover:bg-[#f5f5f7]/60 transition-colors">
                    <td className="p-3 font-semibold text-[#1d1d1f] max-w-[260px]">
                      <span className="block truncate">{prog.name}</span>
                    </td>
                    <td className="p-3 text-[#6e6e73] whitespace-nowrap">
                      <span>{domainMeta.name}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{prog.gregorianDate}</span>
                    </td>
                    <td className="p-3 text-center font-mono tabular-nums font-semibold text-[#1d1d1f]">
                      {seatStats.maxSeats !== null ? seatStats.maxSeats : 'مفتوح'}
                    </td>
                    <td className="p-3 text-center font-mono tabular-nums text-[#6e6e73]">
                      {seatStats.occupiedSeats}
                    </td>
                    <td className="p-3 text-center font-mono tabular-nums font-bold">
                      {seatStats.maxSeats !== null ? (
                        <span
                          className={
                            seatStats.isFull
                              ? 'text-rose-600'
                              : seatStats.remainingSeats !== null && seatStats.remainingSeats <= 3
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }
                        >
                          {seatStats.remainingSeats}
                        </span>
                      ) : (
                        <span className="text-[#86868b] font-normal">مفتوح</span>
                      )}
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {seatStats.isFull ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700">
                          <Lock className="w-3 h-3" />
                          <span>مقفلة · اكتمل العدد</span>
                        </span>
                      ) : status === 'ongoing' ? (
                        <span className="text-[11px] font-semibold text-emerald-700">
                          جاري تنفيذها
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-amber-800">
                          قادمة
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
