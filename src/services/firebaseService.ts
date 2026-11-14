import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  query,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { ActivityProgram, Student, VolunteerTask, VolunteerRegistration } from '../types';
import { LEGACY_DEMO_REGISTRATION_IDS, LEGACY_DEMO_STUDENT_IDS } from '../data/initialStudents';
import { INITIAL_VOLUNTEER_TASKS, YANBU_PROGRAMS } from '../data/yanbuPlanData';
import { calculateBadgeLevel } from '../utils/storage';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: Record<string, unknown>;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// Test Connection on startup
export async function testFirebaseConnection() {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline cache/local state.');
    }
  }
}
testFirebaseConnection();

// Collection names
const STUDENTS_COLLECTION = 'students';
const PROGRAMS_COLLECTION = 'programs';
const TASKS_COLLECTION = 'tasks';
const REGISTRATIONS_COLLECTION = 'registrations';
const FIRESTORE_DEMO_RESET_KEY = 'mobader_firestore_demo_reset_v1';

// Seed initial data if Firestore collections are empty, and remove legacy demo statistics
export async function seedInitialFirestoreData() {
  try {
    // 1. Seed Programs (Initiatives)
    const programsSnap = await getDocs(collection(db, PROGRAMS_COLLECTION));
    if (programsSnap.empty) {
      for (const prog of YANBU_PROGRAMS) {
        await setDoc(doc(db, PROGRAMS_COLLECTION, prog.id), prog);
      }
    }

    // 2. Tasks
    const tasksSnap = await getDocs(collection(db, TASKS_COLLECTION));
    if (tasksSnap.empty) {
      for (const task of INITIAL_VOLUNTEER_TASKS) {
        await setDoc(doc(db, TASKS_COLLECTION, task.id), task);
      }
    }

    // 3. Clean up legacy pre-seeded demo registrations (reg-001..reg-009) if present
    const regSnap = await getDocs(collection(db, REGISTRATIONS_COLLECTION));
    const demoRegIdSet = new Set(LEGACY_DEMO_REGISTRATION_IDS);
    const legacyDemoRegDocs = regSnap.docs.filter((d) => demoRegIdSet.has(d.id));

    for (const demoDoc of legacyDemoRegDocs) {
      await deleteDoc(doc(db, REGISTRATIONS_COLLECTION, demoDoc.id));
    }

    const remainingRegs: VolunteerRegistration[] = regSnap.docs
      .filter((d) => !demoRegIdSet.has(d.id))
      .map((d) => d.data() as VolunteerRegistration);
    const regStudentIds = new Set(remainingRegs.map((r) => r.studentId));

    // 4. Clean up legacy pre-seeded demo students unless they have real registrations
    const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    const demoStudentIdSet = new Set(LEGACY_DEMO_STUDENT_IDS);
    const legacyDemoStudentDocs = studentsSnap.docs.filter(
      (d) => demoStudentIdSet.has(d.id) && !regStudentIds.has(d.id)
    );

    for (const demoStuDoc of legacyDemoStudentDocs) {
      await deleteDoc(doc(db, STUDENTS_COLLECTION, demoStuDoc.id));
    }

    const needsStudentSync =
      legacyDemoRegDocs.length > 0 ||
      legacyDemoStudentDocs.length > 0 ||
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem(FIRESTORE_DEMO_RESET_KEY) !== 'done');

    if (needsStudentSync) {
      const remainingStudentDocs = studentsSnap.docs.filter(
        (d) => !demoStudentIdSet.has(d.id) || regStudentIds.has(d.id)
      );
      for (const stuDoc of remainingStudentDocs) {
        const stu = stuDoc.data() as Student;
        const completed = remainingRegs.filter(
          (r) => r.studentId === stu.id && r.attendanceStatus === 'completed'
        );
        const totalHours = completed.reduce((sum, r) => sum + r.hoursAwarded, 0);
        const completedTasksCount = completed.length;
        const badgeLevel = calculateBadgeLevel(totalHours);

        if (
          stu.totalHours !== totalHours ||
          stu.completedTasksCount !== completedTasksCount ||
          stu.badgeLevel !== badgeLevel
        ) {
          await setDoc(doc(db, STUDENTS_COLLECTION, stu.id), {
            ...stu,
            totalHours,
            completedTasksCount,
            badgeLevel,
          });
        }
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FIRESTORE_DEMO_RESET_KEY, 'done');
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'seedInitialFirestoreData');
  }
}

