import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit3,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Lock,
  Plus,
  Percent,
  FileSpreadsheet,
  Share2,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../../types';
import { getProgramStatus, sortProgramsChronologically, parseProgramDate } from '../../utils/programHelpers';
import { AddProgramModal } from './AddProgramModal';
import { AddTaskModal } from './AddTaskModal';
import { EditProgramModal } from './EditProgramModal';
import { EditTaskModal } from './EditTaskModal';
import { WhatsAppShareModal } from './WhatsAppShareModal';
import { ImportProgramsModal } from './ImportProgramsModal';
import { TaskRegistrationModal } from '../StudentPortal/TaskRegistrationModal';

interface ProgramsExplorerProps {
  programs: ActivityProgram[];
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  students: Student[];
  currentStudent: Student | null;
  isSupervisor?: boolean;
  onAddProgram: (program: Omit<ActivityProgram, 'id'>) => void;
  onBatchAddPrograms?: (programs: ActivityProgram[], tasks: VolunteerTask[]) => void;
  onUpdateProgram?: (program: ActivityProgram) => void;
  onDeleteProgram?: (programId: string) => void;
  onAddTask: (task: Omit<VolunteerTask, 'id' | 'checkInCode'>) => void;
  onUpdateTask?: (task: VolunteerTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onConfirmRegistration: (student: Student, taskId: string) => void;
  onApproveRegistration?: (registrationId: string) => void;
  onCertifyHours?: (registrationId: string, hours?: number) => void;
  onOpenCertificate?: () => void;
  onOpenMyTasks?: () => void;
  onRequestSupervisorAccess: () => void;
  onRequestStudentLogin: () => void;
}

export const ProgramsExplorer: React.FC<ProgramsExplorerProps> = ({
  programs,
  tasks,
  registrations,
  students,
  currentStudent,
  isSupervisor = false,
  onAddProgram,
  onBatchAddPrograms,
  onUpdateProgram,
  onDeleteProgram,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onConfirmRegistration,
  onApproveRegistration,
  onCertifyHours,
  onOpenCertificate,
  onOpenMyTasks,
  onRequestSupervisorAccess,
  onRequestStudentLogin,
}) => {
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('program') || params.get('p') || null;
    }
    return null;
  });

  // Strict Permissions: A logged-in student NEVER receives supervisor powers.
  // Adding tasks, editing initiatives, and deleting are exclusively for the verified supervisor.
  const isEffectiveSupervisor = Boolean(isSupervisor && !currentStudent);

  // Modals state
  const [isAddProgramOpen, setIsAddProgramOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [programToEdit, setProgramToEdit] = useState<ActivityProgram | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<VolunteerTask | null>(null);
  const [programForWhatsApp, setProgramForWhatsApp] = useState<ActivityProgram | null>(null);
  const [taskForRegistration, setTaskForRegistration] = useState<VolunteerTask | null>(null);
  const [programToDelete, setProgramToDelete] = useState<ActivityProgram | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<VolunteerTask | null>(null);
  // Status filter state: 'all' | 'ongoing' | 'upcoming' | 'completed'
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');

  // Chronologically sorted programs (التسلسل التاريخي)
  const chronologicalPrograms = React.useMemo(() => {
    return sortProgramsChronologically(programs);
  }, [programs]);

  // Currently active initiatives for direct spotlight (الرؤية المباشرة للمبادرة الجاري تنفيذها)
  const ongoingPrograms = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'ongoing');
  }, [chronologicalPrograms]);

  // Filtered initiatives according to user's selected tab
  const filteredPrograms = React.useMemo(() => {
    if (statusFilter === 'all') return chronologicalPrograms;
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === statusFilter);
  }, [chronologicalPrograms, statusFilter]);

  const ongoingCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'ongoing').length;
  }, [chronologicalPrograms]);

  const upcomingCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'upcoming').length;
  }, [chronologicalPrograms]);

  const completedCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'completed').length;
  }, [chronologicalPrograms]);

  // Top 5 Focus Strategic Metrics
  const totalCertifiedHours = React.useMemo(() => {
    return registrations
      .filter((r) => r.attendanceStatus === 'completed')
      .reduce((sum, r) => sum + r.hoursAwarded, 0);
  }, [registrations]);

  const activeVolunteersCount = React.useMemo(() => {
    return new Set(
      registrations
        .filter((r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended')
        .map((r) => r.studentId)
    ).size;
  }, [registrations]);

  const volunteerRatioPercent =
    students.length > 0 ? Math.round((activeVolunteersCount / students.length) * 100) : 0;

  const executedInitiativesCount = React.useMemo(() => {
    return programs.filter((p) =>
      registrations.some(
        (r) =>
          r.attendanceStatus === 'completed' &&
          (r.programId === p.id || tasks.some((t) => t.id === r.taskId && t.programId === p.id))
      )
    ).length;
  }, [programs, registrations, tasks]);

  const attendanceCommitmentRate = React.useMemo(() => {
    const attended = registrations.filter(
      (r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended'
    ).length;
    const absent = registrations.filter((r) => r.attendanceStatus === 'absent').length;
    const evaluated = attended + absent;
    return evaluated > 0 ? Math.round((attended / evaluated) * 100) : 100;
  }, [registrations]);

  const averageSatisfaction = React.useMemo(() => {
    const rated = registrations.filter((r) => typeof r.rating === 'number' && r.rating > 0);
    return rated.length > 0
      ? (rated.reduce((sum, r) => sum + (r.rating || 5), 0) / rated.length).toFixed(1)
      : '5.0';
  }, [registrations]);

  const handleSelectProgram = (id: string | null) => {
    setSelectedProgramId(id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (id) {
        url.searchParams.set('program', id);
      } else {
        url.searchParams.delete('program');
        url.searchParams.delete('p');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  const selectedProgram = programs.find((p) => p.id === selectedProgramId);
  const tasksForSelectedProgram = tasks.filter((t) => t.programId === selectedProgramId);

  const selectedProgramRegs = registrations.filter((r) => {
    if (!selectedProgramId) return false;
    return r.programId === selectedProgramId || tasks.some((t) => t.id === r.taskId && t.programId === selectedProgramId);
  });

  const currentStudentProgramReg = currentStudent
    ? selectedProgramRegs.find((r) => r.studentId === currentStudent.id)
    : null;

  const isStudentRegistered = (taskId: string) => {
    if (!currentStudent) return false;
    return registrations.some((r) => r.taskId === taskId && r.studentId === currentStudent.id);
  };

  const handleJoinInitiative = (targetProg?: ActivityProgram) => {
    const progToJoin = targetProg || selectedProgram;
    if (!progToJoin) return;

    if (getProgramStatus(progToJoin) === 'completed') {
      alert('هذه المبادرة منتهية ومقفلة، انتهت فترة التسجيل والمشاركة.');
      return;
    }

    const progTasks = tasks.filter((t) => t.programId === progToJoin.id);
    let availableTask =
      progTasks.find((t) => !isStudentRegistered(t.id)) ||
      progTasks[0];

    // If program doesn't have an explicit task created yet, create a default volunteer task on the fly
    if (!availableTask) {
      availableTask = {
        id: `task-prog-${progToJoin.id}`,
        programId: progToJoin.id,
        programName: progToJoin.name,
        domain: progToJoin.domain,
        title: `المشاركة والتطوع في ${progToJoin.name}`,
        description: progToJoin.description,
        stage: progToJoin.stage,
        hours: 2,
        maxVolunteers: 25,
        date: progToJoin.gregorianDate.replace(/\//g, '-'),
        time: '08:00 ص - 10:00 ص',
        location: 'مدرسة ابن الجوزي للموهوبين',
        supervisorName: 'رائد النشاط الطلابي',
        requiredSkills: ['المبادرة', 'التعاون', 'الالتزام'],
        status: 'open',
        checkInCode: `VOL-${Math.floor(100 + Math.random() * 900)}`,
      };
    }

    if (availableTask) {
      setTaskForRegistration(availableTask);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* If student is logged in: clean greeting banner */}
      {currentStudent && (
        <div className="bg-[#ffffff] rounded-2xl p-4 sm:p-5 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f5f5f7] text-[#1d1d1f] font-semibold flex items-center justify-center text-sm border border-black/[0.06] shrink-0">
              {currentStudent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold text-[#1d1d1f]">{currentStudent.name}</span>
                <span className="text-[11px] text-[#86868b] bg-[#f5f5f7] px-2 py-0.5 rounded-full">
                  {currentStudent.stage === 'primary' ? 'المرحلة الابتدائية' : 'المرحلة المتوسطة'}
                </span>
              </div>
              <div className="text-[12px] text-[#86868b] flex items-center gap-2 mt-0.5">
                <span className="font-mono font-semibold text-[#0071e3]">{currentStudent.totalHours} ساعات موثقة</span>
                <span>·</span>
                <span>{currentStudent.badgeLevel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onOpenMyTasks && (
              <button
                onClick={onOpenMyTasks}
                className="px-4 py-2 text-[12px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors flex-1 sm:flex-none text-center cursor-pointer"
              >
                سجل ساعاتي
              </button>
            )}
            {onOpenCertificate && (
              <button
                onClick={onOpenCertificate}
                className="px-4 py-2 text-[12px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none shadow-none cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>شهادة التطوع</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content View */}
      {!selectedProgram ? (
        /* ================= FIRST PAGE: INITIATIVES CARDS (MOBILE OPTIMIZED) ================= */
        <div className="space-y-6">
          {/* Header Title & Subtitle + Supervisor Add Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="text-center sm:text-right space-y-1.5">
              <span className="text-[11px] sm:text-[12px] font-semibold text-[#86868b] tracking-wide uppercase">
                منصة مبادر بمدرسة ابن الجوزي للموهوبين
              </span>
              <h1 className="text-2xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight leading-tight">
                بادر بالتطوع، وكن جزءاً من التغيير في مجتمعك المدرسي.
              </h1>
              <p className="text-[13px] sm:text-[15px] text-[#86868b] leading-relaxed">
                عطاء يصنع الفرق في ذاتك ومهاراتك ومجتمعك
              </p>
            </div>

            {isEffectiveSupervisor && (
              <div className="flex flex-wrap items-center gap-2 shrink-0 self-center sm:self-auto">
                <button
                  onClick={() => setIsImportExcelOpen(true)}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/80 cursor-pointer shadow-2xs"
                  title="استيراد المبادرات من ملف إكسل"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>استيراد من إكسل</span>
                </button>

                <button
                  onClick={() => setIsAddProgramOpen(true)}
                  className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مبادرة جديدة</span>
                </button>
              </div>
            )}
          </div>

          {/* ⭐️ أهم 5 أرقام للعمل التطوعي المدرسي (Executive Metric Banner) */}
          <div className="bg-[#ffffff] rounded-3xl p-4 sm:p-5 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0071e3]" />
                <h2 className="text-[13px] sm:text-[14px] font-semibold text-[#1d1d1f]">
                  مؤشرات الأداء الاستراتيجية الخمسة
                </h2>
              </div>
              <span className="text-[11px] text-[#86868b]">
                تحديث فوري ومباشر لجميع المبادرات
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* 1. إجمالي الساعات التطوعية المعتمدة (الرقم الأهم) */}
              <div className="p-3.5 bg-gradient-to-br from-emerald-50/80 via-emerald-50/30 to-white rounded-2xl border border-emerald-200/80 shadow-2xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full inline-block">
                    الرقم الأهم للتقارير
                  </span>
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-[11px] text-[#86868b] block font-medium">إجمالي الساعات المعتمدة</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-950 font-mono tracking-tight tabular-nums">
                    {totalCertifiedHours}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-700">ساعة</span>
                </div>
              </div>

              {/* 2. نسبة الطلاب المتطوعين */}
              <div className="p-3.5 bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] rounded-2xl border border-black/[0.04] transition-colors">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded-full inline-block">
                    المشاركة الطلابية
                  </span>
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <span className="text-[11px] text-[#86868b] block font-medium">نسبة الطلاب المتطوعين</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] font-mono tracking-tight tabular-nums">
                    {volunteerRatioPercent}%
                  </span>
                  <span className="text-[10px] text-[#86868b]">({activeVolunteersCount} من {students.length})</span>
                </div>
              </div>

              {/* 3. عدد المبادرات المنفذة */}
              <div className="p-3.5 bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] rounded-2xl border border-black/[0.04] transition-colors">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full inline-block">
                    الفرص المنفذة
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-[11px] text-[#86868b] block font-medium">المبادرات المنفذة</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] font-mono tracking-tight tabular-nums">
                    {executedInitiativesCount}
                  </span>
                  <span className="text-[11px] text-[#86868b]">مبادرة مكتملة</span>
                </div>
              </div>

              {/* 4. نسبة الالتزام بالحضور */}
              <div className="p-3.5 bg-[#f5f5f7]/80 hover:bg-[#f5f5f7] rounded-2xl border border-black/[0.04] transition-colors">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-medium text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                    الانضباط والالتزام
                  </span>
                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-[11px] text-[#86868b] block font-medium">نسبة الالتزام بالحضور</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-[#0071e3] font-mono tracking-tight tabular-nums">
                    {attendanceCommitmentRate}%
                  </span>
                  <span className="text-[10px] text-[#86868b]">حضور فعلي</span>
                </div>
              </div>

              {/* 5. معدل رضا الطلاب */}
              <div className="p-3.5 bg-gradient-to-br from-amber-50/70 via-amber-50/20 to-white rounded-2xl border border-amber-200/80 shadow-2xs col-span-2 md:col-span-1">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full inline-block">
                    الأثر والرضا
                  </span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                </div>
                <span className="text-[11px] text-[#86868b] block font-medium">معدل رضا الطلاب</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-950 font-mono tracking-tight tabular-nums">
                    {averageSatisfaction}
                  </span>
                  <span className="text-amber-500 text-xs">★</span>
                  <span className="text-[10px] text-amber-800 font-mono font-medium">/ 5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-black/[0.04] pb-3">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
              }`}
            >
              <span>جميع المبادرات (تسلسل زمني)</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#86868b]'
              }`}>
                {chronologicalPrograms.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'ongoing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>جاري تنفيذها</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === 'ongoing' ? 'bg-white/25 text-white' : 'bg-emerald-200/60 text-emerald-900'
              }`}>
                {ongoingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'upcoming'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <Sliders className="w-3 h-3 text-amber-600" />
              <span>قادمة · قيد الإعداد</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === 'upcoming' ? 'bg-white/25 text-white' : 'bg-amber-200/60 text-amber-900'
              }`}>
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'completed'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200/80'
              }`}
            >
              <Lock className="w-3 h-3 text-stone-500" />
              <span>المنتهية والمقفلة</span>
              <span className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                statusFilter === 'completed' ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {completedCount}
              </span>
            </button>
          </div>

          {/* 🌟 الرؤية المباشرة: المبادرة الجاري تنفيذها حالياً (Direct Spotlight View) */}
          {ongoingPrograms.length > 0 && (statusFilter === 'all' || statusFilter === 'ongoing') && (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-[13px] font-bold text-emerald-900 tracking-wide">
                    الرؤية المباشرة · المبادرة الجاري تنفيذها حالياً
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                  فرصة تطوعية متاحة للتسجيل الفوري
                </span>
              </div>

              <div className="space-y-3">
                {ongoingPrograms.map((ongoingProg) => {
                  const progTasks = tasks.filter((t) => t.programId === ongoingProg.id);
                  const hours = progTasks.length > 0 ? Math.max(...progTasks.map((t) => t.hours)) : 2;

                  return (
                    <div
                      key={`spotlight-${ongoingProg.id}`}
                      className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/25 to-emerald-100/40 rounded-3xl p-6 sm:p-7 border-2 border-emerald-400 shadow-[0_12px_36px_rgba(16,185,129,0.14)] flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-all"
                    >
                      <div className="space-y-2.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-xs">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            جاري تنفيذها الآن
                          </span>
                          <span className="text-[12px] font-medium text-emerald-900 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                            {ongoingProg.stageLabel} · {ongoingProg.domainName}
                          </span>
                          <span className="text-[12px] font-semibold text-[#0071e3] bg-white px-2.5 py-0.5 rounded-full font-mono border border-black/[0.04]">
                            {hours} ساعات معتمدة
                          </span>
                        </div>

                        <h2
                          onClick={() => handleSelectProgram(ongoingProg.id)}
                          className="text-xl sm:text-2xl font-bold text-[#1d1d1f] hover:text-emerald-700 transition-colors cursor-pointer tracking-tight"
                        >
                          {ongoingProg.name}
                        </h2>

                        <p className="text-[13px] sm:text-[14px] text-[#48484a] leading-relaxed line-clamp-2">
                          {ongoingProg.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#86868b] pt-0.5">
                          <span>التاريخ: <strong className="text-[#1d1d1f] font-mono">{ongoingProg.gregorianDate} ({ongoingProg.month})</strong></span>
                          <span>·</span>
                          <span>الجهة: <strong className="text-[#1d1d1f]">{ongoingProg.organizer}</strong></span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <button
                          onClick={() => setProgramForWhatsApp(ongoingProg)}
                          className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 text-[12px] font-medium rounded-full transition-all flex items-center justify-center gap-1.5 border border-emerald-300 shadow-xs cursor-pointer"
                          title="إرسال المبادرة للطلاب عبر واتساب"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>إرسال واتساب</span>
                        </button>

                        <button
                          onClick={() => handleJoinInitiative(ongoingProg)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold rounded-full transition-all flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(16,185,129,0.3)] cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>انضمام فوري</span>
                        </button>

                        <button
                          onClick={() => handleSelectProgram(ongoingProg.id)}
                          className="px-4 py-2.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>عرض المهام</span>
                          <ChevronLeft className="w-4 h-4 text-[#86868b]" />
                        </button>

                        {isEffectiveSupervisor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProgramToDelete(ongoingProg);
                            }}
                            className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[12px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 border border-rose-200/80 cursor-pointer"
                            title="حذف هذه المبادرة"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>حذف المبادرة</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* INITIATIVES LIST (التسلسل التاريخي): اسم المبادرة - وتحتها تعريف بسيط - وتحتها التاريخ - ونوع المرحلة */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[13px] font-semibold text-[#86868b]">
                {statusFilter === 'all' && 'قائمة المبادرات وفق التسلسل التاريخي'}
                {statusFilter === 'ongoing' && 'المبادرات الجاري تنفيذها'}
                {statusFilter === 'upcoming' && 'المبادرات القادمة وقيد الإعداد'}
                {statusFilter === 'completed' && 'المبادرات المنتهية والمقفلة'}
                {' '}({filteredPrograms.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrograms.map((prog) => {
                const progTasks = tasks.filter((t) => t.programId === prog.id);
                const progStatus = getProgramStatus(prog);
                const isCompleted = progStatus === 'completed';
                const isOngoing = progStatus === 'ongoing';
                const isUpcoming = progStatus === 'upcoming';

                return (
                  <div
                    key={prog.id}
                    onClick={() => handleSelectProgram(prog.id)}
                    className={`rounded-3xl p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                      isCompleted
                        ? 'bg-[#fafafa]/90 opacity-65 grayscale-[35%] hover:opacity-90 border-dashed border-stone-300 shadow-none'
                        : isOngoing
                        ? 'bg-[#ffffff] border-2 border-emerald-300 ring-2 ring-emerald-500/20 bg-gradient-to-b from-white to-emerald-50/15 shadow-[0_4px_16px_rgba(16,185,129,0.08)] hover:shadow-[0_10px_28px_rgba(16,185,129,0.14)]'
                        : 'bg-[#ffffff] border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] active:scale-[0.99]'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* 1. اسم المبادرة */}
                      <div className="space-y-1">
                        <h3 className={`text-lg sm:text-xl font-semibold tracking-tight transition-colors leading-snug ${
                          isOngoing ? 'text-emerald-950 group-hover:text-emerald-700' : 'text-[#1d1d1f] group-hover:text-[#0071e3]'
                        }`}>
                          {prog.name}
                        </h3>
                      </div>

                      {/* 2. وتحتها تعريف بسيط */}
                      <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-3">
                        {prog.description}
                      </p>

                      {/* 3. وتحتها التاريخ & 4. نوع المرحلة */}
                      <div className="pt-3 border-t border-black/[0.04] space-y-2">
                        {/* التاريخ */}
                        <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]">
                          <Calendar className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                          <span className="font-medium text-[#1d1d1f]">التاريخ:</span>
                          <span className="font-mono text-[#86868b]">{prog.gregorianDate} ({prog.month})</span>
                        </div>

                        {/* نوع المرحلة */}
                        <div className="flex items-center gap-2 text-[12px] text-[#1d1d1f]">
                          <GraduationCap className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                          <span className="font-medium text-[#1d1d1f]">المرحلة:</span>
                          <span className="text-[#0071e3] font-medium bg-[#f5f5f7] px-2.5 py-0.5 rounded-full text-[11px]">
                            {prog.stageLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tasks count, WhatsApp Share, & Actions */}
                    <div className="mt-5 pt-3.5 border-t border-black/[0.04] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProgramForWhatsApp(prog);
                          }}
                          className="px-3 py-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-200/60 shrink-0"
                          title="إرسال المبادرة للطلاب عبر واتساب"
                        >
                          <Share2 className="w-3 h-3 text-emerald-600" />
                          <span>إرسال واتساب</span>
                        </button>

                        {isEffectiveSupervisor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProgramToDelete(prog);
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-rose-200/80 shrink-0"
                            title="حذف المبادرة"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <span className="text-[11px] font-medium text-stone-500 bg-stone-100/90 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Lock className="w-3 h-3 text-stone-400" />
                            <span>مقفلة</span>
                          </span>
                        ) : isOngoing ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinInitiative(prog);
                            }}
                            className="px-3 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>انضمام</span>
                          </button>
                        ) : (
                          <span className="text-[11px] sm:text-[12px] text-[#86868b] font-mono">
                            {progTasks.length} {progTasks.length === 1 ? 'مهمة' : 'مهام'}
                          </span>
                        )}

                        <span className="text-[12px] sm:text-[13px] font-medium text-[#0071e3] group-hover:underline flex items-center gap-1">
                          <span>عرض التفاصيل</span>
                          <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {programs.length === 0 && (
            <div className="text-center py-16 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-8">
              <BookOpen className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-40" />
              <h3 className="text-base font-semibold text-[#1d1d1f]">لا توجد مبادرات مطروحة حالياً</h3>
              <p className="text-[13px] text-[#86868b] mt-1 mb-4">
                سيتم إدراج المبادرات وفق الخطة المركزية للأنشطة الطلابية.
              </p>
              <button
                onClick={() => setIsAddProgramOpen(true)}
                className="px-4 py-2 bg-[#0071e3] text-white text-[13px] rounded-full cursor-pointer"
              >
                + إضافة مبادرة جديدة
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= SECOND VIEW: INITIATIVE TASKS & REGISTRATION ================= */
        <div className="space-y-6">
          {/* Back button */}
          <div>
            <button
              onClick={() => handleSelectProgram(null)}
              className="inline-flex items-center gap-1 text-[13px] text-[#0071e3] hover:underline cursor-pointer py-1"
            >
              <span>← العودة لجميع المبادرات</span>
            </button>
          </div>

          {/* Initiative Card */}
          {(() => {
            const selectedProgStatus = getProgramStatus(selectedProgram);
            const isSelectedProgCompleted = selectedProgStatus === 'completed';
            const isSelectedProgOngoing = selectedProgStatus === 'ongoing';
            const isSelectedProgUpcoming = selectedProgStatus === 'upcoming';

            return (
              <>
                <div className={`rounded-3xl p-6 sm:p-8 border shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4 transition-all ${
                  isSelectedProgCompleted
                    ? 'bg-[#fafafa]/90 border-dashed border-stone-300'
                    : isSelectedProgOngoing
                    ? 'bg-gradient-to-br from-white via-emerald-50/15 to-emerald-100/20 border-2 border-emerald-400 shadow-[0_8px_24px_rgba(16,185,129,0.08)]'
                    : 'bg-[#ffffff] border-black/[0.04]'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSelectedProgOngoing && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            جاري تنفيذها الآن
                          </span>
                        )}
                        {isSelectedProgUpcoming && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
                            <Sliders className="w-3.5 h-3.5 text-amber-600" />
                            قادمة · قيد الإعداد
                          </span>
                        )}
                        {isSelectedProgCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-600 border border-stone-200/80">
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                            منتهية ومقفلة
                          </span>
                        )}
                        <span className="text-[12px] font-medium text-[#0071e3] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full inline-block">
                          {selectedProgram.stageLabel} · {selectedProgram.domainName}
                        </span>
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
                        {selectedProgram.name}
                      </h1>

                      <p className="text-[14px] text-[#48484a] leading-relaxed max-w-2xl">
                        {selectedProgram.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#86868b] pt-1">
                        <span>التاريخ: <strong className="text-[#1d1d1f] font-mono">{selectedProgram.gregorianDate} ({selectedProgram.month})</strong></span>
                        <span>·</span>
                        <span>الجهة: <strong className="text-[#1d1d1f]">{selectedProgram.organizer}</strong></span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setProgramForWhatsApp(selectedProgram)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[12px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 border border-emerald-200/80 cursor-pointer"
                        title="إرسال المبادرة للطلاب عبر واتساب"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>إرسال واتساب</span>
                      </button>

                      {isEffectiveSupervisor ? (
                        <>
                          <button
                            onClick={() => setProgramToEdit(selectedProgram)}
                            className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#0071e3]" />
                            <span>تعديل المبادرة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setProgramToDelete(selectedProgram)}
                            className="px-4 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 text-[12px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 border border-rose-200/80 cursor-pointer"
                            title="حذف المبادرة نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>حذف المبادرة</span>
                          </button>

                          <button
                            onClick={() => setIsAddTaskOpen(true)}
                            className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-medium rounded-full transition-all flex items-center justify-center gap-1.5 shadow-none cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة مهمة تطوعية</span>
                          </button>
                        </>
                      ) : isSelectedProgCompleted ? (
                        <button
                          disabled
                          className="w-full sm:w-auto px-5 py-2.5 bg-stone-100 text-stone-500 text-[13px] font-medium rounded-full flex items-center justify-center gap-1.5 cursor-not-allowed border border-stone-200"
                          title="المبادرة منتهية ومقفلة"
                        >
                          <Lock className="w-4 h-4 text-stone-400" />
                          <span>المبادرة مقفلة (منتهية)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinInitiative(selectedProgram)}
                          className={`w-full sm:w-auto px-5 py-2.5 text-white text-[13px] font-medium rounded-full transition-all flex items-center justify-center gap-1.5 shadow-none cursor-pointer ${
                            isSelectedProgOngoing
                              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-[0_4px_14px_rgba(16,185,129,0.3)]'
                              : 'bg-[#0071e3] hover:bg-[#0077ed]'
                          }`}
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>انضمام للمبادرة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Locked banner if completed */}
                {isSelectedProgCompleted && (
                  <div className="flex items-center gap-3 bg-stone-100/90 border border-stone-200 text-stone-700 rounded-2xl p-4 animate-in fade-in">
                    <Lock className="w-5 h-5 text-stone-500 shrink-0" />
                    <div>
                      <span className="font-semibold text-[13px] block">
                        هذه المبادرة منتهية ومقفلة
                      </span>
                      <span className="text-[12px] text-stone-600">
                        اكتملت هذه الفعالية وفق الخطة الزمنية وتم إغلاق باب التسجيل والمشاركة.
                      </span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}

          {/* If Logged-in Student has joined: show their status banner */}
          {currentStudentProgramReg && (
            <div className="animate-in fade-in duration-200">
              {currentStudentProgramReg.attendanceStatus === 'completed' ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-[13px] block">
                      تم اعتماد وتوثيق ساعاتك في هذه المبادرة ({currentStudentProgramReg.hoursAwarded} ساعات)!
                    </span>
                    <span className="text-[12px] text-emerald-700">
                      تم توثيق مشاركتك بنجاح واعتمادها في سجلك وشهادتك الرسمية.
                    </span>
                  </div>
                </div>
              ) : currentStudentProgramReg.approvalStatus === 'approved' || currentStudentProgramReg.attendanceStatus === 'attended' ? (
                <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl p-4">
                  <Check className="w-5 h-5 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-[13px] block">
                      تمت موافقة المشرف على انضمامك للمبادرة!
                    </span>
                    <span className="text-[12px] text-sky-700">
                      بانتظار مشاركتك في النشاط لاعتماد وتوثيق ساعاتك فور الانتهاء.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-[13px] block">
                      تم استلام طلب انضمامك للمبادرة بنجاح
                    </span>
                    <span className="text-[12px] text-amber-700">
                      طلبك مسجل الآن لدى المشرف للموافقة، وسيتم اعتماد وتوثيق ساعاتك بعد انتهاء المبادرة والتأكد من مشاركتك.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tasks List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
                  المهام التطوعية المطروحة ({tasksForSelectedProgram.length})
                </h2>
                <p className="text-[12px] text-[#86868b]">
                  اضغط على المهمة للتسجيل برقم الجوال وآخر 5 أرقام من رقم الجوال
                </p>
              </div>
            </div>

            {tasksForSelectedProgram.length === 0 ? (
              <div className="text-center py-16 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-8">
                <HeartHandshake className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-40" />
                <h3 className="text-base font-semibold text-[#1d1d1f]">لا توجد مهام تطوعية في هذه المبادرة بعد</h3>
                <p className="text-[13px] text-[#86868b] mt-1 max-w-md mx-auto mb-4">
                  سيتم فتح باب التطوع لهذه المبادرة قريباً وفق خطة الأنشطة الطلابية.
                </p>
                {isEffectiveSupervisor && (
                  <button
                    onClick={() => setIsAddTaskOpen(true)}
                    className="px-4 py-2 bg-[#0071e3] text-white text-[13px] rounded-full cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مهمة تطوعية (مشرف)</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasksForSelectedProgram.map((task) => {
                  const taskRegs = registrations.filter((r) => r.taskId === task.id);
                  const isFull = taskRegs.length >= task.maxVolunteers;
                  const alreadyRegistered = isStudentRegistered(task.id);

                  return (
                    <div
                      key={task.id}
                      className="bg-[#ffffff] rounded-3xl p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                          <span>
                            {task.stage === 'all'
                              ? 'جميع المراحل'
                              : task.stage === 'primary'
                              ? 'المرحلة الابتدائية'
                              : 'المرحلة المتوسطة'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isEffectiveSupervisor && (
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => setTaskToEdit(task)}
                                  className="p-1 text-[#86868b] hover:text-[#0071e3] hover:bg-[#f5f5f7] rounded-full transition-colors cursor-pointer"
                                  title="تعديل المهمة"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setTaskToDelete(task)}
                                  className="p-1 text-[#86868b] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                                  title="حذف المهمة نهائياً"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <span className="font-mono text-[#0071e3] font-semibold bg-[#f5f5f7] px-2.5 py-0.5 rounded-full">
                              {task.hours} ساعات معتمدة
                            </span>
                          </div>
                        </div>

                        <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight leading-snug">
                          {task.title}
                        </h3>

                        <p className="text-[13px] text-[#86868b] leading-relaxed">
                          {task.description}
                        </p>

                        {/* Timing and Location */}
                        <div className="grid grid-cols-2 gap-2 text-[12px] text-[#86868b] pt-2 border-t border-black/[0.04]">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                            <span className="truncate">{task.date}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                            <span className="truncate">{task.time}</span>
                          </div>
                          <div className="flex items-center gap-1.5 col-span-2">
                            <MapPin className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                            <span className="truncate">{task.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer & Registration CTA */}
                      <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between gap-3">
                        <div className="text-[12px] font-mono text-[#86868b]">
                          {taskRegs.length} / {task.maxVolunteers} متطوع
                        </div>

                        {alreadyRegistered ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                            <span>أنت مسجل بالفعل</span>
                          </span>
                        ) : getProgramStatus(selectedProgram) === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
                            <Lock className="w-3.5 h-3.5 text-stone-400" />
                            <span>المهمة مقفلة</span>
                          </span>
                        ) : isFull ? (
                          <span className="text-[12px] text-[#86868b] bg-[#f5f5f7] px-3 py-1.5 rounded-full">
                            اكتمل العدد
                          </span>
                        ) : (
                          <button
                            onClick={() => setTaskForRegistration(task)}
                            className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-normal rounded-full transition-all flex items-center gap-1 shadow-none cursor-pointer"
                          >
                            <span>التسجيل في المهمة</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supervisor View: Students who Requested to Join this Initiative */}
          {isEffectiveSupervisor && (
            <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.04] pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#1d1d1f]">
                    الطلاب الذين طلبوا الانضمام لهذه المبادرة ({selectedProgramRegs.length})
                  </h3>
                  <p className="text-[12px] text-[#86868b]">
                    الموافقة الفورية على الطلبات واعتماد الساعات بعد انتهاء المبادرة والتأكد من مشاركة الطالب.
                  </p>
                </div>

                {selectedProgramRegs.filter((r) => r.approvalStatus === 'pending' || (r.attendanceStatus === 'registered' && !r.approvalStatus)).length > 0 && onApproveRegistration && (
                  <button
                    onClick={() => {
                      selectedProgramRegs
                        .filter((r) => r.approvalStatus === 'pending' || (r.attendanceStatus === 'registered' && !r.approvalStatus))
                        .forEach((r) => onApproveRegistration(r.id));
                    }}
                    className="px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12px] font-medium rounded-full border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>موافقة على جميع الطلبات</span>
                  </button>
                )}
              </div>

              {selectedProgramRegs.length === 0 ? (
                <div className="text-center py-10 text-[13px] text-[#86868b]">
                  لم يتقدم أي طالب بطلب انضمام لهذه المبادرة حتى الآن.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[12px]">
                    <thead className="bg-[#f5f5f7] text-[#86868b] font-medium border-b border-black/[0.04]">
                      <tr>
                        <th className="p-3 w-10 text-center">م</th>
                        <th className="p-3">اسم الطالب</th>
                        <th className="p-3">رقم الجوال</th>
                        <th className="p-3">الصف</th>
                        <th className="p-3">حالة الطلب</th>
                        <th className="p-3 text-center">الإجراءات والاعتماد</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04]">
                      {selectedProgramRegs.map((reg, idx) => {
                        const isPending =
                          reg.approvalStatus === 'pending' ||
                          (reg.attendanceStatus === 'registered' && !reg.approvalStatus);
                        const isCompleted = reg.attendanceStatus === 'completed';
                        const student = students.find((s) => s.id === reg.studentId);
                        const mobile = reg.studentMobile || student?.mobile || '-';
                        const targetTask = tasks.find((t) => t.id === reg.taskId);
                        const taskHours = targetTask?.hours || 2;

                        return (
                          <tr
                            key={reg.id}
                            className={`transition-colors ${
                              isPending
                                ? 'bg-amber-50/25 hover:bg-amber-50/40'
                                : isCompleted
                                ? 'bg-emerald-50/15 hover:bg-emerald-50/30'
                                : 'hover:bg-[#f5f5f7]/50'
                            }`}
                          >
                            <td className="p-3 text-center font-mono text-[#86868b]">{idx + 1}</td>
                            <td className="p-3 font-semibold text-[#1d1d1f]">
                              {reg.studentName}
                            </td>
                            <td className="p-3 font-mono tabular-nums text-[#1d1d1f]">{mobile}</td>
                            <td className="p-3 text-[#86868b]">
                              {student?.grade || (reg.studentStage === 'primary' ? 'ابتدائي' : 'متوسط')}
                            </td>
                            <td className="p-3">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  <span>بانتظار الموافقة</span>
                                </span>
                              ) : isCompleted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>تم اعتماد الساعات ({reg.hoursAwarded}س)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-100 text-sky-800 border border-sky-200">
                                  <Check className="w-3 h-3" />
                                  <span>تم قبول الانضمام</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {/* زر موافق */}
                                {isPending && onApproveRegistration && (
                                  <button
                                    onClick={() => onApproveRegistration(reg.id)}
                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                                    title="الموافقة على انضمام الطالب في المبادرة"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>موافق</span>
                                  </button>
                                )}

                                {/* زر اعتماد الساعات */}
                                {isCompleted ? (
                                  <span className="text-emerald-700 text-[11px] font-medium flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>معتمد وموثق</span>
                                  </span>
                                ) : onCertifyHours ? (
                                  <button
                                    onClick={() => onCertifyHours(reg.id, taskHours)}
                                    className="px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[11px] font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                                    title="اعتماد الساعات بعد انتهاء المبادرة والتأكد من مشاركة الطالب"
                                  >
                                    <Award className="w-3.5 h-3.5" />
                                    <span>اعتماد الساعات ({taskHours}س)</span>
                                  </button>
                                ) : null}
                              </div>
                              <span className="block text-[10px] text-[#86868b] mt-0.5">
                                {isCompleted ? 'تم توثيق الساعات' : 'بعد انتهاء المبادرة والتأكد من مشاركته'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add Program Modal */}
      {isEffectiveSupervisor && (
        <AddProgramModal
          isOpen={isAddProgramOpen}
          onClose={() => setIsAddProgramOpen(false)}
          onAddProgram={onAddProgram}
        />
      )}

      {/* Add Task Modal for Selected Program */}
      {selectedProgram && isEffectiveSupervisor && (
        <AddTaskModal
          program={selectedProgram}
          isOpen={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          onAddTask={onAddTask}
        />
      )}

      {/* Task Registration Modal (Mobile + Last 5 digits) */}
      {taskForRegistration && (
        <TaskRegistrationModal
          task={taskForRegistration}
          program={programs.find((p) => p.id === taskForRegistration.programId)}
          students={students}
          currentStudent={currentStudent}
          isOpen={!!taskForRegistration}
          onClose={() => setTaskForRegistration(null)}
          onConfirmRegistration={(student, taskId) => {
            onConfirmRegistration(student, taskId);
            setTaskForRegistration(null);
          }}
        />
      )}

      {/* Edit Program Modal */}
      {programToEdit && isEffectiveSupervisor && (
        <EditProgramModal
          program={programToEdit}
          isOpen={!!programToEdit}
          onClose={() => setProgramToEdit(null)}
          onUpdateProgram={(updated) => {
            if (onUpdateProgram) onUpdateProgram(updated);
            setProgramToEdit(null);
          }}
          onDeleteProgram={(progId) => {
            if (onDeleteProgram) onDeleteProgram(progId);
            if (selectedProgramId === progId) setSelectedProgramId(null);
            setProgramToEdit(null);
          }}
        />
      )}

      {/* Edit Task Modal */}
      {taskToEdit && isEffectiveSupervisor && (
        <EditTaskModal
          task={taskToEdit}
          isOpen={!!taskToEdit}
          onClose={() => setTaskToEdit(null)}
          onUpdateTask={(updated) => {
            if (onUpdateTask) onUpdateTask(updated);
            setTaskToEdit(null);
          }}
          onDeleteTask={(taskId) => {
            if (onDeleteTask) onDeleteTask(taskId);
            setTaskToEdit(null);
          }}
        />
      )}

      {/* WhatsApp Share Modal */}
      {programForWhatsApp && (
        <WhatsAppShareModal
          program={programForWhatsApp}
          tasks={tasks}
          isOpen={!!programForWhatsApp}
          onClose={() => setProgramForWhatsApp(null)}
        />
      )}

      {/* Import Programs from Excel Modal */}
      {isImportExcelOpen && isEffectiveSupervisor && (
        <ImportProgramsModal
          isOpen={isImportExcelOpen}
          onClose={() => setIsImportExcelOpen(false)}
          onBatchAddPrograms={(importedProgs, importedTasks) => {
            if (onBatchAddPrograms) {
              onBatchAddPrograms(importedProgs, importedTasks);
            }
          }}
        />
      )}

      {/* In-App Delete Confirmation Modal for Initiatives */}
      {programToDelete && isEffectiveSupervisor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">
                تأكيد الحذف النهائي للمبادرة
              </h3>
              <p className="text-[13px] text-[#86868b] mt-1 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف مبادرة «{programToDelete.name}»؟ سيتم حذف جميع المهام التابعة لها.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
                className="flex-1 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteProgram) onDeleteProgram(programToDelete.id);
                  if (selectedProgramId === programToDelete.id) {
                    setSelectedProgramId(null);
                  }
                  setProgramToDelete(null);
                }}
                className="flex-1 py-2.5 text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors cursor-pointer shadow-none"
              >
                نعم، احذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal for Tasks */}
      {taskToDelete && isEffectiveSupervisor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f]">
                تأكيد حذف المهمة التطوعية
              </h3>
              <p className="text-[13px] text-[#86868b] mt-1 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف مهمة «{taskToDelete.title}»؟
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="flex-1 py-2.5 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteTask) onDeleteTask(taskToDelete.id);
                  setTaskToDelete(null);
                }}
                className="flex-1 py-2.5 text-[13px] font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-full transition-colors cursor-pointer shadow-none"
              >
                نعم، احذف المهمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
