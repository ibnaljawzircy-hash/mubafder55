import { ACTIVITY_DOMAINS } from '../data/yanbuPlanData';
import {
  ActivityDomain,
  ActivityDomainMeta,
  ActivityProgram,
  VolunteerRegistration,
  VolunteerTask,
} from '../types';

/**
 * Resolves any program/task domain identifier or Arabic name strictly to one of the 8 ACTIVITY_DOMAINS
 */
export const resolveActivityDomainMeta = (
  domain?: ActivityDomain | string,
  domainName?: string
): ActivityDomainMeta => {
  if (domain) {
    const byId = ACTIVITY_DOMAINS.find((d) => d.id === domain);
    if (byId) return byId;
  }

  const normalizedName = (domainName || '').trim();
  if (normalizedName) {
    const byName = ACTIVITY_DOMAINS.find((d) => d.name === normalizedName);
    if (byName) return byName;
  }

  const text = `${domain || ''} ${normalizedName}`.trim().toLowerCase();
  if (text.includes('ثقاف') || text.includes('فن') || text.includes('قراء') || text.includes('إلقاء') || text.includes('مسرح')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'cultural_arts')!;
  }
  if (text.includes('مواطن') || text.includes('حياة') || text.includes('تطوع') || text.includes('مجتمع') || text.includes('سلام')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'citizenship_life')!;
  }
  if (text.includes('صح') || text.includes('رياض') || text.includes('بدن') || text.includes('دوري')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'health_sports')!;
  }
  if (text.includes('كشف')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'scouts')!;
  }
  if (text.includes('علم') || text.includes('تقن') || text.includes('روبوت') || text.includes('ذكاء') || text.includes('حاسب')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'science_tech')!;
  }
  if (text.includes('مناسب') || text.includes('عالم') || text.includes('وطن') || text.includes('تأسيس') || text.includes('معلم')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'national_world_days')!;
  }
  if (text.includes('تعليم') || text.includes('جود') || text.includes('فصل') || text.includes('محاكي')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'educational_initiatives')!;
  }
  if (text.includes('جائز') || text.includes('مسابق') || text.includes('تحدي') || text.includes('أولمبياد')) {
    return ACTIVITY_DOMAINS.find((d) => d.id === 'awards_competitions')!;
  }

  return ACTIVITY_DOMAINS.find((d) => d.id === 'scouts') || ACTIVITY_DOMAINS[0];
};

export const resolveProgramDomainId = (
  program: Pick<ActivityProgram, 'domain' | 'domainName'>
): ActivityDomain => {
  return resolveActivityDomainMeta(program.domain, program.domainName).id;
};

export const resolveTaskDomainId = (
  task: Pick<VolunteerTask, 'programId' | 'domain'>,
  programs: ActivityProgram[]
): ActivityDomain => {
  const parentProgram = programs.find((p) => p.id === task.programId);
  if (parentProgram) {
    return resolveProgramDomainId(parentProgram);
  }
  return resolveActivityDomainMeta(task.domain).id;
};

export const resolveRegistrationDomainId = (
  reg: VolunteerRegistration,
  tasks: VolunteerTask[],
  programs: ActivityProgram[]
): ActivityDomain | undefined => {
  const task = tasks.find((t) => t.id === reg.taskId);
  const parentProgramId = reg.programId || task?.programId;
  const parentProgram = parentProgramId
    ? programs.find((p) => p.id === parentProgramId)
    : undefined;

  if (parentProgram) {
    return resolveProgramDomainId(parentProgram);
  }
  if (task) {
    return resolveActivityDomainMeta(task.domain).id;
  }
  return undefined;
};

/**
 * Parses gregorianDate string (e.g. '2026/09/06', '2026-11-09', or '٢٠٢٦/٠٩/٠٦') into timestamp
 */
export const parseProgramDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  // Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
  const western = dateStr.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const clean = western.replace(/\//g, '-').trim();
  const time = new Date(clean).getTime();
  return isNaN(time) ? 0 : time;
};

/**
 * Determines program status: 'ongoing' | 'upcoming' | 'completed'
 * 1. Honors explicit status set by supervisor if available.
 * 2. Otherwise calculates dynamically based on academic calendar date.
 */
export const getProgramStatus = (program: ActivityProgram): 'ongoing' | 'upcoming' | 'completed' => {
  // If supervisor explicitly set status, respect it
  if (program.status === 'ongoing' || program.status === 'upcoming' || program.status === 'completed') {
    return program.status;
  }

  const dateMs = parseProgramDate(program.gregorianDate);
  if (!dateMs) return 'upcoming';

  const progDate = new Date(dateMs);
  const now = new Date(); // e.g. Nov 2026 in environment

  // Compare year and month
  const progYear = progDate.getFullYear();
  const progMonth = progDate.getMonth(); // 0-indexed (10 = November)
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();

  // If in the past month or earlier year: completed
  if (progYear < nowYear || (progYear === nowYear && progMonth < nowMonth)) {
    return 'completed';
  }

  // If in the current month: ongoing (جاري تنفيذها)
  if (progYear === nowYear && progMonth === nowMonth) {
    return 'ongoing';
  }

  // Future month: upcoming (قادمة / قيد الإعداد)
  return 'upcoming';
};

/**
 * Sorts programs chronologically by gregorianDate
 */
export const sortProgramsChronologically = (programs: ActivityProgram[]): ActivityProgram[] => {
  return [...programs].sort((a, b) => {
    const timeA = parseProgramDate(a.gregorianDate);
    const timeB = parseProgramDate(b.gregorianDate);
    return timeA - timeB;
  });
};