// Real-time Subscriptions
export function subscribeToPrograms(onUpdate: (programs: ActivityProgram[]) => void) {
  const q = query(collection(db, PROGRAMS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ActivityProgram[] = [];
      snapshot.forEach((d) => items.push(d.data() as ActivityProgram));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, PROGRAMS_COLLECTION);
    }
  );
}

export function subscribeToStudents(onUpdate: (students: Student[]) => void) {
  const q = query(collection(db, STUDENTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach((d) => items.push(d.data() as Student));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, STUDENTS_COLLECTION);
    }
  );
}

export function subscribeToTasks(onUpdate: (tasks: VolunteerTask[]) => void) {
  const q = query(collection(db, TASKS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VolunteerTask[] = [];
      snapshot.forEach((d) => items.push(d.data() as VolunteerTask));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, TASKS_COLLECTION);
    }
  );
}

export function subscribeToRegistrations(onUpdate: (regs: VolunteerRegistration[]) => void) {
  const q = query(collection(db, REGISTRATIONS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: VolunteerRegistration[] = [];
      snapshot.forEach((d) => items.push(d.data() as VolunteerRegistration));
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REGISTRATIONS_COLLECTION);
    }
  );
}

// Program (Initiative) mutations
export async function saveProgramToFirestore(program: ActivityProgram) {
  try {
    await setDoc(doc(db, PROGRAMS_COLLECTION, program.id), program);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${PROGRAMS_COLLECTION}/${program.id}`);
  }
}

export async function saveMultipleProgramsToFirestore(programs: ActivityProgram[]) {
  try {
    for (const p of programs) {
      await setDoc(doc(db, PROGRAMS_COLLECTION, p.id), p);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, PROGRAMS_COLLECTION);
  }
}

export async function deleteProgramFromFirestore(programId: string) {
  try {
    await deleteDoc(doc(db, PROGRAMS_COLLECTION, programId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PROGRAMS_COLLECTION}/${programId}`);
  }
}

// Student mutations
export async function saveStudentToFirestore(student: Student) {
  try {
    await setDoc(doc(db, STUDENTS_COLLECTION, student.id), student);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${STUDENTS_COLLECTION}/${student.id}`);
  }
}

export async function saveMultipleStudentsToFirestore(students: Student[]) {
  try {
    for (const s of students) {
      await setDoc(doc(db, STUDENTS_COLLECTION, s.id), s);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, STUDENTS_COLLECTION);
  }
}

export async function deleteStudentFromFirestore(studentId: string) {
  try {
    await deleteDoc(doc(db, STUDENTS_COLLECTION, studentId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STUDENTS_COLLECTION}/${studentId}`);
  }
}

// Task mutations
export async function saveTaskToFirestore(task: VolunteerTask) {
  try {
    await setDoc(doc(db, TASKS_COLLECTION, task.id), task);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TASKS_COLLECTION}/${task.id}`);
  }
}

export async function deleteTaskFromFirestore(taskId: string) {
  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TASKS_COLLECTION}/${taskId}`);
  }
}

// Registration mutations
export async function saveRegistrationToFirestore(reg: VolunteerRegistration) {
  try {
    await setDoc(doc(db, REGISTRATIONS_COLLECTION, reg.id), reg);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${REGISTRATIONS_COLLECTION}/${reg.id}`);
  }
}

export async function deleteRegistrationFromFirestore(regId: string) {
  try {
    await deleteDoc(doc(db, REGISTRATIONS_COLLECTION, regId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${REGISTRATIONS_COLLECTION}/${regId}`);
  }
}
