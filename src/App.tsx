import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { LoginForm } from './components/Auth/LoginForm';
import { StudentLoginModal } from './components/Auth/StudentLoginModal';
import { SupervisorLoginModal } from './components/Auth/SupervisorLoginModal';
import { Navbar } from './components/Navbar';
import { ProgramsExplorer } from './components/Programs/ProgramsExplorer';
import { StudentCertificate } from './components/StudentPortal/StudentCertificate';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard';
import { AttendanceManager } from './components/TeacherPortal/AttendanceManager';
import { NonParticipatingStudents } from './components/TeacherPortal/NonParticipatingStudents';
import { StudentRoster } from './components/TeacherPortal/StudentRoster';
import { TeacherDashboard } from './components/TeacherPortal/TeacherDashboard';
import { ActivityProgram, Student, VolunteerRegistration, VolunteerTask } from './types';
import { exportVolunteerReportExcel } from './utils/excel';
import {
  calculateBadgeLevel,
  getStoredPrograms,
  getStoredRegistrations,
  getStoredStudents,
  getStoredTasks,
  saveStoredPrograms,
  saveStoredRegistrations,
  saveStoredStudents,
  saveStoredTasks,
} from './utils/storage';
import {
  seedInitialFirestoreData,
  subscribeToPrograms,
  subscribeToStudents,
  subscribeToTasks,
  subscribeToRegistrations,
  saveProgramToFirestore,
  saveMultipleProgramsToFirestore,
  deleteProgramFromFirestore,
  saveStudentToFirestore,
  saveMultipleStudentsToFirestore,
  deleteStudentFromFirestore,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  saveRegistrationToFirestore,
  deleteRegistrationFromFirestore,
} from './services/firebaseService';

