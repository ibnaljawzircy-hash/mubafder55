import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileSpreadsheet,
  GraduationCap,
  HeartHandshake,
  MessageSquare,
  Plus,
  Search,
  Send,
  Sparkles,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import {
  ActivityDomain,
  ActivityProgram,
  GradeStage,
  Student,
  VolunteerRegistration,
  VolunteerTask,
} from '../../types';
import { exportNonParticipatingStudentsExcel } from '../../utils/excel';
import { resolveActivityDomainMeta, resolveProgramDomainId } from '../../utils/programHelpers';

interface NonParticipatingStudentsProps {
  students: Student[];
  programs: ActivityProgram[];
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  onAssignStudentsToInitiative: (
    studentIds: string[],
    programId: string,
    taskId?: string
  ) => void;
  onCreateTargetedInitiative: (
    program: Omit<ActivityProgram, 'id'>,
    task: Omit<VolunteerTask, 'id' | 'programId' | 'programName' | 'domain' | 'checkInCode'>,
    studentIdsToEnroll: string[]
  ) => void;
  onNavigate: (tab: string) => void;
  onNotify?: (message: string) => void;
}

type ParticipationBucket = 'all' | 'never_registered' | 'pending_or_incomplete';

interface InitiativePreset {
  id: string;
  label: string;
  title: string;
  domain: ActivityDomain;
  taskTitle: string;
  hours: number;
  description: string;
}

const INITIATIVE_PRESETS: InitiativePreset[] = [
  {
    id: 'discipline',
    label: 'انضباط واستقبال',
    title: 'فريق الاستقبال وتنظيم الطابور الصباحي',
    domain: 'citizenship_life',
    taskTitle: 'تنظيم دخول الطلاب واستقبالهم في البوابة الرئيسية',
    hours: 2,
    description: 'مبادرة ميسرة لإشراك الطلاب الجدد في تنظيم الاصطفاف الصباحي واستقبال الزملاء بروح قيادية.',
  },
  {
    id: 'library',
    label: 'القراءة والمكتبة',
    title: 'أصدقاء مصادر التعلم والمكتبة المدرسية',
    domain: 'educational_initiatives',
    taskTitle: 'ترتيب الكتب ومساعدة الطلاب في الاستعارة القرائية',
    hours: 2,
    description: 'فرصة تطوعية هادئة ومحببة للطلاب لمساعدة أمين المكتبة في تصنيف الكتب وتشجيع القراءة.',
  },
  {
    id: 'media',
    label: 'توثيق وتصوير',
    title: 'الفريق الإعلامي وتوثيق الفعاليات المدرسية',
    domain: 'science_tech',
    taskTitle: 'تصوير الأنشطة وإعداد تقرير إعلامي موجز',
    hours: 2,
    description: 'مبادرة تناسب الطلاب المبدعين في التقنية والتصوير لتوثيق إنجازات المدرسة والأنشطة.',
  },
  {
    id: 'eco',
    label: 'البيئة والتشجير',
    title: 'فريق مبادر للعناية بالبيئة المدرسية',
    domain: 'scouts',
    taskTitle: 'سقاية النباتات وتجميل الساحة المدرسية',
    hours: 2,
    description: 'مبادرة جماعية عملية لتعزيز المسؤولية البيئية والعمل بروح الفريق في الفسحة أو النشاط.',
  },
];

function formatSaudiWhatsAppPhone(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('05') && digits.length >= 10) return `966${digits.slice(1)}`;
  if (digits.startsWith('5') && digits.length >= 9) return `966${digits}`;
  return digits;
}

