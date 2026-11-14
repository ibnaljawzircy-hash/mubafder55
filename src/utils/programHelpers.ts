import { ActivityProgram } from '../types';

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
