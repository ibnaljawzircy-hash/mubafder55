import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from '../types';
import {
  INITIAL_REGISTRATIONS,
  INITIAL_STUDENTS,
  LEGACY_DEMO_REGISTRATION_IDS,
  LEGACY_DEMO_STUDENT_IDS,
} from '../data/initialStudents';
import { INITIAL_VOLUNTEER_TASKS, YANBU_PROGRAMS } from '../data/yanbuPlanData';

const STORAGE_KEYS = {
  PROGRAMS: 'mobader_programs_v1',
  STUDENTS: 'mobader_students_v1',
  TASKS: 'mobader_tasks_v1',
  REGISTRATIONS: 'mobader_registrations_v1',
  CURRENT_USER: 'mobader_current_user_v1',
  DEMO_STATS_CLEANED: 'mobader_demo_stats_clean_v1',
  DEMO_STUDENTS_CLEANED: 'mobader_demo_students_clean_v1',
};

function runLegacyDemoStatsCleanup() {
  try {
    const demoRegIds = new Set(LEGACY_DEMO_REGISTRATION_IDS);
    let remainingRegs: VolunteerRegistration[] = [];

    const rawRegs = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (rawRegs) {
      const parsedRegs = JSON.parse(rawRegs) as VolunteerRegistration[];
      if (localStorage.getItem(STORAGE_KEYS.DEMO_STATS_CLEANED) !== 'done') {
        remainingRegs = parsedRegs.filter((r) => !demoRegIds.has(r.id));
        localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(remainingRegs));
      } else {
        remainingRegs = parsedRegs;
      }
    }

    const needStudentsClean = localStorage.getItem(STORAGE_KEYS.DEMO_STUDENTS_CLEANED) !== 'done';
    const needStatsClean = localStorage.getItem(STORAGE_KEYS.DEMO_STATS_CLEANED) !== 'done';

    if (needStudentsClean || needStatsClean) {
      const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (rawStudents) {
        const parsedStudents = JSON.parse(rawStudents) as Student[];
        const demoStuIds = new Set(LEGACY_DEMO_STUDENT_IDS);
        const regStudentIds = new Set(remainingRegs.map((r) => r.studentId));

        const cleanedStudents = parsedStudents
          .filter((stu) => !needStudentsClean || !demoStuIds.has(stu.id) || regStudentIds.has(stu.id))
          .map((stu) => {
            const completed = remainingRegs.filter(
              (r) => r.studentId === stu.id && r.attendanceStatus === 'completed'
            );
            const totalHours = completed.reduce((sum, r) => sum + r.hoursAwarded, 0);
            return {
              ...stu,
              totalHours,
              completedTasksCount: completed.length,
              badgeLevel: calculateBadgeLevel(totalHours),
            };
          });
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(cleanedStudents));
      }
    }

    localStorage.setItem(STORAGE_KEYS.DEMO_STATS_CLEANED, 'done');
    localStorage.setItem(STORAGE_KEYS.DEMO_STUDENTS_CLEANED, 'done');
  } catch (e) {
    console.error('Error cleaning legacy demo stats in localStorage', e);
  }
}

export function getStoredPrograms(): ActivityProgram[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading programs from localStorage', e);
  }
  return YANBU_PROGRAMS;
}

export function saveStoredPrograms(programs: ActivityProgram[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (e) {
    console.error('Error saving programs to localStorage', e);
  }
}

export function getStoredStudents(): Student[] {
  runLegacyDemoStatsCleanup();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading students from localStorage', e);
  }
  return INITIAL_STUDENTS;
}

export function saveStoredStudents(students: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Error saving students to localStorage', e);
  }
}

export function getStoredTasks(): VolunteerTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  return INITIAL_VOLUNTEER_TASKS;
}

export function saveStoredTasks(tasks: VolunteerTask[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }
}

export function getStoredRegistrations(): VolunteerRegistration[] {
  runLegacyDemoStatsCleanup();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading registrations from localStorage', e);
  }
  return INITIAL_REGISTRATIONS;
}

export function saveStoredRegistrations(registrations: VolunteerRegistration[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
  } catch (e) {
    console.error('Error saving registrations to localStorage', e);
  }
}

export function calculateBadgeLevel(totalHours: number): string {
  if (totalHours >= 13) return 'سفير التطوع الماسي';
  if (totalHours >= 9) return 'بطل العطاء الذهبي';
  if (totalHours >= 5) return 'بطل العطاء الفضي';
  if (totalHours >= 1) return 'متطوع مبادر';
  return 'متطوع جديد';
}

export function resetAllDataToDefault() {
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.REGISTRATIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}