function getProgramExecutionBucket(program: ActivityProgram): 'ongoing' | 'upcoming' | 'completed' {
  if (program.status) return program.status;
  const datePart = (program.gregorianDate || '').split(' ')[0].trim();
  const parsed = new Date(datePart.replace(/\//g, '-'));
  if (!Number.isNaN(parsed.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < -7) return 'completed';
    if (diffDays <= 14) return 'ongoing';
  }
  return 'upcoming';
}

export const NonParticipatingStudents: React.FC<NonParticipatingStudentsProps> = ({
  students,
  programs,
  tasks,
  registrations,
  onAssignStudentsToInitiative,
  onCreateTargetedInitiative,
  onNavigate,
  onNotify,
}) => {
  const [bucketFilter, setBucketFilter] = useState<ParticipationBucket>('all');
  const [stageFilter, setStageFilter] = useState<GradeStage>('all');
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Quick assign modal/popover state
  const [assigningStudentIds, setAssigningStudentIds] = useState<string[] | null>(null);
  const [selectedAssignProgramId, setSelectedAssignProgramId] = useState<string>('');

  // Motivation modal state
  const [motivatingStudent, setMotivatingStudent] = useState<Student | null>(null);
  const [bulkMotivateOpen, setBulkMotivateOpen] = useState(false);
  const [motivationTemplateKey, setMotivationTemplateKey] = useState<'first_step' | 'parent' | 'specific'>('first_step');
  const [motivationProgramId, setMotivationProgramId] = useState<string>('');
  const [customMotivationText, setCustomMotivationText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create targeted initiative modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetName, setTargetName] = useState('');
  const [targetDomain, setTargetDomain] = useState<ActivityDomain>('citizenship_life');
  const [targetStage, setTargetStage] = useState<GradeStage>('all');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0].replace(/-/g, '/'));
  const [targetMonth, setTargetMonth] = useState('نوفمبر');
  const [targetDescription, setTargetDescription] = useState('');
  const [targetTaskTitle, setTargetTaskTitle] = useState('');
  const [targetHours, setTargetHours] = useState<number>(2);
  const [targetMaxVolunteers, setTargetMaxVolunteers] = useState<number>(20);
  const [targetLocation, setTargetLocation] = useState('مدرسة ابن الجوزي للموهوبين');
  const [targetStatus, setTargetStatus] = useState<'ongoing' | 'upcoming'>('ongoing');
  const [enrollSelectedInNew, setEnrollSelectedInNew] = useState(true);
  const [modalStudentIds, setModalStudentIds] = useState<string[]>([]);

  // Active/open programs for recommendation & assignment
  const availablePrograms = useMemo(() => {
    return programs.filter((p) => getProgramExecutionBucket(p) !== 'completed');
  }, [programs]);

  // Identify students with 0 certified hours and 0 attended/completed participations
  const nonParticipatingRecords = useMemo(() => {
    return students
      .map((student) => {
        const studentRegs = registrations.filter((r) => r.studentId === student.id);
        const hasActiveOrCompleted =
          student.totalHours > 0 ||
          studentRegs.some(
            (r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended'
          );

        if (hasActiveOrCompleted) return null;

        const neverRegistered = studentRegs.length === 0;
        const hasAbsent = studentRegs.some((r) => r.attendanceStatus === 'absent');
        const statusLabel = neverRegistered
          ? 'لم يسجل في أي مبادرة'
          : hasAbsent
          ? 'سجل سابقاً ولم يحضر'
          : 'طلب مسجل دون توثيق ساعات';

        // Stage-matched open/upcoming initiatives
        const stageMatchedPrograms = availablePrograms.filter(
          (p) => p.stage === 'all' || p.stage === student.stage
        );

        return {
          student,
          registrations: studentRegs,
          neverRegistered,
          hasAbsent,
          statusLabel,
          stageMatchedPrograms,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [students, registrations, availablePrograms]);

  const neverRegisteredCount = nonParticipatingRecords.filter((r) => r.neverRegistered).length;
  const incompleteOnlyCount = nonParticipatingRecords.filter((r) => !r.neverRegistered).length;
  const primaryNonPartCount = nonParticipatingRecords.filter(
    (r) => r.student.stage === 'primary'
  ).length;
  const intermediateNonPartCount = nonParticipatingRecords.filter(
    (r) => r.student.stage === 'intermediate'
  ).length;

  // Classroom distribution of non-participating students
  const classroomSummary = useMemo(() => {
    const map = new Map<string, { label: string; count: number; stage: GradeStage }>();
    nonParticipatingRecords.forEach(({ student }) => {
      const key = `${student.grade} · ${student.classroom}`;
      const prev = map.get(key);
      if (prev) {
        prev.count += 1;
      } else {
        map.set(key, { label: key, count: 1, stage: student.stage });
      }
    });
    return Array.from(map.entries())
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => b.count - a.count);
  }, [nonParticipatingRecords]);

  // Filtered list
  const filteredRecords = useMemo(() => {
    return nonParticipatingRecords.filter((item) => {
      if (bucketFilter === 'never_registered' && !item.neverRegistered) return false;
      if (bucketFilter === 'pending_or_incomplete' && item.neverRegistered) return false;
      if (stageFilter !== 'all' && item.student.stage !== stageFilter) return false;

      if (classroomFilter !== 'all') {
        const key = `${item.student.grade} · ${item.student.classroom}`;
        if (key !== classroomFilter) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matches =
          item.student.name.toLowerCase().includes(q) ||
          item.student.mobile.includes(q) ||
          item.student.grade.toLowerCase().includes(q) ||
          item.student.classroom.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [nonParticipatingRecords, bucketFilter, stageFilter, classroomFilter, searchTerm]);

  const allFilteredSelected =
    filteredRecords.length > 0 &&
    filteredRecords.every((r) => selectedStudentIds.includes(r.student.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredRecords.map((r) => r.student.id));
      setSelectedStudentIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const next = new Set(selectedStudentIds);
      filteredRecords.forEach((r) => next.add(r.student.id));
      setSelectedStudentIds(Array.from(next));
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  // Build motivation text dynamically
  const buildMotivationMessage = (
    student: Student | null,
    template: 'first_step' | 'parent' | 'specific',
    programId: string
  ) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const prog = programs.find((p) => p.id === programId);
    const progUrl = prog ? `${origin}/?program=${prog.id}` : origin;
    const studentFirst = student ? student.name.split(' ')[0] : 'بطلنا الموهوب';
    const fullName = student ? student.name : 'طلابنا الموهوبين';
    const stageText = student
      ? student.stage === 'primary'
        ? 'المرحلة الابتدائية'
        : 'المرحلة المتوسطة'
      : 'المرحلتين الابتدائية والمتوسطة';

    if (template === 'parent') {
      return `السلام عليكم ورحمة الله وبركاته\nولي أمر الطالب الموهوب (${fullName})، نسعد في مدرسة ابن الجوزي للموهوبين بمتابعة مسيرة ابنكم في التطوع المدرسي.\nلاحظنا عدم تسجيل ساعات تطوعية للطالب حتى الآن، وندعوكم لتشجيعه على الانضمام في أقرب مبادرة مناسبة لمرحلته (${stageText})${
        prog ? ` مثل: «${prog.name}» (${prog.gregorianDate})` : ''
      }.\n\nرابط منصة مُبادر للتسجيل السريع برقم الجوال:\n${progUrl}`;
    }

    if (template === 'specific' && prog) {
      const domainMeta = resolveActivityDomainMeta(prog.domain, prog.domainName);
      return `مرحباً يا ${studentFirst} 🌟\nرشّحنا لك في منصة مُبادر فرصة تطوعية مميزة تناسب مرحلتك (${stageText}):\n📌 المبادرة: ${prog.name}\n🏷️ المجال: ${domainMeta.name}\n📅 الموعد: ${prog.gregorianDate}\n\nبادر بالتسجيل الآن لتوثيق أولى ساعاتك التطوعية المعتمدة والحصول على شهادة ووسام التطوع:\n${progUrl}`;
    }

    return `أهلاً ببطلنا ${studentFirst} في مدرسة ابن الجوزي للموهوبين 🌱\nموهبتك وعطاؤك يصنعان فرقاً جميلاً في مدرستك! ننتظر انطلاقك في أول مبادرة تطوعية هذا الفصل عبر منصة مُبادر لتوثيق ساعاتك وبناء سجلك التطوعي المعتمد.${
      prog ? `\n\nمبادرة مقترحة تناسبك الآن: «${prog.name}»` : ''
    }\n\nللدخول والتسجيل السريع برقم الجوال:\n${progUrl}`;
  };

  const openMotivateStudent = (student: Student) => {
    const matchingProg =
      availablePrograms.find((p) => p.stage === student.stage || p.stage === 'all') ||
      availablePrograms[0];
    const defaultProgId = matchingProg?.id || '';
    setMotivatingStudent(student);
    setMotivationTemplateKey('first_step');
    setMotivationProgramId(defaultProgId);
    setCustomMotivationText(buildMotivationMessage(student, 'first_step', defaultProgId));
  };

  const openBulkMotivate = () => {
    const defaultProgId = availablePrograms[0]?.id || '';
    setBulkMotivateOpen(true);
    setMotivationTemplateKey('first_step');
    setMotivationProgramId(defaultProgId);
    setCustomMotivationText(buildMotivationMessage(null, 'first_step', defaultProgId));
  };

  const handleCopyText = (text: string, idKey: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
    onNotify?.('تم نسخ الرسالة التحفيزية إلى الحافظة');
  };

  const openAssignModal = (studentIds: string[]) => {
    const firstStu = students.find((s) => s.id === studentIds[0]);
    const matching =
      availablePrograms.find((p) => !firstStu || p.stage === 'all' || p.stage === firstStu.stage) ||
      availablePrograms[0];
    setAssigningStudentIds(studentIds);
    setSelectedAssignProgramId(matching?.id || '');
  };

  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningStudentIds || assigningStudentIds.length === 0 || !selectedAssignProgramId) return;
    const relatedTask = tasks.find(
      (t) => t.programId === selectedAssignProgramId && t.status !== 'cancelled'
    );
    onAssignStudentsToInitiative(assigningStudentIds, selectedAssignProgramId, relatedTask?.id);
    setAssigningStudentIds(null);
    setSelectedStudentIds((prev) => prev.filter((id) => !assigningStudentIds.includes(id)));
  };

  const openCreateTargetedModal = (preselectedIds?: string[]) => {
    const ids = preselectedIds && preselectedIds.length > 0 ? preselectedIds : selectedStudentIds;
    const targetList = ids.length > 0 ? ids : filteredRecords.map((r) => r.student.id);

    // Infer stage if all target students share one stage
    const stagesSet = new Set(
      students.filter((s) => targetList.includes(s.id)).map((s) => s.stage)
    );
    const inferredStage: GradeStage =
      stagesSet.size === 1
        ? Array.from(stagesSet)[0]
        : stageFilter !== 'all'
        ? stageFilter
        : 'all';

    setTargetStage(inferredStage);
    setModalStudentIds(ids.length > 0 ? ids : []);
    setEnrollSelectedInNew(ids.length > 0);
    setTargetName('');
    setTargetTaskTitle('');
    setTargetDescription('');
    setTargetHours(2);
    setTargetStatus('ongoing');
    setShowCreateModal(true);
  };

  const applyPreset = (preset: InitiativePreset) => {
    setTargetName(preset.title);
    setTargetDomain(preset.domain);
    setTargetTaskTitle(preset.taskTitle);
    setTargetHours(preset.hours);
    setTargetDescription(preset.description);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetName.trim()) return;

    const domainMeta = ACTIVITY_DOMAINS.find((d) => d.id === targetDomain) || ACTIVITY_DOMAINS[0];
    const stageLabel =
      targetStage === 'all'
        ? 'جميع المراحل'
        : targetStage === 'primary'
        ? 'المرحلة الابتدائية'
        : 'المرحلة المتوسطة';

    const programPayload: Omit<ActivityProgram, 'id'> = {
      name: targetName.trim(),
      domain: domainMeta.id,
      domainName: domainMeta.name,
      stage: targetStage,
      stageLabel,
      month: targetMonth.trim() || 'نوفمبر',
      gregorianDate: targetDate.trim() || '2026/11/15',
      hijriDate: '',
      organizer: 'مدرسة ابن الجوزي للموهوبين',
      description:
        targetDescription.trim() ||
        'مبادرة تطوعية مخصصة لدمج وتحفيز الطلاب غير المشاركين ضمن مجالات النشاط المعتمدة.',
      status: targetStatus,
    };

    const taskPayload: Omit<
      VolunteerTask,
      'id' | 'programId' | 'programName' | 'domain' | 'checkInCode'
    > = {
      title: targetTaskTitle.trim() || `المشاركة والتطوع في ${targetName.trim()}`,
      description: programPayload.description,
      requiredSkills: ['المبادرة', 'الالتزام', 'التعاون'],
      stage: targetStage,
      hours: Number(targetHours) > 0 ? Number(targetHours) : 2,
      maxVolunteers: Number(targetMaxVolunteers) > 0 ? Number(targetMaxVolunteers) : 20,
      date: programPayload.gregorianDate.replace(/\//g, '-'),
      time: '08:00 ص - 10:00 ص',
      location: targetLocation.trim() || 'مدرسة ابن الجوزي للموهوبين',
      supervisorName: 'رائد النشاط الطلابي',
      status: 'open',
    };

    const enrollIds = enrollSelectedInNew ? modalStudentIds : [];
    onCreateTargetedInitiative(programPayload, taskPayload, enrollIds);
    setShowCreateModal(false);
    if (enrollIds.length > 0) {
      setSelectedStudentIds((prev) => prev.filter((id) => !enrollIds.includes(id)));
    }
  };

  const handleExportList = () => {
    const rows = filteredRecords.map((item) => ({
      student: item.student,
      statusLabel: item.statusLabel,
      registrationsCount: item.registrations.length,
      suggestedInitiatives:
        item.stageMatchedPrograms
          .slice(0, 3)
          .map((p) => p.name)
          .join(' | ') || 'لا توجد مبادرات مفتوحة حالياً',
    }));
    exportNonParticipatingStudentsExcel(rows);
    onNotify?.('تم تصدير قائمة الطلاب غير المشاركين إلى ملف Excel');
  };

  const totalStudents = students.length;
  const nonPartPercent =
    totalStudents > 0 ? Math.round((nonParticipatingRecords.length / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-[#ffffff] rounded-3xl p-6 sm:p-8 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#86868b]">
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="text-[#0071e3] hover:underline font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للوحة الإنجازات</span>
              </button>
              <span aria-hidden="true">·</span>
              <span>متابعة وتحفيز غير المشاركين</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-[#1d1d1f] tracking-tight">
              قسم متابعة الطلاب غير المشاركين
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#86868b] max-w-2xl leading-relaxed">
              رصد الطلاب الذين لم توثق لهم ساعات تطوعية بعد، والتواصل لتحفيزهم، ووضع مبادرات مخصصة تناسب مراحلهم الدراسية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openCreateTargetedModal()}
              className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>وضع مبادرة تناسبهم</span>
            </button>

            {nonParticipatingRecords.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={openBulkMotivate}
                  className="px-4 py-2.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[13px] font-medium rounded-full transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <MessageSquare className="w-4 h-4 text-[#0071e3]" />
                  <span>رسالة تحفيز جماعية</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportList}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[13px] font-medium rounded-full border border-emerald-200/80 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>تصدير المتابعة</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-black/[0.04]">
          <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] space-y-1">
            <span className="text-[11px] font-medium text-[#86868b] block">
              إجمالي غير المشاركين
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#1d1d1f] font-mono tabular-nums">
                {nonParticipatingRecords.length}
              </span>
              <span className="text-[12px] text-[#86868b] font-mono tabular-nums">
                ({nonPartPercent}% من {totalStudents})
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] space-y-1">
            <span className="text-[11px] font-medium text-[#86868b] block">
              لم يسجل في أي مبادرة
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-amber-700 font-mono tabular-nums">
                {neverRegisteredCount}
              </span>
              <span className="text-[12px] text-[#86868b]">يحتاج دعوة أولى</span>
            </div>
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] space-y-1">
            <span className="text-[11px] font-medium text-[#86868b] block">
              مسجل ولم يوثق ساعات
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#0071e3] font-mono tabular-nums">
                {incompleteOnlyCount}
              </span>
              <span className="text-[12px] text-[#86868b]">طلب معلق أو غياب</span>
            </div>
          </div>

          <div className="p-4 bg-[#f5f5f7] rounded-2xl border border-black/[0.04] space-y-1">
            <span className="text-[11px] font-medium text-[#86868b] block">
              توزيع المرحلتين
            </span>
            <div className="flex items-center gap-3 text-[13px] font-semibold text-[#1d1d1f] font-mono tabular-nums pt-1">
              <span>ابتدائي: {primaryNonPartCount}</span>
              <span className="text-[#86868b]" aria-hidden="true">·</span>
              <span>متوسط: {intermediateNonPartCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Empty / Completed States */}
      {students.length === 0 ? (
        <div className="bg-[#ffffff] rounded-3xl p-10 text-center border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <Users className="w-10 h-10 text-[#86868b] mx-auto opacity-45" />
          <h3 className="text-lg font-semibold text-[#1d1d1f]">
            لا يوجد طلاب مسجلون في السجل العام بعد
          </h3>
          <p className="text-[13px] text-[#86868b] max-w-md mx-auto leading-relaxed">
            أضف الطلاب يدوياً أو استورد قائمة المدرسة من ملف إكسل ليتم رصد الطلاب غير المشاركين ومتابعتهم تلقائياً.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('students')}
              className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors cursor-pointer"
            >
              الانتقال إلى سجل الطلاب واستيراد إكسل
            </button>
          </div>
        </div>
      ) : nonParticipatingRecords.length === 0 ? (
        <div className="bg-[#ffffff] rounded-3xl p-10 text-center border border-emerald-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-lg font-semibold text-[#1d1d1f]">
            ممتاز! جميع طلاب المدرسة شاركوا في المبادرات التطوعية
          </h3>
          <p className="text-[13px] text-[#86868b] max-w-md mx-auto leading-relaxed">
            كل طالب مسجل في المنصة لديه مشاركة فعلية أو ساعات تطوعية معتمدة.
          </p>
        </div>
      ) : (
        <>
          {/* Classroom Breakdown Quick Filter */}
          {classroomSummary.length > 0 && (
            <div className="bg-[#ffffff] rounded-3xl p-5 sm:p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1d1d1f]">
                    الفصول الأكثر احتياجاً للمتابعة
                  </h3>
                  <p className="text-[12px] text-[#86868b]">
                    اضغط على أي صف لتصفية طلابه وإعداد مبادرة أو رسالة تحفيزية موجهة لهم
                  </p>
                </div>
                {classroomFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setClassroomFilter('all')}
                    className="text-[12px] text-[#0071e3] hover:underline font-medium cursor-pointer"
                  >
                    عرض جميع الصفوف
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {classroomSummary.slice(0, 10).map((cls) => {
                  const active = classroomFilter === cls.key;
                  return (
                    <button
                      key={cls.key}
                      type="button"
                      onClick={() => setClassroomFilter(active ? 'all' : cls.key)}
                      className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#1d1d1f] text-white border-[#1d1d1f]'
                          : 'bg-[#f5f5f7] text-[#1d1d1f] border-black/[0.06] hover:bg-[#e8e8ed]'
                      }`}
                    >
                      <span>{cls.label}</span>
                      <span className="font-mono tabular-nums opacity-80">({cls.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Bar + Multi-select Actions */}
          <div className="bg-[#ffffff] rounded-3xl p-5 sm:p-6 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Segmented Bucket Filter */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#f5f5f7] rounded-2xl border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setBucketFilter('all')}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    bucketFilter === 'all'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  الكل ({nonParticipatingRecords.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBucketFilter('never_registered')}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    bucketFilter === 'never_registered'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  لم يسجل إطلاقاً ({neverRegisteredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBucketFilter('pending_or_incomplete')}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    bucketFilter === 'pending_or_incomplete'
                      ? 'bg-white text-[#1d1d1f] shadow-xs'
                      : 'text-[#86868b] hover:text-[#1d1d1f]'
                  }`}
                >
                  مسجل ولم يكمل ({incompleteOnlyCount})
                </button>
              </div>

              {/* Stage + Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-xl border border-black/[0.04]">
                  {(['all', 'primary', 'intermediate'] as GradeStage[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStageFilter(st)}
                      className={`px-3 py-1 text-[12px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        stageFilter === st
                          ? 'bg-white text-[#1d1d1f] shadow-xs'
                          : 'text-[#86868b] hover:text-[#1d1d1f]'
                      }`}
                    >
                      {st === 'all' ? 'الكل' : st === 'primary' ? 'ابتدائي' : 'متوسط'}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[210px]">
                  <Search className="w-4 h-4 text-[#86868b] absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ابحث بالاسم أو الجوال أو الصف..."
                    className="w-full pr-9 pl-4 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.06] rounded-full focus:outline-none focus:border-[#0071e3] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Bulk Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black/[0.04]">
              <label className="flex items-center gap-2 text-[12px] font-medium text-[#1d1d1f] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAllFiltered}
                  className="w-4 h-4 rounded accent-[#0071e3] cursor-pointer"
                />
                <span>
                  تحديد الظاهرين ({filteredRecords.length} طالب)
                </span>
              </label>

              {selectedStudentIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#0071e3] font-mono">
                    تم تحديد {selectedStudentIds.length} طالب
                  </span>
                  <button
                    type="button"
                    onClick={() => openCreateTargetedModal(selectedStudentIds)}
                    className="px-3.5 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>وضع مبادرة مخصصة لهم</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAssignModal(selectedStudentIds)}
                    className="px-3.5 py-1.5 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full border border-black/[0.08] transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>ترشيح لمبادرة قائمة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIds([])}
                    className="px-2.5 py-1.5 text-[12px] text-[#86868b] hover:text-[#1d1d1f] cursor-pointer"
                  >
                    إلغاء التحديد
                  </button>
                </div>
              )}
            </div>

            {/* Students List */}
            {filteredRecords.length === 0 ? (
              <div className="py-10 text-center text-[13px] text-[#86868b]">
                لا توجد نتائج مطابقة لمعايير البحث أو التصفية الحالية.
              </div>
            ) : (
              <div className="divide-y divide-black/[0.05]">
                {filteredRecords.map((item) => {
                  const { student, statusLabel, neverRegistered, stageMatchedPrograms } = item;
                  const isSelected = selectedStudentIds.includes(student.id);
                  const topSuggestions = stageMatchedPrograms.slice(0, 2);

                  return (
                    <div
                      key={student.id}
                      className={`py-4 px-3 -mx-3 rounded-2xl transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                        isSelected ? 'bg-[#0071e3]/[0.04]' : 'hover:bg-[#f5f5f7]/60'
                      }`}
                    >
                      {/* Student Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleStudentSelection(student.id)}
                          aria-label={`تحديد ${student.name}`}
                          className="w-4 h-4 mt-1 rounded accent-[#0071e3] cursor-pointer shrink-0"
                        />

                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[14px] font-semibold text-[#1d1d1f]">
                              {student.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                                neverRegistered ? 'text-amber-700' : 'text-[#0071e3]'
                              }`}
                            >
                              {neverRegistered ? (
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>{statusLabel}</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-[#86868b]">
                            <span>{student.stage === 'primary' ? 'الابتدائية' : 'المتوسطة'}</span>
                            <span aria-hidden="true">·</span>
                            <span>{student.grade}</span>
                            <span aria-hidden="true">·</span>
                            <span>فصل {student.classroom}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{student.mobile}</span>
                          </div>

                          {/* Suggested stage-appropriate initiatives */}
                          {topSuggestions.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-[#86868b]">
                              <span className="font-medium text-[#1d1d1f]">مبادرات تناسبه:</span>
                              {topSuggestions.map((prog, idx) => (
                                <React.Fragment key={prog.id}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <button
                                    type="button"
                                    onClick={() => onAssignStudentsToInitiative([student.id], prog.id)}
                                    title="اضغط لترشيح الطالب لهذه المبادرة"
                                    className="text-[#0071e3] hover:underline cursor-pointer truncate max-w-[220px]"
                                  >
                                    {prog.name}
                                  </button>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Row Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pr-7 lg:pr-0">
                        <button
                          type="button"
                          onClick={() => openMotivateStudent(student)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[12px] font-medium rounded-full border border-emerald-200/80 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-600" />
                          <span>تحفيز الطالب</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openAssignModal([student.id])}
                          className="px-3.5 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full border border-black/[0.06] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <UserPlus className="w-3.5 h-3.5 text-[#0071e3]" />
                          <span>إسناد لمبادرة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openCreateTargetedModal([student.id])}
                          className="px-3.5 py-2 bg-[#ffffff] hover:bg-[#f5f5f7] text-[#1d1d1f] text-[12px] font-medium rounded-full border border-black/[0.1] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-[#1d1d1f]" />
                          <span>مبادرة مخصصة</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================================================
          MODAL 1: Motivate Single Student or Bulk Message
         ============================================================ */}
      {(motivatingStudent || bulkMotivateOpen) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 relative">
            <button
              type="button"
              onClick={() => {
                setMotivatingStudent(null);
                setBulkMotivateOpen(false);
              }}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#86868b]">
                {motivatingStudent
                  ? `متابعة الطالب · ${motivatingStudent.stage === 'primary' ? 'الابتدائية' : 'المتوسطة'}`
                  : 'رسالة تحفيزية لقروبات الفصول وأولياء الأمور'}
              </span>
              <h3 className="text-lg font-semibold text-[#1d1d1f]">
                {motivatingStudent ? `تحفيز: ${motivatingStudent.name}` : 'رسالة تحفيز جماعية'}
              </h3>
            </div>

            {/* Template selector */}
            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[#1d1d1f]">
                أسلوب الرسالة التحفيزية:
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#f5f5f7] rounded-2xl">
                {[
                  { key: 'first_step' as const, label: 'تشجيع الطالب' },
                  { key: 'specific' as const, label: 'دعوة لمبادرة' },
                  { key: 'parent' as const, label: 'رسالة ولي الأمر' },
                ].map((tpl) => (
                  <button
                    key={tpl.key}
                    type="button"
                    onClick={() => {
                      setMotivationTemplateKey(tpl.key);
                      setCustomMotivationText(
                        buildMotivationMessage(motivatingStudent, tpl.key, motivationProgramId)
                      );
                    }}
                    className={`py-2 px-2 text-[12px] font-medium rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                      motivationTemplateKey === tpl.key
                        ? 'bg-white text-[#1d1d1f] shadow-xs'
                        : 'text-[#86868b] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matching Initiative picker */}
            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                تضمين مبادرة مقترحة تناسب مرحلته:
              </label>
              <select
                value={motivationProgramId}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setMotivationProgramId(nextId);
                  setCustomMotivationText(
                    buildMotivationMessage(motivatingStudent, motivationTemplateKey, nextId)
                  );
                }}
                className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              >
                <option value="">بدون تحديد مبادرة معينة</option>
                {(motivatingStudent
                  ? availablePrograms.filter(
                      (p) => p.stage === 'all' || p.stage === motivatingStudent.stage
                    )
                  : availablePrograms
                ).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.stageLabel})
                  </option>
                ))}
              </select>
            </div>

            {/* Editable message preview */}
            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                نص الرسالة (قابل للتعديل):
              </label>
              <textarea
                value={customMotivationText}
                onChange={(e) => setCustomMotivationText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-black/[0.04]">
              {motivatingStudent && formatSaudiWhatsAppPhone(motivatingStudent.mobile) ? (
                <a
                  href={`https://api.whatsapp.com/send?phone=${formatSaudiWhatsAppPhone(
                    motivatingStudent.mobile
                  )}&text=${encodeURIComponent(customMotivationText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال عبر واتساب ({motivatingStudent.mobile})</span>
                </a>
              ) : (
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(customMotivationText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>فتح واتساب للمشاركة</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => handleCopyText(customMotivationText, 'motivate-copy')}
                className="py-2.5 px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'motivate-copy' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#86868b]" />
                    <span>نسخ الرسالة</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL 2: Assign Student(s) to Existing Initiative
         ============================================================ */}
      {assigningStudentIds && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmAssign}
            className="bg-[#ffffff] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 relative"
          >
            <button
              type="button"
              onClick={() => setAssigningStudentIds(null)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[11px] font-semibold text-[#86868b]">
                ترشيح وإسناد مباشر
              </span>
              <h3 className="text-lg font-semibold text-[#1d1d1f] mt-0.5">
                إسناد {assigningStudentIds.length === 1 ? 'الطالب' : `${assigningStudentIds.length} طلاب`} إلى مبادرة قائمة
              </h3>
              <p className="text-[12px] text-[#86868b] mt-1">
                سيظهرون مباشرة في كشف المبادرة جاهزين لتحضيرهم واعتماد ساعاتهم فور التنفيذ.
              </p>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                اختر المبادرة المناسبة *
              </label>
              <select
                value={selectedAssignProgramId}
                onChange={(e) => setSelectedAssignProgramId(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              >
                <option value="">-- اختر المبادرة --</option>
                {availablePrograms.map((p) => {
                  const dm = resolveActivityDomainMeta(resolveProgramDomainId(p), p.domainName);
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} — {dm.name} ({p.stageLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => setAssigningStudentIds(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={!selectedAssignProgramId}
                className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white text-[13px] font-medium rounded-full transition-colors cursor-pointer"
              >
                تأكيد الإسناد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          MODAL 3: Create Targeted Initiative for Non-Participating Students
         ============================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-[#ffffff] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 relative my-8"
          >
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[11px] font-semibold text-[#86868b]">
                تصميم فرصة تطوعية تحفيزية
              </span>
              <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight mt-0.5">
                وضع مبادرة تناسب الطلاب غير المشاركين
              </h3>
            </div>

            {/* Ready Starter Templates */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-[#86868b] block">
                قوالب سريعة مقترحة لدمج غير المشاركين:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {INITIATIVE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 text-[11px] font-medium bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] rounded-full border border-black/[0.06] transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                اسم المبادرة *
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="مثال: مبادرة سفراء الترحيب والانضباط الصباحي"
                required
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  تصنيف المبادرة (المجالات الثمانية) *
                </label>
                <select
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value as ActivityDomain)}
                  className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                >
                  {ACTIVITY_DOMAINS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  المرحلة المستهدفة *
                </label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as GradeStage)}
                  className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                >
                  <option value="all">جميع المراحل</option>
                  <option value="primary">المرحلة الابتدائية</option>
                  <option value="intermediate">المرحلة المتوسطة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  عنوان المهمة التطوعية الفورية
                </label>
                <input
                  type="text"
                  value={targetTaskTitle}
                  onChange={(e) => setTargetTaskTitle(e.target.value)}
                  placeholder="تنظيم وتنفيذ مهام المبادرة"
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                    الساعات
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={targetHours}
                    onChange={(e) => setTargetHours(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                    المقاعد
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={targetMaxVolunteers}
                    onChange={(e) => setTargetMaxVolunteers(Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  التاريخ
                </label>
                <input
                  type="text"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  الشهر
                </label>
                <input
                  type="text"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full px-3 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                  الحالة
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as 'ongoing' | 'upcoming')}
                  className="w-full px-3 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                >
                  <option value="ongoing">جاري تنفيذها الآن</option>
                  <option value="upcoming">قادمة / قيد الإعداد</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                المكان والوصف الموجز
              </label>
              <input
                type="text"
                value={targetLocation}
                onChange={(e) => setTargetLocation(e.target.value)}
                placeholder="موقع التنفيذ"
                className="w-full px-4 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] mb-2"
              />
              <textarea
                value={targetDescription}
                onChange={(e) => setTargetDescription(e.target.value)}
                rows={2}
                placeholder="وصف الدور التطوعي لتشجيع الطلاب..."
                className="w-full px-4 py-2 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            {modalStudentIds.length > 0 && (
              <label className="flex items-center gap-2.5 p-3 bg-[#f5f5f7] rounded-2xl border border-black/[0.05] text-[12px] font-medium text-[#1d1d1f] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enrollSelectedInNew}
                  onChange={(e) => setEnrollSelectedInNew(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#0071e3] cursor-pointer"
                />
                <span>
                  ترشيح وإسناد الطلاب المحددين ({modalStudentIds.length} طالب) في هذه المبادرة فور إنشائها
                </span>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors cursor-pointer"
              >
                اعتماد المبادرة وإتاحتها
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
