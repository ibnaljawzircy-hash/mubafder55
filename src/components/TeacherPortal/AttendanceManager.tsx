import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  GraduationCap,
  HeartHandshake,
  Minus,
  Phone,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../../types';
import { resolveActivityDomainMeta } from '../../utils/programHelpers';

interface AttendanceManagerProps {
  programs: ActivityProgram[];
  tasks: VolunteerTask[];
  students: Student[];
  registrations: VolunteerRegistration[];
  onApproveRegistration: (registrationId: string) => void;
  onCertifyHours: (registrationId: string, hours?: number) => void;
  onRejectRegistration: (registrationId: string) => void;
  onUpdateRegistration: (registrationId: string, updates: Partial<VolunteerRegistration>) => void;
  onBulkMarkAttendance: (taskId: string, status: 'attended' | 'completed') => void;
  onAddStudentToTask: (taskId: string, studentId: string) => void;
  onUncertifyHours?: (registrationId: string) => void;
  onDeleteRegistration?: (registrationId: string) => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  programs,
  tasks,
  students,
  registrations,
  onApproveRegistration,
  onCertifyHours,
  onRejectRegistration,
  onUpdateRegistration,
  onBulkMarkAttendance,
  onAddStudentToTask,
  onUncertifyHours,
  onDeleteRegistration,
}) => {
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [manualProgramId, setManualProgramId] = useState<string>(programs[0]?.id || '');
  const [manualStudentId, setManualStudentId] = useState('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Modal states for Editing Hours, Uncertifying, and Deleting
  const [editingHoursReg, setEditingHoursReg] = useState<{
    id: string;
    studentName: string;
    currentHours: number;
    programName?: string;
  } | null>(null);
  const [editHoursValue, setEditHoursValue] = useState<number>(2);

  const [uncertifyingReg, setUncertifyingReg] = useState<{
    id: string;
    studentName: string;
    programName?: string;
    hoursAwarded: number;
  } | null>(null);

  const [deletingReg, setDeletingReg] = useState<{
    id: string;
    studentName: string;
    programName?: string;
    hoursAwarded: number;
    isCompleted: boolean;
  } | null>(null);

  // Group registrations by Initiative / Program
  // Helper to map taskId to program
  const getProgramForTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return null;
    return programs.find((p) => p.id === task.programId) || null;
  };

  // Enriched registrations with program and student info
  const enrichedRegistrations = registrations.map((reg) => {
    const task = tasks.find((t) => t.id === reg.taskId);
    const prog =
      programs.find((p) => p.id === reg.programId) ||
      (task ? programs.find((p) => p.id === task.programId) : null);
    const student = students.find((s) => s.id === reg.studentId);

    const isPending = reg.approvalStatus === 'pending' || (reg.attendanceStatus === 'registered' && !reg.approvalStatus);
    const isCompleted = reg.attendanceStatus === 'completed';
    const isApproved = (reg.approvalStatus === 'approved' || reg.attendanceStatus === 'attended') && !isCompleted;

    return {
      ...reg,
      task,
      program: prog,
      student,
      isPending,
      isApproved,
      isCompleted,
    };
  });

  // Calculate high-level stats
  const totalRequests = enrichedRegistrations.length;
  const pendingCount = enrichedRegistrations.filter((r) => r.isPending).length;
  const approvedCount = enrichedRegistrations.filter((r) => r.isApproved).length;
  const completedCount = enrichedRegistrations.filter((r) => r.isCompleted).length;
  const totalHoursAwarded = enrichedRegistrations
    .filter((r) => r.isCompleted)
    .reduce((sum, r) => sum + r.hoursAwarded, 0);

  // Filtered registrations
  const filteredRegs = enrichedRegistrations.filter((r) => {
    // Filter by program
    if (selectedProgramFilter !== 'all') {
      const progId = r.program?.id || r.task?.programId;
      if (progId !== selectedProgramFilter) return false;
    }

    // Filter by status
    if (statusFilter === 'pending' && !r.isPending) return false;
    if (statusFilter === 'approved' && !r.isApproved) return false;
    if (statusFilter === 'completed' && !r.isCompleted) return false;

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = r.studentName.toLowerCase().includes(q);
      const matchMobile = r.studentMobile?.includes(q) || r.student?.mobile.includes(q);
      const matchProgram = r.program?.name.toLowerCase().includes(q) || r.programName?.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchProgram) return false;
    }

    return true;
  });

  // Group the filtered registrations by Program / Initiative
  // Programs that have registrations
  const programsWithRegs = programs
    .map((prog) => {
      const progRegs = filteredRegs.filter(
        (r) => (r.program?.id === prog.id) || (r.task?.programId === prog.id) || (r.programId === prog.id)
      );
      return {
        prog,
        regs: progRegs,
      };
    })
    .filter((group) => {
      // If user selected a specific program, show only that
      if (selectedProgramFilter !== 'all') {
        return group.prog.id === selectedProgramFilter;
      }
      // If filtering by search/status, only show programs that have matching registrations
      return group.regs.length > 0;
    });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualProgramId || !manualStudentId) return;

    // Find or create task for program
    let task = tasks.find((t) => t.programId === manualProgramId);
    if (!task) {
      alert('يرجى التأكد من وجود مهمة في هذه المبادرة أولاً.');
      return;
    }

    onAddStudentToTask(task.id, manualStudentId);
    setManualStudentId('');
    setShowAddStudentModal(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top Banner & Statistics - Apple Style */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] sm:text-[12px] font-semibold text-[#86868b] uppercase tracking-wide">
              لوحة تحكم المشرف التربوي · مدرسة ابن الجوزي
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              طلبات الانضمام وتوثيق الساعات لكل مبادرة.
            </h1>
            <p className="text-[13px] text-[#86868b] leading-relaxed max-w-2xl">
              تصلك هنا طلبات الطلاب للانضمام لكل مبادرة. يمكنك الموافقة الفورية على الطلب، واعتماد وتوثيق الساعات المكتسبة بعد انتهاء المبادرة والتأكد من مشاركة الطالب.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-4 py-2.5 bg-[#ffffff] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[13px] font-medium rounded-full border border-black/[0.08] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0071e3]" />
              <span>إضافة طالب يدوياً</span>
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#ffffff] border-[#0071e3] shadow-[0_4px_12px_rgba(0,113,227,0.12)]'
                : 'bg-[#f5f5f7] border-black/[0.04] hover:bg-[#e8e8ed]'
            }`}
          >
            <span className="text-[11px] text-[#86868b] block mb-1">إجمالي طلبات الانضمام</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] font-mono tabular-nums">
                {totalRequests}
              </span>
              <span className="text-[11px] text-[#86868b]">طالب</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-50/80 border-amber-500 shadow-[0_4px_12px_rgba(245,158,11,0.15)]'
                : 'bg-[#f5f5f7] border-black/[0.04] hover:bg-[#e8e8ed]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-[#86868b]">بانتظار موافقة المشرف</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-amber-600 font-mono tabular-nums">
                {pendingCount}
              </span>
              <span className="text-[11px] text-amber-700">طلب جديد</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('approved')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'approved'
                ? 'bg-sky-50/80 border-[#0071e3] shadow-[0_4px_12px_rgba(0,113,227,0.15)]'
                : 'bg-[#f5f5f7] border-black/[0.04] hover:bg-[#e8e8ed]'
            }`}
          >
            <span className="text-[11px] text-[#86868b] block mb-1">تم قبول انضمامهم</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-[#0071e3] font-mono tabular-nums">
                {approvedCount}
              </span>
              <span className="text-[11px] text-[#86868b]">مشارك</span>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter('completed')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.15)]'
                : 'bg-[#f5f5f7] border-black/[0.04] hover:bg-[#e8e8ed]'
            }`}
          >
            <span className="text-[11px] text-[#86868b] block mb-1">الساعات المعتمدة والموثقة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold text-emerald-600 font-mono tabular-nums">
                {totalHoursAwarded}
              </span>
              <span className="text-[11px] text-emerald-700 font-mono">ساعة ({completedCount} طلاب)</span>
            </div>
          </div>
        </div>

        {/* Filter Bar: Select Program + Status + Search */}
        <div className="pt-4 border-t border-black/[0.04] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedProgramFilter}
              onChange={(e) => setSelectedProgramFilter(e.target.value)}
              className="px-4 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] text-[#1d1d1f] font-medium"
            >
              <option value="all">جميع المبادرات والأنشطة ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3.5 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none text-[#1d1d1f]"
            >
              <option value="all">جميع حالات الطلب</option>
              <option value="pending">بانتظار موافقة المشرف ({pendingCount})</option>
              <option value="approved">تم قبول الانضمام ({approvedCount})</option>
              <option value="completed">تم اعتماد وتوثيق الساعات ({completedCount})</option>
            </select>
          </div>

          <div className="relative sm:w-72">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute right-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم الطالب أو رقم الجوال..."
              className="w-full pr-9 pl-3 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] placeholder:text-[#86868b]"
            />
          </div>
        </div>
      </div>

      {/* ================= LIST OF INITIATIVES WITH JOINING STUDENTS ================= */}
      {programsWithRegs.length === 0 ? (
        <div className="text-center py-20 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-8 space-y-3">
          <HeartHandshake className="w-12 h-12 text-[#86868b] mx-auto opacity-30" />
          <h3 className="text-lg font-semibold text-[#1d1d1f]">لا توجد طلبات انضمام مطابقة للبحث</h3>
          <p className="text-[13px] text-[#86868b] max-w-md mx-auto">
            عند قيام الطلاب بالنقر على «انضمام للمبادرة» وإدخال رقم الجوال وآخر 5 أرقام، ستصلك طلباتهم هنا فورياً للموافقة واعتماد الساعات.
          </p>
          <button
            onClick={() => {
              setSelectedProgramFilter('all');
              setStatusFilter('all');
              setSearchTerm('');
            }}
            className="px-4 py-2 bg-[#0071e3] text-white text-[12px] font-medium rounded-full cursor-pointer"
          >
            إعادة تعيين التصفية
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {programsWithRegs.map(({ prog, regs }) => {
            const progPending = regs.filter((r) => r.isPending).length;
            const progApproved = regs.filter((r) => r.isApproved).length;
            const progCompleted = regs.filter((r) => r.isCompleted).length;
            const targetTask = tasks.find((t) => t.programId === prog.id);
            const defaultHours = targetTask?.hours || 2;

            const progDomainMeta = resolveActivityDomainMeta(prog.domain, prog.domainName);

            return (
              <div
                key={prog.id}
                className="bg-[#ffffff] rounded-3xl border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all"
              >
                {/* Initiative Header Strip */}
                <div className="p-5 sm:p-6 bg-[#fbfbfd] border-b border-black/[0.04] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${progDomainMeta.bgColor} ${progDomainMeta.badgeColor}`}>
                        {progDomainMeta.name}
                      </span>
                      <span className="text-[11px] font-medium text-[#0071e3] bg-[#ffffff] border border-black/[0.06] px-2.5 py-0.5 rounded-full">
                        {prog.stageLabel}
                      </span>
                      <span className="text-[11px] text-[#86868b]">·</span>
                      <span className="text-[11px] text-[#86868b] flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-[#86868b]" />
                        {prog.gregorianDate}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                      {prog.name}
                    </h2>

                    <div className="flex items-center gap-3 text-[12px] text-[#86868b]">
                      <span>إجمالي الطلاب المتقدمين: <strong className="text-[#1d1d1f] font-mono">{regs.length}</strong></span>
                      <span>·</span>
                      <span>بانتظار الموافقة: <strong className={progPending > 0 ? 'text-amber-600 font-mono' : 'text-[#86868b]'}>{progPending}</strong></span>
                      <span>·</span>
                      <span>الساعات المقررة: <strong className="text-[#0071e3] font-mono">{defaultHours} ساعات</strong></span>
                    </div>
                  </div>

                  {/* Bulk Actions for this initiative */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {progPending > 0 && (
                      <button
                        onClick={() => {
                          regs.filter((r) => r.isPending).forEach((r) => onApproveRegistration(r.id));
                        }}
                        className="px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#e8e8ed] text-emerald-700 text-[12px] font-medium rounded-full border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>موافقة على جميع الطلبات ({progPending})</span>
                      </button>
                    )}

                    {targetTask && (
                      <button
                        onClick={() => onBulkMarkAttendance(targetTask.id, 'completed')}
                        className="px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-medium rounded-full transition-colors flex items-center gap-1.5 shadow-none cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>اعتماد الساعات لجميع المشاركين</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table of Students who Requested to Join this Initiative */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[12px]">
                    <thead className="bg-[#f5f5f7]/70 text-[#86868b] font-medium border-b border-black/[0.04]">
                      <tr>
                        <th className="p-3.5 w-12 text-center">م</th>
                        <th className="p-3.5">اسم الطالب</th>
                        <th className="p-3.5">رقم الجوال</th>
                        <th className="p-3.5">الصف والمرحلة</th>
                        <th className="p-3.5">تاريخ الطلب</th>
                        <th className="p-3.5">حالة الطلب</th>
                        <th className="p-3.5 text-center">الساعات المعتمدة</th>
                        <th className="p-3.5 min-w-[280px] text-center">الإجراءات والاعتماد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {regs.map((reg, idx) => {
                        const studentMobile = reg.studentMobile || reg.student?.mobile || '-';
                        const stageLabel =
                          reg.studentStage === 'primary' ? 'الابتدائية' : 'المتوسطة';

                        return (
                          <tr
                            key={reg.id}
                            className={`transition-colors ${
                              reg.isPending
                                ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                : reg.isCompleted
                                ? 'bg-emerald-50/15 hover:bg-emerald-50/30'
                                : 'hover:bg-[#f5f5f7]/50'
                            }`}
                          >
                            {/* 1. Index */}
                            <td className="p-3.5 text-center font-mono text-[#86868b]">
                              {idx + 1}
                            </td>

                            {/* 2. Student Name */}
                            <td className="p-3.5 font-semibold text-[#1d1d1f]">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#f5f5f7] border border-black/[0.06] flex items-center justify-center font-semibold text-[11px] text-[#1d1d1f] shrink-0">
                                  {reg.studentName.charAt(0)}
                                </div>
                                <div>
                                  <span className="block">{reg.studentName}</span>
                                  <span className="text-[10px] text-[#86868b] font-mono">
                                    سجل: {reg.studentId}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 3. Mobile Number */}
                            <td className="p-3.5 font-mono text-[#1d1d1f] tabular-nums">
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#86868b]" />
                                <span>{studentMobile}</span>
                              </div>
                            </td>

                            {/* 4. Grade & Stage */}
                            <td className="p-3.5 text-[#86868b]">
                              <span>
                                {reg.student?.grade || stageLabel}
                                {reg.student?.classroom ? ` (${reg.student.classroom})` : ''}
                              </span>
                            </td>

                            {/* 5. Request Time */}
                            <td className="p-3.5 text-[#86868b] font-mono text-[11px] whitespace-nowrap">
                              {reg.registeredAt}
                            </td>

                            {/* 6. Request Status */}
                            <td className="p-3.5 whitespace-nowrap">
                              {reg.isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>طلب جديد بانتظار الموافقة</span>
                                </span>
                              ) : reg.isCompleted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>تم اعتماد الساعات (موثق)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-100 text-sky-800 border border-sky-200">
                                  <Check className="w-3 h-3 text-sky-600" />
                                  <span>تم قبول الانضمام</span>
                                </span>
                              )}
                            </td>

                            {/* 7. Hours Awarded */}
                            <td className="p-3.5 text-center font-mono">
                              {reg.isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingHoursReg({
                                      id: reg.id,
                                      studentName: reg.studentName,
                                      currentHours: reg.hoursAwarded,
                                      programName: reg.program?.name || prog.name,
                                    });
                                    setEditHoursValue(reg.hoursAwarded || defaultHours);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 transition-all cursor-pointer group"
                                  title="انقر لتعديل عدد الساعات المعتمدة"
                                >
                                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="font-bold text-[13px]">{reg.hoursAwarded} س</span>
                                  <Edit3 className="w-3 h-3 text-emerald-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-[#86868b] bg-[#f5f5f7] px-2.5 py-1 rounded-xl text-[11px] border border-black/[0.04]">
                                  {defaultHours} س مقترحة
                                </span>
                              )}
                            </td>

                            {/* 8. Action Buttons: 'تعديل الساعات', 'عدم الاعتماد', 'حذف من المبادرة' */}
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* If pending: Approve button */}
                                {reg.isPending && (
                                  <button
                                    onClick={() => onApproveRegistration(reg.id)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer shadow-none"
                                    title="الموافقة على انضمام الطالب في المبادرة"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>موافق</span>
                                  </button>
                                )}

                                {/* If Completed (Certified):
                                    1. تعديل عدد الساعات
                                    2. عدم الاعتماد (إلغاء التوثيق)
                                    3. حذف الطالب من المبادرة
                                */}
                                {reg.isCompleted ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingHoursReg({
                                          id: reg.id,
                                          studentName: reg.studentName,
                                          currentHours: reg.hoursAwarded,
                                          programName: reg.program?.name || prog.name,
                                        });
                                        setEditHoursValue(reg.hoursAwarded || defaultHours);
                                      }}
                                      className="px-2.5 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[11px] font-medium rounded-full border border-black/[0.08] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="تعديل عدد الساعات المعتمدة لهذا الطالب"
                                    >
                                      <Edit3 className="w-3 h-3 text-[#0071e3]" />
                                      <span>تعديل الساعات</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUncertifyingReg({
                                          id: reg.id,
                                          studentName: reg.studentName,
                                          programName: reg.program?.name || prog.name,
                                          hoursAwarded: reg.hoursAwarded,
                                        });
                                      }}
                                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-medium rounded-full border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="عدم الاعتماد / إلغاء توثيق الساعات"
                                    >
                                      <RotateCcw className="w-3 h-3 text-amber-600" />
                                      <span>عدم الاعتماد</span>
                                    </button>
                                  </>
                                ) : (
                                  /* If not completed (pending or approved):
                                     Allow certifying default hours or customizing
                                  */
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => onCertifyHours(reg.id, defaultHours)}
                                      className="px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-medium rounded-full transition-all flex items-center gap-1.5 shadow-none cursor-pointer group"
                                      title="اعتماد الساعات بعد انتهاء المبادرة والتأكد من مشاركة الطالب"
                                    >
                                      <Award className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                                      <span>اعتماد الساعات ({defaultHours}س)</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingHoursReg({
                                          id: reg.id,
                                          studentName: reg.studentName,
                                          currentHours: defaultHours,
                                          programName: reg.program?.name || prog.name,
                                        });
                                        setEditHoursValue(defaultHours);
                                      }}
                                      className="p-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#1d1d1f] rounded-full border border-black/[0.06] transition-colors cursor-pointer"
                                      title="تخصيص عدد ساعات واعتمادها"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}

                                {/* Optional Reject (only if pending) */}
                                {reg.isPending && (
                                  <button
                                    type="button"
                                    onClick={() => onRejectRegistration(reg.id)}
                                    className="p-1.5 text-[#86868b] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                    title="رفض أو اعتذار عن الطلب"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Delete Registration from Initiative Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeletingReg({
                                      id: reg.id,
                                      studentName: reg.studentName,
                                      programName: reg.program?.name || prog.name,
                                      hoursAwarded: reg.hoursAwarded,
                                      isCompleted: reg.isCompleted,
                                    });
                                  }}
                                  className="p-1.5 text-[#86868b] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                  title="حذف الطالب من المبادرة نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <span className="block text-[10px] text-[#86868b] mt-1 text-center">
                                {reg.isCompleted
                                  ? 'ساعات موثقة · خيارات التعديل والإلغاء متاحة'
                                  : 'بعد انتهاء المبادرة والتأكد من مشاركة الطالب'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Add Student to Initiative Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative space-y-5">
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
                إضافة طالب يدوياً
              </span>
              <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                إدراج طالب في كشف المبادرة
              </h3>
              <p className="text-[12px] text-[#86868b]">
                اختر المبادرة والطالب لإضافته فورياً إلى كشف المشاركين.
              </p>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  المبادرة أو النشاط:
                </label>
                <select
                  value={manualProgramId}
                  onChange={(e) => setManualProgramId(e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                  required
                >
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stageLabel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  اختر الطالب من قائمة الطلاب:
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                  required
                >
                  <option value="">-- اختر طالباً --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.grade} - {s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-[12px] text-[#86868b] hover:text-[#1d1d1f]"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!manualStudentId || !manualProgramId}
                  className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white text-[13px] font-medium rounded-full cursor-pointer"
                >
                  إضافة واعتماد المشاركة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT HOURS (تعديل الساعات المعتمدة) ================= */}
      {editingHoursReg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative space-y-5">
            <button
              onClick={() => setEditingHoursReg(null)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#0071e3] uppercase tracking-wide">
                لوحة المشرف · تعديل وتوثيق الساعات
              </span>
              <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
                تعديل عدد الساعات المعتمدة
              </h3>
              <p className="text-[12px] text-[#86868b]">
                الطالب: <strong className="text-[#1d1d1f]">{editingHoursReg.studentName}</strong>
                {editingHoursReg.programName && (
                  <> · المبادرة: <span className="text-[#1d1d1f]">{editingHoursReg.programName}</span></>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-2">
                  عدد الساعات المعتمدة والموثقة:
                </label>

                {/* Number Stepper */}
                <div className="flex items-center justify-center gap-3 bg-[#f5f5f7] p-2 rounded-2xl border border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setEditHoursValue((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-[#ffffff] hover:bg-[#e8e8ed] text-[#1d1d1f] font-bold flex items-center justify-center border border-black/[0.08] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex items-baseline gap-1 text-center min-w-[100px] justify-center">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editHoursValue}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setEditHoursValue(Math.max(1, Math.min(100, val)));
                      }}
                      className="w-16 text-center text-3xl font-bold text-[#0071e3] font-mono bg-transparent focus:outline-none"
                    />
                    <span className="text-[13px] text-[#86868b] font-medium">ساعات</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditHoursValue((prev) => Math.min(100, prev + 1))}
                    className="w-10 h-10 rounded-xl bg-[#ffffff] hover:bg-[#e8e8ed] text-[#1d1d1f] font-bold flex items-center justify-center border border-black/[0.08] transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] text-[#86868b] mb-1.5">خيارات سريعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 8, 10].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setEditHoursValue(h)}
                      className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-all cursor-pointer ${
                        editHoursValue === h
                          ? 'bg-[#0071e3] text-white border-[#0071e3]'
                          : 'bg-[#ffffff] text-[#1d1d1f] border-black/[0.08] hover:bg-[#f5f5f7]'
                      }`}
                    >
                      {h} {h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : 'ساعات'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingHoursReg(null)}
                  className="px-4 py-2 text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCertifyHours(editingHoursReg.id, editHoursValue);
                    setEditingHoursReg(null);
                  }}
                  className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-none"
                >
                  <Award className="w-4 h-4" />
                  <span>حفظ واعتماد الساعات ({editHoursValue}س)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UNCERTIFY HOURS (عدم الاعتماد / إلغاء التوثيق) ================= */}
      {uncertifyingReg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative space-y-4">
            <button
              onClick={() => setUncertifyingReg(null)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                تأكيد عدم الاعتماد وإلغاء توثيق الساعات
              </h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                هل أنت متأكد من إلغاء اعتماد وتوثيق الساعات ({uncertifyingReg.hoursAwarded} ساعة) للطالب{' '}
                <strong className="text-[#1d1d1f]">«{uncertifyingReg.studentName}»</strong>؟
              </p>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 text-[12px] text-amber-900 leading-relaxed">
              سيتم إعادة حالة الطالب إلى (مشارك مقبول) دون ساعات معتمدة، وخصم الساعات من رصيد الطالب وإحصائيات المنصة فوراً مع حفظ التغيير.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUncertifyingReg(null)}
                className="px-4 py-2 text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUncertifyHours) {
                    onUncertifyHours(uncertifyingReg.id);
                  } else {
                    onUpdateRegistration(uncertifyingReg.id, {
                      attendanceStatus: 'attended',
                      hoursAwarded: 0,
                    });
                  }
                  setUncertifyingReg(null);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-none"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>نعم، تأكيد عدم الاعتماد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE REGISTRATION (حذف الطالب من المبادرة) ================= */}
      {deletingReg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] relative space-y-4">
            <button
              onClick={() => setDeletingReg(null)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                حذف الطالب من كشف المبادرة
              </h3>
              <p className="text-[13px] text-[#86868b] leading-relaxed">
                هل أنت متأكد من حذف الطالب{' '}
                <strong className="text-[#1d1d1f]">«{deletingReg.studentName}»</strong> من مبادرة{' '}
                <span className="text-[#1d1d1f] font-medium">{deletingReg.programName || 'هذه المبادرة'}</span>؟
              </p>
            </div>

            <div className="p-3 bg-red-50/60 rounded-2xl border border-red-200/60 text-[12px] text-red-900 leading-relaxed">
              سيتم حذف طلب وتسجيل الطالب بالكامل من هذه المبادرة. إذا كان الطالب قد حصل على ساعات موثقة، فسيتم إزالتها وتحديث إحصائيات المدرسة تلقائياً.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingReg(null)}
                className="px-4 py-2 text-[12px] text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteRegistration) {
                    onDeleteRegistration(deletingReg.id);
                  }
                  setDeletingReg(null);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأكيد حذف الطالب</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
