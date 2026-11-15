import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Clock,
  Edit3,
  GraduationCap,
  HeartHandshake,
  MapPin,
  Lock,
  Plus,
  FileSpreadsheet,
  Share2,
  Sliders,
  Tag,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../../types';
import {
  getProgramStatus,
  resolveActivityDomainMeta,
  resolveProgramDomainId,
  sortProgramsChronologically,
} from '../../utils/programHelpers';
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

  // Chronologically sorted programs (التسلسل التاريخي: الأقدم ← الحالي ← القادم)
  const chronologicalPrograms = React.useMemo(() => {
    return sortProgramsChronologically(programs);
  }, [programs]);

  // Filtered initiatives according to user's selected status tab
  const filteredPrograms = React.useMemo(() => {
    if (statusFilter === 'all') return chronologicalPrograms;
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === statusFilter);
  }, [chronologicalPrograms, statusFilter]);

  const getDefaultWheelIndex = React.useCallback((list: ActivityProgram[]): number => {
    if (list.length === 0) return 0;
    const ongoingIdx = list.findIndex((p) => getProgramStatus(p) === 'ongoing');
    if (ongoingIdx !== -1) return ongoingIdx;
    const upcomingIdx = list.findIndex((p) => getProgramStatus(p) === 'upcoming');
    if (upcomingIdx !== -1) return upcomingIdx;
    return Math.max(0, list.length - 1);
  }, []);

  const [activeWheelIndex, setActiveWheelIndex] = useState<number>(() =>
    getDefaultWheelIndex(filteredPrograms)
  );
  const [dragOffsetY, setDragOffsetY] = useState<number>(0);
  const [isWheelDragging, setIsWheelDragging] = useState<boolean>(false);

  const wheelContainerRef = React.useRef<HTMLDivElement | null>(null);
  const hasUserSpunRef = React.useRef<boolean>(false);
  const prevStatusFilterRef = React.useRef(statusFilter);
  const wheelCooldownRef = React.useRef<number>(0);
  const wheelAccumRef = React.useRef<number>(0);
  const suppressCardClickRef = React.useRef<boolean>(false);
  const pointerDragRef = React.useRef<{
    startY: number;
    lastDy: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const clampedWheelIndex =
    filteredPrograms.length > 0
      ? Math.min(Math.max(activeWheelIndex, 0), filteredPrograms.length - 1)
      : 0;

  React.useEffect(() => {
    const filterChanged = prevStatusFilterRef.current !== statusFilter;
    prevStatusFilterRef.current = statusFilter;

    if (filterChanged) {
      hasUserSpunRef.current = false;
      setActiveWheelIndex(getDefaultWheelIndex(filteredPrograms));
      return;
    }

    if (!hasUserSpunRef.current && filteredPrograms.length > 0) {
      setActiveWheelIndex(getDefaultWheelIndex(filteredPrograms));
      return;
    }

    if (filteredPrograms.length > 0 && activeWheelIndex >= filteredPrograms.length) {
      setActiveWheelIndex(filteredPrograms.length - 1);
    }
  }, [statusFilter, filteredPrograms, activeWheelIndex, getDefaultWheelIndex]);

  const stepWheel = React.useCallback(
    (delta: number) => {
      if (filteredPrograms.length <= 1) return;
      hasUserSpunRef.current = true;
      setActiveWheelIndex((prev) =>
        Math.min(filteredPrograms.length - 1, Math.max(0, prev + delta))
      );
    },
    [filteredPrograms.length]
  );

  // Non-passive touch & wheel gestures for smooth drum rotation:
  // Swipe/scroll UP -> upcoming (+1), swipe/scroll DOWN -> older/completed (-1)
  React.useEffect(() => {
    const el = wheelContainerRef.current;
    if (!el || filteredPrograms.length <= 1) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDy = 0;
    let touchMode: 'pending' | 'wheel' | 'scroll' = 'pending';

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchDy = 0;
      touchMode = 'pending';
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - touchStartX;
      const dy = e.touches[0].clientY - touchStartY;

      if (touchMode === 'pending') {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          touchMode = 'scroll';
          return;
        }
        const canGoNext = dy < 0 && clampedWheelIndex < filteredPrograms.length - 1;
        const canGoPrev = dy > 0 && clampedWheelIndex > 0;
        if (canGoNext || canGoPrev) {
          touchMode = 'wheel';
          setIsWheelDragging(true);
        } else {
          touchMode = 'scroll';
          return;
        }
      }

      if (touchMode === 'wheel') {
        e.preventDefault();
        touchDy = dy;
        const clampedDrag = Math.max(-84, Math.min(84, dy * 0.6));
        setDragOffsetY(clampedDrag);
      }
    };

    const onTouchEnd = () => {
      if (touchMode === 'wheel') {
        if (Math.abs(touchDy) >= 32) {
          suppressCardClickRef.current = true;
          window.setTimeout(() => {
            suppressCardClickRef.current = false;
          }, 120);
          stepWheel(touchDy < 0 ? 1 : -1);
        }
        setDragOffsetY(0);
        setIsWheelDragging(false);
      }
      touchMode = 'pending';
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY === 0) return;

      const wantsNext = e.deltaY > 0;
      const canStep = wantsNext
        ? clampedWheelIndex < filteredPrograms.length - 1
        : clampedWheelIndex > 0;

      if (!canStep) return;

      e.preventDefault();
      const now = Date.now();
      if (now - wheelCooldownRef.current < 260) {
        wheelAccumRef.current = 0;
        return;
      }

      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) >= 24) {
        stepWheel(wheelAccumRef.current > 0 ? 1 : -1);
        wheelCooldownRef.current = now;
        wheelAccumRef.current = 0;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, [clampedWheelIndex, filteredPrograms.length, stepWheel]);

  const ongoingCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'ongoing').length;
  }, [chronologicalPrograms]);

  const upcomingCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'upcoming').length;
  }, [chronologicalPrograms]);

  const completedCount = React.useMemo(() => {
    return chronologicalPrograms.filter((p) => getProgramStatus(p) === 'completed').length;
  }, [chronologicalPrograms]);

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
        domain: resolveProgramDomainId(progToJoin),
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

          {/* Timeline & Status Filter Tabs - Single Row */}
          <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2 pt-1 border-b border-black/[0.04] pb-3 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-[#1d1d1f] text-white shadow-xs'
                  : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
              }`}
            >
              <span>جميع المبادرات</span>
              <span className={`text-[10px] sm:text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#86868b]'
              }`}>
                {chronologicalPrograms.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                statusFilter === 'ongoing'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <span>جاري تنفيذها</span>
              <span className={`text-[10px] sm:text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                statusFilter === 'ongoing' ? 'bg-white/25 text-white' : 'bg-emerald-200/60 text-emerald-900'
              }`}>
                {ongoingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                statusFilter === 'upcoming'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              <span>مبادرات قادمة</span>
              <span className={`text-[10px] sm:text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                statusFilter === 'upcoming' ? 'bg-white/25 text-white' : 'bg-amber-200/60 text-amber-900'
              }`}>
                {upcomingCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-medium transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0 ${
                statusFilter === 'completed'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200/80'
              }`}
            >
              <span>مبادرات منتهية</span>
              <span className={`text-[10px] sm:text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded-full ${
                statusFilter === 'completed' ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-800'
              }`}>
                {completedCount}
              </span>
            </button>
          </div>

          {/* Vertical Initiatives Wheel (عجلة المبادرات: السحب للأعلى ← القادمة، السحب للأسفل ← القديمة، وفي المنتصف الحالية) */}
          {filteredPrograms.length > 0 ? (
            <div
              ref={wheelContainerRef}
              tabIndex={0}
              aria-label="عجلة المبادرات"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  stepWheel(1);
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  stepWheel(-1);
                }
              }}
              onPointerDown={(e) => {
                if (e.pointerType !== 'mouse' || e.button !== 0) return;
                if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
                if (filteredPrograms.length <= 1) return;
                pointerDragRef.current = {
                  startY: e.clientY,
                  lastDy: 0,
                  moved: false,
                  pointerId: e.pointerId,
                };
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  // Ignore capture errors on synthetic events
                }
              }}
              onPointerMove={(e) => {
                const drag = pointerDragRef.current;
                if (!drag || e.pointerId !== drag.pointerId) return;
                const dy = e.clientY - drag.startY;
                drag.lastDy = dy;
                if (!drag.moved && Math.abs(dy) >= 8) {
                  drag.moved = true;
                  setIsWheelDragging(true);
                }
                if (drag.moved) {
                  setDragOffsetY(Math.max(-84, Math.min(84, dy * 0.6)));
                }
              }}
              onPointerUp={(e) => {
                const drag = pointerDragRef.current;
                if (!drag || e.pointerId !== drag.pointerId) return;
                pointerDragRef.current = null;
                try {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  }
                } catch {
                  // Ignore release errors
                }
                if (drag.moved) {
                  if (Math.abs(drag.lastDy) >= 32) {
                    suppressCardClickRef.current = true;
                    window.setTimeout(() => {
                      suppressCardClickRef.current = false;
                    }, 120);
                    stepWheel(drag.lastDy < 0 ? 1 : -1);
                  }
                }
                setDragOffsetY(0);
                setIsWheelDragging(false);
              }}
              onPointerCancel={() => {
                pointerDragRef.current = null;
                setDragOffsetY(0);
                setIsWheelDragging(false);
              }}
              className={`relative w-full overflow-hidden select-none outline-none touch-pan-y ${
                filteredPrograms.length === 1
                  ? 'h-[290px] sm:h-[310px]'
                  : 'h-[540px] sm:h-[580px]'
              } ${isWheelDragging ? 'cursor-grabbing' : filteredPrograms.length > 1 ? 'cursor-grab' : ''}`}
            >
              {/* Soft edge fade masks to blend wheel slots cleanly into #f5f5f7 */}
              {filteredPrograms.length > 1 && (
                <>
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-10 sm:h-12 bg-gradient-to-b from-[#f5f5f7] via-[#f5f5f7]/65 to-transparent z-40"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 sm:h-12 bg-gradient-to-t from-[#f5f5f7] via-[#f5f5f7]/65 to-transparent z-40"
                  />
                </>
              )}

              {/* Subtle desktop/accessibility step arrows on left edge */}
              {filteredPrograms.length > 1 && (
                <div className="hidden sm:flex flex-col items-center gap-2 absolute left-3 top-1/2 -translate-y-1/2 z-40">
                  <button
                    type="button"
                    aria-label="المبادرة السابقة"
                    disabled={clampedWheelIndex === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      stepWheel(-1);
                    }}
                    className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center border transition-all duration-150 ${
                      clampedWheelIndex === 0
                        ? 'bg-white/50 text-[#c7c7cc] border-black/[0.04] cursor-default opacity-45'
                        : 'bg-white/95 hover:bg-white text-[#1d1d1f] border-black/[0.08] shadow-sm cursor-pointer active:scale-95'
                    }`}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <span className="text-[11px] font-mono tabular-nums text-[#86868b] bg-white/90 px-2 py-0.5 rounded-full border border-black/[0.05]">
                    {clampedWheelIndex + 1}/{filteredPrograms.length}
                  </span>
                  <button
                    type="button"
                    aria-label="المبادرة القادمة"
                    disabled={clampedWheelIndex >= filteredPrograms.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      stepWheel(1);
                    }}
                    className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center border transition-all duration-150 ${
                      clampedWheelIndex >= filteredPrograms.length - 1
                        ? 'bg-white/50 text-[#c7c7cc] border-black/[0.04] cursor-default opacity-45'
                        : 'bg-white/95 hover:bg-white text-[#1d1d1f] border-black/[0.08] shadow-sm cursor-pointer active:scale-95'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              )}

              <div className="relative w-full max-w-3xl mx-auto h-full px-1 sm:px-14">
                {filteredPrograms.map((prog, idx) => {
                  const offset = idx - clampedWheelIndex;
                  if (Math.abs(offset) > 2) return null;

                  const progTasks = tasks.filter((t) => t.programId === prog.id);
                  const hours = progTasks.length > 0 ? Math.max(...progTasks.map((t) => t.hours)) : 2;
                  const progStatus = getProgramStatus(prog);
                  const isCompleted = progStatus === 'completed';
                  const isOngoing = progStatus === 'ongoing';
                  const isCenter = offset === 0;
                  const domainMeta = resolveActivityDomainMeta(prog.domain, prog.domainName);

                  let baseTranslateY = 0;
                  let scale = 1;
                  let opacity = 1;
                  let zIndex = 30;

                  if (offset === -2) {
                    baseTranslateY = -270;
                    scale = 0.82;
                    opacity = 0;
                    zIndex = 10;
                  } else if (offset === -1) {
                    baseTranslateY = -148;
                    scale = 0.91;
                    opacity = isCompleted ? 0.62 : 0.78;
                    zIndex = 20;
                  } else if (offset === 0) {
                    baseTranslateY = 0;
                    scale = 1;
                    opacity = 1;
                    zIndex = 30;
                  } else if (offset === 1) {
                    baseTranslateY = 206;
                    scale = 0.91;
                    opacity = isCompleted ? 0.62 : 0.78;
                    zIndex = 20;
                  } else if (offset === 2) {
                    baseTranslateY = 330;
                    scale = 0.82;
                    opacity = 0;
                    zIndex = 10;
                  }

                  const liveShift = Math.abs(offset) <= 1 ? dragOffsetY * (isCenter ? 0.85 : 0.45) : 0;

                  return (
                    <div
                      key={prog.id}
                      onClick={() => {
                        if (suppressCardClickRef.current) return;
                        if (isCenter) {
                          handleSelectProgram(prog.id);
                        } else {
                          hasUserSpunRef.current = true;
                          setActiveWheelIndex(idx);
                        }
                      }}
                      style={{
                        transform: `translate3d(0, calc(-50% + ${baseTranslateY + liveShift}px), 0) scale(${scale})`,
                        opacity,
                        zIndex,
                        transition: isWheelDragging
                          ? 'none'
                          : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                        pointerEvents: Math.abs(offset) > 1 ? 'none' : 'auto',
                      }}
                      className={`absolute inset-x-1 sm:inset-x-14 top-1/2 h-[246px] sm:h-[264px] rounded-3xl p-4 sm:p-6 flex flex-col justify-between cursor-pointer group ${
                        isCenter
                          ? isOngoing
                            ? 'bg-gradient-to-br from-white via-emerald-50/30 to-emerald-100/35 border-2 border-emerald-400 shadow-[0_14px_38px_rgba(16,185,129,0.16)]'
                            : isCompleted
                            ? 'bg-[#fafafa] border border-stone-300 shadow-[0_12px_32px_rgba(0,0,0,0.06)]'
                            : 'bg-[#ffffff] border border-black/[0.08] shadow-[0_14px_38px_rgba(0,0,0,0.08)]'
                          : isCompleted
                          ? 'bg-[#f8f8fa] border border-stone-200/80 shadow-xs'
                          : isOngoing
                          ? 'bg-[#ffffff] border border-emerald-300/80 shadow-sm'
                          : 'bg-[#ffffff] border border-black/[0.06] shadow-sm'
                      }`}
                    >
                      <div className="space-y-2 sm:space-y-2.5 min-w-0">
                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-[12px]">
                          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${domainMeta.bgColor} ${domainMeta.badgeColor}`}
                            >
                              <Tag className="w-3 h-3 shrink-0" />
                              <span>{domainMeta.name}</span>
                            </span>

                            <span className="text-[#0071e3] font-medium bg-[#f5f5f7] px-2.5 py-0.5 rounded-full shrink-0">
                              {prog.stageLabel}
                            </span>

                            <span className="text-[#86868b] font-mono tabular-nums shrink-0">
                              {hours} ساعات
                            </span>
                          </div>

                          {isOngoing && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                              جاري تنفيذها الآن
                            </span>
                          )}
                          {progStatus === 'upcoming' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 shrink-0">
                              قادمة
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 shrink-0">
                              <Lock className="w-3 h-3 text-stone-500" />
                              <span>منتهية</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          className={`text-[17px] sm:text-[21px] font-bold tracking-tight leading-snug line-clamp-2 transition-colors ${
                            isOngoing
                              ? 'text-emerald-950 group-hover:text-emerald-700'
                              : isCompleted
                              ? 'text-stone-700'
                              : 'text-[#1d1d1f] group-hover:text-[#0071e3]'
                          }`}
                        >
                          {prog.name}
                        </h3>

                        {/* Brief Description */}
                        <p className="text-[12.5px] sm:text-[13.5px] text-[#6e6e73] leading-relaxed line-clamp-2">
                          {prog.description}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {/* Date & Organizer */}
                        <div className="flex items-center gap-2 text-[11.5px] sm:text-[12px] text-[#86868b] truncate">
                          <Calendar className="w-3.5 h-3.5 text-[#86868b] shrink-0" />
                          <span className="font-mono text-[#1d1d1f] tabular-nums shrink-0">
                            {prog.gregorianDate} ({prog.month})
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{prog.organizer}</span>
                        </div>

                        {/* Actions row (only interactive when centered) */}
                        <div className="pt-2.5 border-t border-black/[0.05] flex items-center justify-between gap-1.5 sm:gap-2">
                          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                            <button
                              type="button"
                              tabIndex={isCenter ? 0 : -1}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isCenter) return;
                                setProgramForWhatsApp(prog);
                              }}
                              className="px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-[12px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200/60 shrink-0 whitespace-nowrap"
                              title="إرسال المبادرة للطلاب عبر واتساب"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="sm:hidden">واتساب</span>
                              <span className="hidden sm:inline">إرسال واتساب</span>
                            </button>

                            {isEffectiveSupervisor && (
                              <>
                                <button
                                  type="button"
                                  tabIndex={isCenter ? 0 : -1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCenter) return;
                                    setProgramToEdit(prog);
                                  }}
                                  className="p-1.5 sm:p-2 text-[#86868b] hover:text-[#0071e3] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer border border-black/[0.04] shrink-0"
                                  title="تعديل بيانات وتصنيف المبادرة"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  tabIndex={isCenter ? 0 : -1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isCenter) return;
                                    setProgramToDelete(prog);
                                  }}
                                  className="px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors flex items-center gap-1 cursor-pointer border border-rose-200/80 shrink-0 whitespace-nowrap"
                                  title="حذف المبادرة"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                  <span>حذف</span>
                                </button>
                              </>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {isOngoing && (
                              <button
                                type="button"
                                tabIndex={isCenter ? 0 : -1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isCenter) return;
                                  handleJoinInitiative(prog);
                                }}
                                className="px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full transition-colors flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                              >
                                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                <span className="sm:hidden">انضمام</span>
                                <span className="hidden sm:inline">انضمام فوري</span>
                              </button>
                            )}

                            <span className="text-[11.5px] sm:text-[13px] font-medium text-[#0071e3] group-hover:underline flex items-center gap-0.5 whitespace-nowrap">
                              <span className="sm:hidden">التفاصيل</span>
                              <span className="hidden sm:inline">عرض التفاصيل</span>
                              <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-8">
              <BookOpen className="w-10 h-10 text-[#86868b] mx-auto mb-2 opacity-40" />
              <h3 className="text-base font-semibold text-[#1d1d1f]">لا توجد مبادرات مطروحة حالياً</h3>
              <p className="text-[13px] text-[#86868b] mt-1 mb-4">
                سيتم إدراج المبادرات وفق الخطة المركزية للأنشطة الطلابية.
              </p>
              {isEffectiveSupervisor && (
                <button
                  onClick={() => setIsAddProgramOpen(true)}
                  className="px-4 py-2 bg-[#0071e3] text-white text-[13px] rounded-full cursor-pointer"
                >
                  + إضافة مبادرة جديدة
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#ffffff] rounded-3xl border border-black/[0.04] p-6">
              <BookOpen className="w-9 h-9 text-[#86868b] mx-auto mb-2 opacity-40" />
              <h3 className="text-[15px] font-semibold text-[#1d1d1f]">
                {statusFilter === 'ongoing' && 'لا توجد مبادرات جاري تنفيذها حالياً'}
                {statusFilter === 'upcoming' && 'لا توجد مبادرات قادمة حالياً'}
                {statusFilter === 'completed' && 'لا توجد مبادرات منتهية حالياً'}
              </h3>
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
            const selectedDomainMeta = resolveActivityDomainMeta(selectedProgram.domain, selectedProgram.domainName);

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
                        <span className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full border ${selectedDomainMeta.bgColor} ${selectedDomainMeta.badgeColor}`}>
                          <Tag className="w-3 h-3 shrink-0" />
                          <span>التصنيف: {selectedDomainMeta.name}</span>
                        </span>
                        <span className="text-[12px] font-medium text-[#0071e3] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full inline-block">
                          {selectedProgram.stageLabel}
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