export default function App() {
  const [programs, setPrograms] = useState<ActivityProgram[]>(getStoredPrograms);
  const [students, setStudents] = useState<Student[]>(getStoredStudents);
  const [tasks, setTasks] = useState<VolunteerTask[]>(getStoredTasks);
  const [registrations, setRegistrations] = useState<VolunteerRegistration[]>(getStoredRegistrations);

  const [currentRole, setCurrentRole] = useState<'student' | 'teacher'>('student');
  const [isSupervisorUnlocked, setIsSupervisorUnlocked] = useState(false);
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [isStudentLoginModalOpen, setIsStudentLoginModalOpen] = useState(false);

  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);

  const [activeTab, setActiveTab] = useState<string>('programs');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    seedInitialFirestoreData();

    const unsubPrograms = subscribeToPrograms((livePrograms) => {
      setPrograms(livePrograms);
    });

    const unsubStudents = subscribeToStudents((liveStudents) => {
      setStudents(liveStudents);
    });

    const unsubTasks = subscribeToTasks((liveTasks) => {
      setTasks(liveTasks);
    });

    const unsubRegs = subscribeToRegistrations((liveRegs) => {
      setRegistrations(liveRegs);
    });

    return () => {
      unsubPrograms();
      unsubStudents();
      unsubTasks();
      unsubRegs();
    };
  }, []);

  // Sync state to localStorage on updates (Offline Cache)
  useEffect(() => {
    saveStoredPrograms(programs);
  }, [programs]);

  useEffect(() => {
    saveStoredStudents(students);
  }, [students]);

  useEffect(() => {
    saveStoredTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveStoredRegistrations(registrations);
  }, [registrations]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Recalculate student hours and badge level whenever registrations change
  const refreshStudentStats = (updatedRegs: VolunteerRegistration[], studentList: Student[]) => {
    return studentList.map((stu) => {
      const studentCompleted = updatedRegs.filter(
        (r) => r.studentId === stu.id && r.attendanceStatus === 'completed'
      );
      const totalHours = studentCompleted.reduce((sum, r) => sum + r.hoursAwarded, 0);
      const completedCount = studentCompleted.length;
      const badgeLevel = calculateBadgeLevel(totalHours);

      return {
        ...stu,
        totalHours,
        completedTasksCount: completedCount,
        badgeLevel,
      };
    });
  };

  // Student Login
  const handleStudentLogin = (student: Student) => {
    setCurrentStudent(student);
    setCurrentRole('student');
    setIsSupervisorUnlocked(false); // Lock supervisor mode when student logs in
    setActiveTab('programs');
    showToast(`مرحباً ${student.name.split(' ')[0]}`);
  };

  // Request supervisor access (with PIN modal: 320320*)
  const handleRequestSupervisorAccess = () => {
    if (isSupervisorUnlocked && currentRole === 'teacher' && !currentStudent) {
      setActiveTab('dashboard');
    } else {
      setIsSupervisorModalOpen(true);
    }
  };

  // Supervisor PIN unlocked
  const handleSupervisorSuccess = () => {
    setIsSupervisorUnlocked(true);
    setIsSupervisorModalOpen(false);
    setCurrentStudent(null); // Clear student session when supervisor logs in
    setCurrentRole('teacher');
    setActiveTab('dashboard');
    showToast('تم التحقق بنجاح والدخول إلى لوحة المشرف');
  };

  // Switch to Student view
  const handleSwitchToStudent = () => {
    setCurrentRole('student');
    setIsSupervisorUnlocked(false); // Relock supervisor mode
    setActiveTab('programs');
  };

  // Logout
  const handleLogout = () => {
    setCurrentRole('student');
    setIsSupervisorUnlocked(false);
    setCurrentStudent(null);
    setActiveTab('programs');
    showToast('تم تسجيل الخروج');
  };

  // Add Program (Initiative)
  const handleAddProgram = (newProgData: Omit<ActivityProgram, 'id'>) => {
    const newProg: ActivityProgram = {
      ...newProgData,
      id: `prog-${Date.now()}`,
    };
    setPrograms([newProg, ...programs]);
    saveProgramToFirestore(newProg);
    showToast(`تمت إضافة مبادرة (${newProg.name}) بنجاح`);
  };

  // Batch Add Programs (from Excel Import)
  const handleBatchAddPrograms = (newPrograms: ActivityProgram[], newTasks: VolunteerTask[] = []) => {
    const nextPrograms = [...newPrograms, ...programs];
    setPrograms(nextPrograms);
    saveMultipleProgramsToFirestore(newPrograms);

    if (newTasks.length > 0) {
      const nextTasks = [...newTasks, ...tasks];
      setTasks(nextTasks);
      for (const t of newTasks) {
        saveTaskToFirestore(t);
      }
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    showToast(`تم استيراد ${newPrograms.length} مبادرة بنجاح من ملف الإكسل`);
  };

  // Update Program (Initiative) and sync its tasks/registrations domain & name
  const handleUpdateProgram = (updatedProg: ActivityProgram) => {
    const nextProgs = programs.map((p) => (p.id === updatedProg.id ? updatedProg : p));
    setPrograms(nextProgs);
    saveProgramToFirestore(updatedProg);

    const tasksToUpdate = tasks.filter(
      (t) =>
        t.programId === updatedProg.id &&
        (t.domain !== updatedProg.domain || t.programName !== updatedProg.name)
    );
    if (tasksToUpdate.length > 0) {
      const nextTasks = tasks.map((t) =>
        t.programId === updatedProg.id
          ? { ...t, domain: updatedProg.domain, programName: updatedProg.name }
          : t
      );
      setTasks(nextTasks);
      tasksToUpdate.forEach((t) =>
        saveTaskToFirestore({ ...t, domain: updatedProg.domain, programName: updatedProg.name })
      );
    }

    const regsToUpdate = registrations.filter(
      (r) => r.programId === updatedProg.id && r.programName !== updatedProg.name
    );
    if (regsToUpdate.length > 0) {
      const nextRegs = registrations.map((r) =>
        r.programId === updatedProg.id ? { ...r, programName: updatedProg.name } : r
      );
      setRegistrations(nextRegs);
      regsToUpdate.forEach((r) =>
        saveRegistrationToFirestore({ ...r, programName: updatedProg.name })
      );
    }

    showToast(`تم حفظ تعديلات مبادرة (${updatedProg.name}) بنجاح`);
  };

  // Delete Program (Initiative) & its sub-tasks (individual only)
  const handleDeleteProgram = (programId: string) => {
    const prog = programs.find((p) => p.id === programId);
    const nextProgs = programs.filter((p) => p.id !== programId);
    setPrograms(nextProgs);
    deleteProgramFromFirestore(programId);

    // Delete associated tasks
    const relatedTasks = tasks.filter((t) => t.programId === programId);
    relatedTasks.forEach((t) => deleteTaskFromFirestore(t.id));
    setTasks(tasks.filter((t) => t.programId !== programId));

    showToast(`تم الحذف النهائي لمبادرة (${prog?.name || ''})`);
  };

  // Add Task
  const handleAddTask = (newTaskData: Omit<VolunteerTask, 'id' | 'checkInCode'>) => {
    const randomCode = `VOL-${Math.floor(100 + Math.random() * 900)}`;
    const createdTask: VolunteerTask = {
      ...newTaskData,
      id: `task-${Date.now()}`,
      checkInCode: randomCode,
    };

    setTasks([createdTask, ...tasks]);
    saveTaskToFirestore(createdTask);
    showToast(`تمت إضافة المهمة التطوعية (${createdTask.title})`);
  };

  // Update Task
  const handleUpdateTask = (updatedTask: VolunteerTask) => {
    const nextTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    setTasks(nextTasks);
    saveTaskToFirestore(updatedTask);
    showToast(`تم حفظ تعديلات المهمة (${updatedTask.title})`);
  };

  // Delete Task
  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const nextTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(nextTasks);
    deleteTaskFromFirestore(taskId);
    showToast(`تم الحذف النهائي لمهمة (${task?.title || ''})`);
  };

  // Confirm registration via modal (Mobile + last 5 digits of ID)
  const handleConfirmRegistration = (student: Student, taskId: string) => {
    setCurrentStudent(student);
    setCurrentRole('student');

    if (!students.some((s) => s.id === student.id)) {
      setStudents((prev) => [...prev, student]);
    }

    let task = tasks.find((t) => t.id === taskId);
    if (!task && taskId.startsWith('task-prog-')) {
      const progId = taskId.replace('task-prog-', '');
      const prog = programs.find((p) => p.id === progId);
      if (prog) {
        task = {
          id: taskId,
          programId: prog.id,
          programName: prog.name,
          domain: prog.domain,
          title: `المشاركة والتطوع في ${prog.name}`,
          description: prog.description,
          stage: prog.stage,
          hours: 2,
          maxVolunteers: 25,
          date: prog.gregorianDate.replace(/\//g, '-'),
          time: '08:00 ص - 10:00 ص',
          location: 'مدرسة ابن الجوزي للموهوبين',
          supervisorName: 'رائد النشاط الطلابي',
          requiredSkills: ['المبادرة', 'التعاون', 'الالتزام'],
          status: 'open',
          checkInCode: `VOL-${Math.floor(100 + Math.random() * 900)}`,
        };
        setTasks((prev) => [task!, ...prev]);
        saveTaskToFirestore(task);
      }
    }
    if (!task) return;

    const exists = registrations.find(
      (r) => r.taskId === taskId && r.studentId === student.id
    );

    if (exists) {
      showToast(`أنت مسجل بالفعل في هذه المهمة (${task.title})`);
      return;
    }

    const newReg: VolunteerRegistration = {
      id: `reg-${Date.now()}`,
      taskId,
      programId: task.programId,
      programName: task.programName,
      studentId: student.id,
      studentName: student.name,
      studentMobile: student.mobile,
      studentStage: student.stage,
      registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      attendanceStatus: 'registered',
      approvalStatus: 'pending',
      hoursAwarded: 0,
      notes: 'طلب انضمام جديد بانتظار موافقة المشرف وتوثيق الساعات.',
    };

    const nextRegs = [newReg, ...registrations];
    setRegistrations(nextRegs);

    // Save student profile and registration to Cloud Firestore
    saveStudentToFirestore(student);
    saveRegistrationToFirestore(newReg);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    showToast(`تم إرسال طلب انضمامك للمبادرة (${task.title}) بنجاح للمشرف`);
  };

  // Check-in by quick code
  const handleCheckInByCode = (code: string) => {
    if (!currentStudent) return { success: false, message: 'يرجى تسجيل الدخول أولاً.' };

    const task = tasks.find(
      (t) => t.checkInCode.trim().toUpperCase() === code.trim().toUpperCase()
    );

    if (!task) {
      return {
        success: false,
        message: 'رمز المهمة غير صحيح أو غير متوفر حالياً.',
      };
    }

    const existingIndex = registrations.findIndex(
      (r) => r.taskId === task.id && r.studentId === currentStudent.id
    );

    let nextRegs: VolunteerRegistration[];
    if (existingIndex >= 0) {
      nextRegs = registrations.map((r, idx) =>
        idx === existingIndex
          ? {
              ...r,
              attendanceStatus: 'attended',
              confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              notes: 'تم تأكيد الحضور فورياً عبر رمز المهمة.',
            }
          : r
      );
    } else {
      const newReg: VolunteerRegistration = {
        id: `reg-${Date.now()}`,
        taskId: task.id,
        studentId: currentStudent.id,
        studentName: currentStudent.name,
        studentStage: currentStudent.stage,
        registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        attendanceStatus: 'attended',
        hoursAwarded: 0,
        confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        notes: 'حضر النشاط وأدخل رمز التحضير الفوري.',
      };
      nextRegs = [newReg, ...registrations];
    }

    setRegistrations(nextRegs);
    if (existingIndex >= 0) {
      saveRegistrationToFirestore(nextRegs[existingIndex]);
    } else {
      saveRegistrationToFirestore(nextRegs[0]);
    }

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    return {
      success: true,
      message: `تم تسجيل حضورك في: ${task.title}`,
    };
  };

  // Update registration (Teacher)
  const handleUpdateRegistration = (
    registrationId: string,
    updates: Partial<VolunteerRegistration>
  ) => {
    const nextRegs = registrations.map((r) =>
      r.id === registrationId ? { ...r, ...updates } : r
    );
    setRegistrations(nextRegs);

    const updatedReg = nextRegs.find((r) => r.id === registrationId);
    if (updatedReg) saveRegistrationToFirestore(updatedReg);

    const updatedStudents = refreshStudentStats(nextRegs, students);
    setStudents(updatedStudents);

    if (updatedReg && updates.attendanceStatus === 'completed') {
      const stu = updatedStudents.find((s) => s.id === updatedReg.studentId);
      if (stu) saveStudentToFirestore(stu);
    }

    if (currentStudent) {
      const refreshed = updatedStudents.find((s) => s.id === currentStudent.id);
      if (refreshed) setCurrentStudent(refreshed);
    }

    if (updates.attendanceStatus === 'completed') {
      try {
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.7 },
        });
      } catch (e) {}
      showToast('تم توثيق واعتماد الساعات التطوعية');
    }
  };

  // Bulk mark attendance (Teacher)
  const handleBulkMarkAttendance = (taskId: string, status: 'attended' | 'completed') => {
    const task = tasks.find((t) => t.id === taskId);
    const awarded = task ? task.hours : 2;

    const nextRegs = registrations.map((r) => {
      if (r.taskId === taskId) {
        return {
          ...r,
          attendanceStatus: status,
          hoursAwarded: status === 'completed' ? (r.hoursAwarded || awarded) : r.hoursAwarded,
          confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          confirmedBy: task?.supervisorName || 'رائد النشاط الطلابي',
          notes: status === 'completed' ? 'تم اعتماد وتوثيق الساعات لجميع الحاضرين.' : r.notes,
        };
      }
      return r;
    });

    setRegistrations(nextRegs);
    const updatedStudents = refreshStudentStats(nextRegs, students);
    setStudents(updatedStudents);

    // Sync all modified registrations to Firestore
    nextRegs.filter((r) => r.taskId === taskId).forEach((r) => saveRegistrationToFirestore(r));
    if (status === 'completed') {
      saveMultipleStudentsToFirestore(updatedStudents);
    }

    if (currentStudent) {
      const refreshed = updatedStudents.find((s) => s.id === currentStudent.id);
      if (refreshed) setCurrentStudent(refreshed);
    }

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    showToast(
      status === 'completed'
        ? 'تم توثيق الساعات لجميع طلاب هذا النشاط'
        : 'تم تسجيل حضور الطلاب'
    );
  };

  // Add student to task manually (Teacher)
  const handleAddStudentToTask = (taskId: string, studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const task = tasks.find((t) => t.id === taskId);
    if (!student || !task) return;

    const newReg: VolunteerRegistration = {
      id: `reg-${Date.now()}`,
      taskId,
      programId: task.programId,
      programName: task.programName,
      studentId: student.id,
      studentName: student.name,
      studentMobile: student.mobile,
      studentStage: student.stage,
      registeredAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      attendanceStatus: 'attended',
      approvalStatus: 'approved',
      hoursAwarded: task.hours,
      confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      confirmedBy: task.supervisorName,
      notes: 'تمت إضافة الطالب يدوياً من كشف المعلم.',
    };

    const nextRegs = [newReg, ...registrations];
    setRegistrations(nextRegs);
    saveRegistrationToFirestore(newReg);
    showToast(`تمت إضافة (${student.name}) إلى كشف المهمة`);
  };

  // Approve join request (Teacher)
  const handleApproveRegistration = (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    const nextRegs = registrations.map((r) => {
      if (r.id === registrationId) {
        return {
          ...r,
          approvalStatus: 'approved' as const,
          attendanceStatus: (r.attendanceStatus === 'registered' ? 'attended' : r.attendanceStatus) as any,
          notes: 'تمت موافقة المشرف على طلب الانضمام.',
        };
      }
      return r;
    });
    setRegistrations(nextRegs);
    const updated = nextRegs.find((r) => r.id === registrationId);
    if (updated) saveRegistrationToFirestore(updated);
    showToast(`تمت الموافقة على انضمام الطالب (${reg?.studentName || ''}) للمبادرة بنجاح`);
  };

  // Certify volunteer hours after completion and verifying participation (Teacher)
  const handleCertifyHours = (registrationId: string, hours?: number) => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return;
    const task = tasks.find((t) => t.id === reg.taskId);
    const awardedHours = hours !== undefined ? hours : (task ? task.hours : 2);

    const nextRegs = registrations.map((r) => {
      if (r.id === registrationId) {
        return {
          ...r,
          approvalStatus: 'approved' as const,
          attendanceStatus: 'completed' as const,
          hoursAwarded: awardedHours,
          confirmedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          confirmedBy: task?.supervisorName || 'رائد النشاط الطلابي',
          notes: 'تم التأكد من المشاركة الفعلية واعتماد وتوثيق الساعات بنجاح.',
        };
      }
      return r;
    });

    setRegistrations(nextRegs);
    const updatedStudents = refreshStudentStats(nextRegs, students);
    setStudents(updatedStudents);

    // Save updated registration and student with confirmed hours to Firestore
    const updatedReg = nextRegs.find((r) => r.id === registrationId);
    if (updatedReg) saveRegistrationToFirestore(updatedReg);
    const updatedStudent = updatedStudents.find((s) => s.id === reg.studentId);
    if (updatedStudent) saveStudentToFirestore(updatedStudent);

    if (currentStudent && currentStudent.id === reg.studentId) {
      const refreshed = updatedStudents.find((s) => s.id === currentStudent.id);
      if (refreshed) setCurrentStudent(refreshed);
    }

    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    showToast(`تم اعتماد وتوثيق (${awardedHours}) ساعات للطالب (${reg.studentName}) بعد التأكد من مشاركته`);
  };

  // Reject join request (Teacher)
  const handleRejectRegistration = (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    const nextRegs = registrations.map((r) => {
      if (r.id === registrationId) {
        return {
          ...r,
          approvalStatus: 'rejected' as const,
          attendanceStatus: 'absent' as const,
          notes: 'تم الاعتذار عن قبول الطلب.',
        };
      }
      return r;
    });
    setRegistrations(nextRegs);
    const updated = nextRegs.find((r) => r.id === registrationId);
    if (updated) saveRegistrationToFirestore(updated);
    showToast(`تم رفض طلب الانضمام للطالب (${reg?.studentName || ''})`);
  };

  // Uncertify / Revoke Hours (Teacher) - عدم الاعتماد
  const handleUncertifyHours = (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return;

    const nextRegs = registrations.map((r) => {
      if (r.id === registrationId) {
        return {
          ...r,
          attendanceStatus: 'attended' as const,
          hoursAwarded: 0,
          confirmedAt: undefined,
          notes: 'تم إلغاء اعتماد الساعات من قبل المشرف.',
        };
      }
      return r;
    });

    setRegistrations(nextRegs);
    const updated = nextRegs.find((r) => r.id === registrationId);
    if (updated) saveRegistrationToFirestore(updated);

    const updatedStudents = refreshStudentStats(nextRegs, students);
    setStudents(updatedStudents);
    const updatedStudent = updatedStudents.find((s) => s.id === reg.studentId);
    if (updatedStudent) saveStudentToFirestore(updatedStudent);

    if (currentStudent && currentStudent.id === reg.studentId) {
      const refreshed = updatedStudents.find((s) => s.id === currentStudent.id);
      if (refreshed) setCurrentStudent(refreshed);
    }

    showToast(`تم إلغاء اعتماد الساعات للطالب (${reg.studentName}) بنجاح`);
  };

  // Delete registration (Teacher) - حذف الطالب من المبادرة
  const handleDeleteRegistration = (registrationId: string) => {
    const reg = registrations.find((r) => r.id === registrationId);
    if (!reg) return;

    const nextRegs = registrations.filter((r) => r.id !== registrationId);
    setRegistrations(nextRegs);
    deleteRegistrationFromFirestore(registrationId);

    const updatedStudents = refreshStudentStats(nextRegs, students);
    setStudents(updatedStudents);
    const updatedStudent = updatedStudents.find((s) => s.id === reg.studentId);
    if (updatedStudent) saveStudentToFirestore(updatedStudent);

    if (currentStudent && currentStudent.id === reg.studentId) {
      const refreshed = updatedStudents.find((s) => s.id === currentStudent.id);
      if (refreshed) setCurrentStudent(refreshed);
    }

    showToast(`تم حذف الطالب (${reg.studentName}) من المبادرة بنجاح`);
  };

  // Student Rating (1 to 5 stars)
  const handleRateRegistration = (registrationId: string, rating: number) => {
    const nextRegs = registrations.map((r) => {
      if (r.id === registrationId) {
        return {
          ...r,
          rating,
        };
      }
      return r;
    });
    setRegistrations(nextRegs);
    const updated = nextRegs.find((r) => r.id === registrationId);
    if (updated) saveRegistrationToFirestore(updated);
    showToast(`شكراً لك! تم حفظ تقييمك (${rating} نجوم) لهذه المبادرة.`);
  };

  // Add imported or manual students
  const handleAddStudents = (newStudents: Student[]) => {
    const existingIds = new Set(students.map((s) => s.id));
    const toAdd = newStudents.filter((s) => !existingIds.has(s.id));
    const merged = [...students, ...toAdd];
    setStudents(merged);
    saveMultipleStudentsToFirestore(toAdd);
    showToast(`تم استيراد ${toAdd.length} طالب بنجاح`);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    const filtered = students.filter((s) => s.id !== studentId);
    setStudents(filtered);
    deleteStudentFromFirestore(studentId);
    showToast(`تم حذف الطالب (${stu?.name || ''}) بنجاح`);
  };

  // Assign one or more non-participating students to an existing program/task
  const handleAssignStudentsToInitiative = (
    studentIds: string[],
    programId: string,
    explicitTaskId?: string
  ) => {
    const prog = programs.find((p) => p.id === programId);
    if (!prog) return;

    let targetTask =
      (explicitTaskId ? tasks.find((t) => t.id === explicitTaskId) : undefined) ||
      tasks.find((t) => t.programId === programId && t.status !== 'cancelled');

    if (!targetTask) {
      targetTask = {
        id: `task-prog-${prog.id}`,
        programId: prog.id,
        programName: prog.name,
        domain: prog.domain,
        title: `المشاركة والتطوع في ${prog.name}`,
        description: prog.description,
        requiredSkills: ['المبادرة', 'التعاون', 'الالتزام'],
        stage: prog.stage,
        hours: 2,
        maxVolunteers: 25,
        date: prog.gregorianDate.replace(/\//g, '-'),
        time: '08:00 ص - 10:00 ص',
        location: prog.organizer || 'مدرسة ابن الجوزي للموهوبين',
        supervisorName: 'رائد النشاط الطلابي',
        status: 'open',
        checkInCode: `VOL-${Math.floor(100 + Math.random() * 900)}`,
      };
      setTasks((prev) => [targetTask!, ...prev]);
      saveTaskToFirestore(targetTask);
    }

    const nowTs = Date.now();
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const createdRegs: VolunteerRegistration[] = [];

    studentIds.forEach((studentId, index) => {
      const stu = students.find((s) => s.id === studentId);
      if (!stu) return;
      const alreadyExists = registrations.some(
        (r) => r.taskId === targetTask!.id && r.studentId === studentId
      );
      if (alreadyExists) return;

      const reg: VolunteerRegistration = {
        id: `reg-${nowTs}-${index}`,
        taskId: targetTask!.id,
        programId: prog.id,
        programName: prog.name,
        studentId: stu.id,
        studentName: stu.name,
        studentMobile: stu.mobile,
        studentStage: stu.stage,
        registeredAt: nowStr,
        attendanceStatus: 'registered',
        approvalStatus: 'approved',
        hoursAwarded: 0,
        notes: 'تم ترشيح وإسناد المبادرة للطالب من قسم متابعة غير المشاركين.',
      };
      createdRegs.push(reg);
      saveRegistrationToFirestore(reg);
    });

    if (createdRegs.length === 0) {
      showToast('الطلاب المحددون مسجلون بالفعل في هذه المبادرة');
      return;
    }

    setRegistrations((prev) => [...createdRegs, ...prev]);
    showToast(
      createdRegs.length === 1
        ? `تم إسناد (${createdRegs[0].studentName}) إلى مبادرة (${prog.name})`
        : `تم ترشيح وإسناد ${createdRegs.length} طلاب إلى مبادرة (${prog.name})`
    );
  };

  // Create a targeted initiative + task for non-participating students and optionally enroll selected students
  const handleCreateTargetedInitiative = (
    programData: Omit<ActivityProgram, 'id'>,
    taskData: Omit<VolunteerTask, 'id' | 'programId' | 'programName' | 'domain' | 'checkInCode'>,
    studentIdsToEnroll: string[]
  ) => {
    const nowTs = Date.now();
    const newProg: ActivityProgram = {
      ...programData,
      id: `prog-${nowTs}`,
    };

    const newTask: VolunteerTask = {
      ...taskData,
      id: `task-${nowTs}`,
      programId: newProg.id,
      programName: newProg.name,
      domain: newProg.domain,
      checkInCode: `VOL-${Math.floor(100 + Math.random() * 900)}`,
    };

    setPrograms((prev) => [newProg, ...prev]);
    setTasks((prev) => [newTask, ...prev]);
    saveProgramToFirestore(newProg);
    saveTaskToFirestore(newTask);

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const createdRegs: VolunteerRegistration[] = [];

    studentIdsToEnroll.forEach((studentId, index) => {
      const stu = students.find((s) => s.id === studentId);
      if (!stu) return;
      const reg: VolunteerRegistration = {
        id: `reg-${nowTs}-${index}`,
        taskId: newTask.id,
        programId: newProg.id,
        programName: newProg.name,
        studentId: stu.id,
        studentName: stu.name,
        studentMobile: stu.mobile,
        studentStage: stu.stage,
        registeredAt: nowStr,
        attendanceStatus: 'registered',
        approvalStatus: 'approved',
        hoursAwarded: 0,
        notes: 'مبادرة مخصصة لدمج الطلاب غير المشاركين.',
      };
      createdRegs.push(reg);
      saveRegistrationToFirestore(reg);
    });

    if (createdRegs.length > 0) {
      setRegistrations((prev) => [...createdRegs, ...prev]);
    }

    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    showToast(
      createdRegs.length > 0
        ? `تم إنشاء مبادرة (${newProg.name}) وإسنادها لـ ${createdRegs.length} طلاب بنجاح`
        : `تم إنشاء مبادرة (${newProg.name}) بنجاح للطلاب غير المشاركين`
    );
  };

  // Export full Excel report
  const handleExportExcel = () => {
    exportVolunteerReportExcel(tasks, registrations, students, programs);
    showToast('تم تنزيل تقرير التطوع (Excel)');
  };

  const pendingRequestsCount = registrations.filter(
    (r) => r.approvalStatus === 'pending' || r.attendanceStatus === 'registered'
  ).length;

  const nonParticipatingCount = students.filter((stu) => {
    const stuRegs = registrations.filter((r) => r.studentId === stu.id);
    const hasActive =
      stu.totalHours > 0 ||
      stuRegs.some(
        (r) => r.attendanceStatus === 'completed' || r.attendanceStatus === 'attended'
      );
    return !hasActive;
  }).length;

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans text-[#1d1d1f] antialiased">
      {/* Toast Notification - Apple style */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f]/90 backdrop-blur-md text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-lg border border-white/10 flex items-center gap-2 max-w-sm text-center animate-in fade-in slide-in-from-bottom-2 print:hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation: تسجيل دخول للطلاب أو لوحة المشرف */}
      <Navbar
        currentRole={currentRole}
        currentStudent={currentStudent}
        activeTab={activeTab}
        pendingRequestsCount={pendingRequestsCount}
        nonParticipatingCount={nonParticipatingCount}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        onRequestSupervisorAccess={handleRequestSupervisorAccess}
        onRequestStudentLogin={() => setIsStudentLoginModalOpen(true)}
        onSwitchToStudent={handleSwitchToStudent}
      />

      {/* Main Content Area: Responsive container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-6">
        {/* FIRST PAGE: Initiatives Explorer */}
        {activeTab === 'programs' && (
          <ProgramsExplorer
            programs={programs}
            tasks={tasks}
            registrations={registrations}
            students={students}
            currentStudent={currentStudent}
            isSupervisor={isSupervisorUnlocked && currentRole === 'teacher' && !currentStudent}
            onAddProgram={handleAddProgram}
            onBatchAddPrograms={handleBatchAddPrograms}
            onUpdateProgram={handleUpdateProgram}
            onDeleteProgram={handleDeleteProgram}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onConfirmRegistration={handleConfirmRegistration}
            onApproveRegistration={handleApproveRegistration}
            onCertifyHours={handleCertifyHours}
            onOpenCertificate={() => setActiveTab('certificate')}
            onOpenMyTasks={() => setActiveTab('my-tasks')}
            onRequestSupervisorAccess={handleRequestSupervisorAccess}
            onRequestStudentLogin={() => setIsStudentLoginModalOpen(true)}
          />
        )}

        {/* Student View: My Registered Tasks & Hours Log */}
        {activeTab === 'my-tasks' && currentStudent && (
          <StudentDashboard
            student={currentStudent}
            tasks={tasks}
            registrations={registrations}
            onCheckInByCode={handleCheckInByCode}
            onViewCertificate={() => setActiveTab('certificate')}
            onExploreTasks={() => setActiveTab('programs')}
            onRateRegistration={handleRateRegistration}
          />
        )}

        {/* Student View: Official Certificate */}
        {activeTab === 'certificate' && currentStudent && (
          <StudentCertificate
            student={currentStudent}
            tasks={tasks}
            registrations={registrations}
            onBack={() => setActiveTab('programs')}
          />
        )}

        {/* Teacher Views (Protected by Supervisor Passcode 320320*) */}
        {activeTab === 'dashboard' && (
          <TeacherDashboard
            programs={programs}
            students={students}
            tasks={tasks}
            registrations={registrations}
            onNavigate={(tab) => setActiveTab(tab)}
            onExportExcel={handleExportExcel}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceManager
            programs={programs}
            tasks={tasks}
            students={students}
            registrations={registrations}
            onApproveRegistration={handleApproveRegistration}
            onCertifyHours={handleCertifyHours}
            onRejectRegistration={handleRejectRegistration}
            onUpdateRegistration={handleUpdateRegistration}
            onBulkMarkAttendance={handleBulkMarkAttendance}
            onAddStudentToTask={handleAddStudentToTask}
            onUncertifyHours={handleUncertifyHours}
            onDeleteRegistration={handleDeleteRegistration}
          />
        )}

        {activeTab === 'students' && (
          <StudentRoster
            students={students}
            onAddStudents={handleAddStudents}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'non-participating' && (
          <NonParticipatingStudents
            students={students}
            programs={programs}
            tasks={tasks}
            registrations={registrations}
            onAssignStudentsToInitiative={handleAssignStudentsToInitiative}
            onCreateTargetedInitiative={handleCreateTargetedInitiative}
            onNavigate={(tab) => setActiveTab(tab)}
            onNotify={showToast}
          />
        )}
      </main>

      {/* Supervisor Login Modal (Passcode 320320*) */}
      <SupervisorLoginModal
        isOpen={isSupervisorModalOpen}
        onClose={() => setIsSupervisorModalOpen(false)}
        onSuccess={handleSupervisorSuccess}
      />

      {/* Student Login Modal (Mobile + last 5 digits of ID) */}
      <StudentLoginModal
        isOpen={isStudentLoginModalOpen}
        onClose={() => setIsStudentLoginModalOpen(false)}
        students={students}
        onLoginSuccess={handleStudentLogin}
      />

      {/* Footer */}
      <footer className="border-t border-black/[0.06] py-6 mt-8 sm:mt-12 print:hidden text-[12px] text-[#86868b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <div>
            <span>منصة مُبادر للتطوع المدرسي</span>
            <span className="mx-2">·</span>
            <span>الهيئة الملكية بينبع</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleRequestSupervisorAccess}
              className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
            >
              لوحة المشرف
            </button>
            <span>·</span>
            <span>الخطة المركزية 2026-2027</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
