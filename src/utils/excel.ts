import * as XLSX from 'xlsx';
import { ActivityDomain, ActivityProgram, GradeStage, Student, VolunteerRegistration, VolunteerTask } from '../types';
import { ACTIVITY_DOMAINS } from '../data/yanbuPlanData';
import {
  resolveActivityDomainMeta,
  resolveProgramDomainId,
  resolveRegistrationDomainId,
  resolveTaskDomainId,
} from './programHelpers';

export interface ParseResult {
  success: boolean;
  importedStudents: Student[];
  errors: string[];
  totalRows: number;
}

export interface ProgramParseResult {
  success: boolean;
  importedPrograms: ActivityProgram[];
  importedTasks: VolunteerTask[];
  errors: string[];
  totalRows: number;
}

// Download Excel template for importing students (Mobile, Name, Stage, Grade, Class)
export function downloadStudentTemplate() {
  const headers = [
    'اسم الطالب',
    'رقم الجوال',
    'المرحلة الدراسية',
    'الصف الدراسي',
    'الفصل',
    'اسم المدرسة',
  ];

  const sampleRows = [
    [
      'فيصل عبدالرحمن العتيبي',
      '0551234567',
      'ابتدائي',
      'الصف الخامس الابتدائي',
      '5/1',
      'مدرسة ابن الجوزي للموهوبين',
    ],
    [
      'ريان ماجد الغامدي',
      '0567891234',
      'متوسط',
      'الصف الثاني متوسط',
      '2/3',
      'مدرسة ابن الجوزي للموهوبين',
    ],
    [
      'سعود فهد الرفاعي',
      '0502345678',
      'ابتدائي',
      'الصف السادس الابتدائي',
      '6/2',
      'مدرسة ابن الجوزي للموهوبين',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Adjust column widths
  ws['!cols'] = [
    { wch: 28 }, // اسم الطالب
    { wch: 18 }, // رقم الجوال
    { wch: 16 }, // المرحلة الدراسية
    { wch: 22 }, // الصف الدراسي
    { wch: 10 }, // الفصل
    { wch: 32 }, // اسم المدرسة
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب استيراد الطلاب');

  XLSX.writeFile(wb, 'نموذج_استيراد_الطلاب_مدرسة_ابن_الجوزي.xlsx');
}

// Parse uploaded Excel / CSV file
export async function parseStudentsExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to array of objects
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            importedStudents: [],
            errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات.'],
            totalRows: 0,
          });
          return;
        }

        const importedStudents: Student[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2; // header is row 1

          const name = String(
            row['اسم الطالب'] ||
            row['الاسم'] ||
            row['اسم الطالب الثلاثي'] ||
            row['اسم الطالب الرباعي'] ||
            row['name'] ||
            row['studentName'] ||
            ''
          ).trim();

          const rawMobile = String(
            row['رقم الجوال'] ||
            row['الجوال'] ||
            row['الهاتف'] ||
            row['رقم الهاتف'] ||
            row['mobile'] ||
            row['phone'] ||
            ''
          ).trim();

          const rawStage = String(
            row['المرحلة الدراسية'] ||
            row['المرحلة'] ||
            row['stage'] ||
            ''
          ).trim().toLowerCase();

          const grade = String(
            row['الصف الدراسي'] ||
            row['الصف'] ||
            row['grade'] ||
            'صف غير محدد'
          ).trim();

          const classroom = String(
            row['الفصل'] ||
            row['classroom'] ||
            '1'
          ).trim();

          const schoolName = String(
            row['اسم المدرسة'] ||
            row['المدرسة'] ||
            row['school'] ||
            'مدرسة ابن الجوزي للموهوبين'
          ).trim();

          if (!name) {
            errors.push(`الصف ${rowNum}: اسم الطالب مطلوب.`);
            return;
          }

          if (!rawMobile) {
            errors.push(`الصف ${rowNum}: رقم الجوال مطلوب للطالب (${name}).`);
            return;
          }

          const cleanMobile = rawMobile.replace(/[\s-]/g, '');
          const mobile = cleanMobile.startsWith('0') ? cleanMobile : `0${cleanMobile}`;

          let stage: GradeStage = 'primary';
          if (rawStage.includes('متوسط') || rawStage.includes('intermediate') || grade.includes('متوسط')) {
            stage = 'intermediate';
          } else {
            stage = 'primary';
          }

          const student: Student = {
            id: mobile,
            name,
            mobile,
            stage,
            grade,
            classroom,
            schoolName,
            totalHours: 0,
            completedTasksCount: 0,
            registeredDate: new Date().toISOString().split('T')[0],
            badgeLevel: 'متطوع جديد',
          };

          importedStudents.push(student);
        });

        resolve({
          success: importedStudents.length > 0,
          importedStudents,
          errors,
          totalRows: rawJson.length,
        });
      } catch (err: any) {
        resolve({
          success: false,
          importedStudents: [],
          errors: [`فشل في قراءة الملف: ${err?.message || 'تنسيق الملف غير صالح'}`],
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        importedStudents: [],
        errors: ['حدث خطأ أثناء تحميل الملف من جهازك.'],
        totalRows: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

// Export comprehensive volunteer report to Excel
export function exportVolunteerReportExcel(
  tasks: VolunteerTask[],
  registrations: VolunteerRegistration[],
  students: Student[],
  programs: ActivityProgram[] = []
) {
  // 1. Sheet: Hours & Attendance Records
  const recordsData = registrations.map((reg, index) => {
    const task = tasks.find((t) => t.id === reg.taskId);
    const parentProgram = programs.find((p) => p.id === (reg.programId || task?.programId));
    const domainId = resolveRegistrationDomainId(reg, tasks, programs);
    const domainMeta = domainId
      ? ACTIVITY_DOMAINS.find((d) => d.id === domainId)
      : parentProgram
      ? resolveActivityDomainMeta(parentProgram.domain, parentProgram.domainName)
      : task
      ? resolveActivityDomainMeta(task.domain)
      : null;
    const student = students.find((s) => s.id === reg.studentId || s.mobile === reg.studentMobile);

    return {
      'م': index + 1,
      'اسم الطالب': reg.studentName,
      'رقم الجوال': reg.studentMobile || student?.mobile || '-',
      'المرحلة الدراسية': reg.studentStage === 'primary' ? 'ابتدائي' : 'متوسط',
      'الصف والفصل': student ? `${student.grade} - ${student.classroom}` : '-',
      'المدرسة': student?.schoolName || 'مدرسة ابن الجوزي للموهوبين',
      'اسم النشاط / المبادرة': parentProgram?.name || reg.programName || task?.programName || 'مبادرة مدرسية',
      'التصنيف (المجال)': domainMeta?.name || '-',
      'المهمة التطوعية': task?.title || 'مهمة تطوعية',
      'تاريخ النشاط': task?.date || parentProgram?.gregorianDate || '-',
      'الساعات المعتمدة': reg.hoursAwarded,
      'حالة الانضمام والاعتماد':
        reg.attendanceStatus === 'completed'
          ? 'تم الإنجاز واعتماد الساعات'
          : reg.approvalStatus === 'approved' || reg.attendanceStatus === 'attended'
          ? 'تم قبول الانضمام'
          : 'طلب انضمام بانتظار الموافقة',
      'تاريخ التوثيق': reg.confirmedAt || '-',
      'المشرف المعتمد': reg.confirmedBy || '-',
      'ملاحظات': reg.notes || '',
    };
  });

  // 2. Sheet: Students Summary & Badges
  const studentsData = students.map((s, index) => ({
    'م': index + 1,
    'اسم الطالب': s.name,
    'رقم الجوال': s.mobile,
    'المرحلة': s.stage === 'primary' ? 'ابتدائي' : 'متوسط',
    'الصف الدراسي': s.grade,
    'الفصل': s.classroom,
    'المدرسة': s.schoolName,
    'إجمالي الساعات المعتمدة': s.totalHours,
    'عدد المهام المنجزة': s.completedTasksCount,
    'وسام التطوع': s.badgeLevel,
    'تاريخ الانضمام': s.registeredDate,
  }));

  // 3. Sheet: Tasks Summary
  const tasksData = tasks.map((t, index) => {
    const taskRegs = registrations.filter((r) => r.taskId === t.id);
    const completedRegs = taskRegs.filter((r) => r.attendanceStatus === 'completed');
    const taskDomainId = resolveTaskDomainId(t, programs);
    const taskDomainMeta = ACTIVITY_DOMAINS.find((d) => d.id === taskDomainId);

    return {
      'م': index + 1,
      'اسم المبادرة / البرنامج': t.programName,
      'التصنيف (المجال)': taskDomainMeta?.name || '-',
      'عنوان المهمة التطوعية': t.title,
      'المرحلة المستهدفة':
        t.stage === 'all' ? 'جميع المراحل' : t.stage === 'primary' ? 'ابتدائي' : 'متوسط',
      'عدد الساعات': t.hours,
      'الحد الأقصى للمتطوعين': t.maxVolunteers,
      'عدد الطلاب المتقدمين': taskRegs.length,
      'عدد الساعات الموثقة المكتسبة': completedRegs.reduce((sum, r) => sum + r.hoursAwarded, 0),
      'تاريخ النشاط': t.date,
      'وقت النشاط': t.time,
      'مقر النشاط': t.location,
      'المشرف المسؤول': t.supervisorName,
      'حالة المهمة': t.status === 'completed' ? 'مكتملة' : 'متاحة',
    };
  });

  // 4. Sheet: 8 Domains Summary
  const domainsData = ACTIVITY_DOMAINS.map((domain, index) => {
    const domainPrograms = programs.filter((p) => resolveProgramDomainId(p) === domain.id);
    const domainTasks = tasks.filter((t) => resolveTaskDomainId(t, programs) === domain.id);
    const domainRegs = registrations.filter(
      (r) =>
        r.attendanceStatus === 'completed' &&
        resolveRegistrationDomainId(r, tasks, programs) === domain.id
    );
    const hours = domainRegs.reduce((sum, r) => sum + r.hoursAwarded, 0);

    return {
      'م': index + 1,
      'مجال النشاط (التصنيف)': domain.name,
      'عدد المبادرات': domainPrograms.length,
      'عدد المهام': domainTasks.length,
      'عدد المشاركات المعتمدة': domainRegs.length,
      'إجمالي الساعات المعتمدة': hours,
    };
  });

  const wb = XLSX.utils.book_new();

  // Create worksheets
  const wsRecords = XLSX.utils.json_to_sheet(recordsData);
  const wsStudents = XLSX.utils.json_to_sheet(studentsData);
  const wsTasks = XLSX.utils.json_to_sheet(tasksData);
  const wsDomains = XLSX.utils.json_to_sheet(domainsData);

  // Set RTL direction
  wsRecords['!views'] = [{ rightToLeft: true }];
  wsStudents['!views'] = [{ rightToLeft: true }];
  wsTasks['!views'] = [{ rightToLeft: true }];
  wsDomains['!views'] = [{ rightToLeft: true }];

  // Append sheets
  XLSX.utils.book_append_sheet(wb, wsRecords, 'سجل الساعات والحضور');
  XLSX.utils.book_append_sheet(wb, wsStudents, 'بيانات الطلاب والأوسمة');
  XLSX.utils.book_append_sheet(wb, wsTasks, 'المهام والمبادرات');
  XLSX.utils.book_append_sheet(wb, wsDomains, 'إحصائية المجالات الثمانية');

  // Download file
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `تقرير_التطوع_المدرسي_ابن_الجوزي_${dateStr}.xlsx`);
}

// ==========================================
// INITIATIVES (PROGRAMS) EXCEL IMPORT
// ==========================================

// Helper to parse dates from Excel
function formatExcelDate(val: any): { gregorian: string; month: string } {
  if (!val) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    return { gregorian: today, month: 'نوفمبر' };
  }

  let d: Date | null = null;
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    d = new Date(Math.round((val - 25569) * 86400 * 1000));
  } else if (val instanceof Date) {
    d = val;
  } else if (typeof val === 'string') {
    const clean = val.replace(/[٠-٩]/g, (x: string) => '٠١٢٣٤٥٦٧٨٩'.indexOf(x).toString()).trim();
    const parts = clean.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
      }
    } else {
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime())) d = parsed;
    }
  }

  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  if (d && !isNaN(d.getTime())) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return {
      gregorian: `${yyyy}/${mm}/${dd}`,
      month: monthNames[d.getMonth()] || 'نوفمبر',
    };
  }

  return { gregorian: String(val).trim(), month: 'نوفمبر' };
}

// Map Arabic text strictly to one of the 8 approved domains
function matchActivityDomain(rawDomain: string): { domain: ActivityDomain; domainName: string } {
  const meta = resolveActivityDomainMeta(undefined, rawDomain);
  return { domain: meta.id, domainName: meta.name };
}

// Download Excel template for importing initiatives
export function downloadProgramTemplate() {
  const headers = [
    'اسم المبادرة',
    'مجال النشاط',
    'المرحلة المستهدفة',
    'التاريخ الميلادي',
    'الشهر أو الفترة',
    'الجهة المنظمة',
    'وصف المبادرة',
    'حالة المبادرة',
    'عنوان المهمة التطوعية',
    'عدد الساعات التطوعية',
  ];

  const sampleRows = [
    [
      'مبادرة غرس الأشجار والعناية بالبيئة المدرسية',
      'النشاط الكشفي',
      'جميع المراحل',
      '2026/11/15',
      'نوفمبر',
      'مدرسة ابن الجوزي للموهوبين',
      'مبادرة بيئية كشفية لغرس الشتلات والعناية بالمساحات الخضراء والحديقة المدرسية.',
      'جاري تنفيذها',
      'غرس الشتلات وسقاية الأشجار وتنظيم الحديقة',
      '2',
    ],
    [
      'معرض الابتكار والروبوت والذكاء الاصطناعي',
      'العلوم والتقنية',
      'المرحلة المتوسطة',
      '2026/12/05',
      'ديسمبر',
      'قسم الشؤون التعليمية',
      'ورش عمل وتحديات برمجية وهندسية وتصميم وبرمجة الروبوتات.',
      'قادمة',
      'تنظيم منصات المعرض ومساندة لجان التحكيم',
      '3',
    ],
    [
      'حملة التوعية بالغذاء الصحي ونظافة الأسنان',
      'الصحة والرياضة',
      'المرحلة الابتدائية',
      '2026/10/20',
      'أكتوبر',
      'مدرسة ابن الجوزي للموهوبين',
      'توزيع وجبات الإفطار الصحي وتوعية الطلاب بأهمية الغذاء المتوازن.',
      'منتهية',
      'توزيع الوجبات الصحية وتنظيم الطابور الصباحي',
      '2',
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  ws['!cols'] = [
    { wch: 38 }, // اسم المبادرة
    { wch: 22 }, // مجال النشاط
    { wch: 18 }, // المرحلة المستهدفة
    { wch: 16 }, // التاريخ الميلادي
    { wch: 14 }, // الشهر أو الفترة
    { wch: 28 }, // الجهة المنظمة
    { wch: 45 }, // وصف المبادرة
    { wch: 16 }, // حالة المبادرة
    { wch: 34 }, // عنوان المهمة
    { wch: 16 }, // عدد الساعات
  ];

  ws['!views'] = [{ rightToLeft: true }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'قالب استيراد المبادرات');

  const domainsRef = ACTIVITY_DOMAINS.map((d, idx) => ({
    'م': idx + 1,
    'التصنيف المعتمد (مجال النشاط)': d.name,
  }));
  const wsDomainsRef = XLSX.utils.json_to_sheet(domainsRef);
  wsDomainsRef['!cols'] = [{ wch: 6 }, { wch: 32 }];
  wsDomainsRef['!views'] = [{ rightToLeft: true }];
  XLSX.utils.book_append_sheet(wb, wsDomainsRef, 'المجالات الثمانية المعتمدة');

  XLSX.writeFile(wb, 'نموذج_استيراد_المبادرات_المدرسية.xlsx');
}

// Parse uploaded Excel / CSV for initiatives
export async function parseProgramsExcel(file: File): Promise<ProgramParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            importedPrograms: [],
            importedTasks: [],
            errors: ['الملف فارغ أو لا يحتوي على صفوف بيانات صالحة.'],
            totalRows: 0,
          });
          return;
        }

        const importedPrograms: ActivityProgram[] = [];
        const importedTasks: VolunteerTask[] = [];
        const errors: string[] = [];

        rawJson.forEach((row, index) => {
          const rowNum = index + 2;

          const name = String(
            row['اسم المبادرة'] ||
            row['المبادرة'] ||
            row['اسم البرنامج'] ||
            row['البرنامج'] ||
            row['name'] ||
            row['title'] ||
            ''
          ).trim();

          if (!name) {
            errors.push(`الصف ${rowNum}: اسم المبادرة مطلوب.`);
            return;
          }

          const rawDomain = String(
            row['تصنيف المبادرة'] ||
            row['التصنيف'] ||
            row['مجال النشاط'] ||
            row['المجال'] ||
            row['المجال الإثرائي'] ||
            row['domain'] ||
            ''
          );
          const { domain, domainName } = matchActivityDomain(rawDomain);

          const rawStage = String(
            row['المرحلة المستهدفة'] ||
            row['المرحلة الدراسية'] ||
            row['المرحلة'] ||
            row['stage'] ||
            ''
          ).trim();

          let stage: GradeStage = 'all';
          let stageLabel = 'جميع المراحل';
          if (rawStage.includes('متوسط') && !rawStage.includes('ابتدائي')) {
            stage = 'intermediate';
            stageLabel = 'المرحلة المتوسطة';
          } else if (rawStage.includes('ابتدائي') && !rawStage.includes('متوسط')) {
            stage = 'primary';
            stageLabel = 'المرحلة الابتدائية';
          }

          const rawDate = row['التاريخ الميلادي'] || row['التاريخ'] || row['تاريخ المبادرة'] || row['date'];
          const dateInfo = formatExcelDate(rawDate);

          const month = String(
            row['الشهر أو الفترة'] ||
            row['الشهر'] ||
            row['الفترة'] ||
            row['month'] ||
            dateInfo.month
          ).trim();

          const organizer = String(
            row['الجهة المنظمة'] ||
            row['المدرسة'] ||
            row['الجهة'] ||
            row['organizer'] ||
            'مدرسة ابن الجوزي للموهوبين'
          ).trim();

          const description = String(
            row['وصف المبادرة'] ||
            row['الوصف'] ||
            row['نبذة'] ||
            row['description'] ||
            `مبادرة تطوعية مدرسية ضمن خطة النشاط الطلابي في ${domainName}.`
          ).trim();

          const rawStatus = String(
            row['حالة المبادرة'] ||
            row['الحالة'] ||
            row['status'] ||
            ''
          ).trim();

          let status: 'ongoing' | 'upcoming' | 'completed' | undefined = undefined;
          if (rawStatus.includes('جار') || rawStatus.includes('نفذ') || rawStatus.includes('نشط')) {
            status = 'ongoing';
          } else if (rawStatus.includes('قادم') || rawStatus.includes('إعداد') || rawStatus.includes('قيد')) {
            status = 'upcoming';
          } else if (rawStatus.includes('منته') || rawStatus.includes('مقفل')) {
            status = 'completed';
          }

          const programId = `prog-${Date.now()}-${index}`;

          const program: ActivityProgram = {
            id: programId,
            name,
            domain,
            domainName,
            stage,
            stageLabel,
            month,
            gregorianDate: dateInfo.gregorian,
            hijriDate: String(row['التاريخ الهجري'] || '').trim(),
            organizer,
            description,
            status,
          };

          importedPrograms.push(program);

          // Sub-task handling
          const taskTitle = String(
            row['عنوان المهمة التطوعية'] ||
            row['عنوان المهمة'] ||
            row['مهمة تطوعية'] ||
            row['المهمة'] ||
            ''
          ).trim();

          const hoursRaw = parseFloat(
            String(row['عدد الساعات التطوعية'] || row['عدد الساعات'] || row['الساعات'] || row['hours'] || '2')
          );
          const hours = isNaN(hoursRaw) || hoursRaw <= 0 ? 2 : hoursRaw;

          const finalTaskTitle = taskTitle || `المشاركة والتطوع في ${name}`;
          const task: VolunteerTask = {
            id: `task-${Date.now()}-${index}`,
            programId: program.id,
            programName: program.name,
            domain: program.domain,
            title: finalTaskTitle,
            description: program.description,
            stage: program.stage,
            hours,
            maxVolunteers: 25,
            date: program.gregorianDate.replace(/\//g, '-'),
            time: '08:00 ص - 10:00 ص',
            location: program.organizer || 'مدرسة ابن الجوزي للموهوبين',
            supervisorName: 'رائد النشاط الطلابي',
            requiredSkills: ['المبادرة', 'التعاون', 'الالتزام'],
            status: status === 'completed' ? 'completed' : 'open',
            checkInCode: `VOL-${Math.floor(100 + Math.random() * 900)}`,
          };

          importedTasks.push(task);
        });

        resolve({
          success: importedPrograms.length > 0,
          importedPrograms,
          importedTasks,
          errors,
          totalRows: rawJson.length,
        });
      } catch (err: any) {
        resolve({
          success: false,
          importedPrograms: [],
          importedTasks: [],
          errors: [`حدث خطأ أثناء قراءة ملف الإكسل: ${err.message || 'تنسيق الملف غير صالح'}`],
          totalRows: 0,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        importedPrograms: [],
        importedTasks: [],
        errors: ['تعذر قراءة الملف من الجهاز.'],
        totalRows: 0,
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

export interface NonParticipatingExportRow {
  student: Student;
  statusLabel: string;
  registrationsCount: number;
  suggestedInitiatives: string;
}

export function exportNonParticipatingStudentsExcel(rows: NonParticipatingExportRow[]) {
  const data = rows.map((item, idx) => ({
    'م': idx + 1,
    'اسم الطالب': item.student.name,
    'رقم الجوال': item.student.mobile,
    'المرحلة': item.student.stage === 'primary' ? 'المرحلة الابتدائية' : 'المرحلة المتوسطة',
    'الصف': item.student.grade,
    'الفصل': item.student.classroom,
    'حالة المشاركة': item.statusLabel,
    'عدد التسجيلات غير المكتملة': item.registrationsCount,
    'الساعات المعتمدة': item.student.totalHours,
    'مبادرات مقترحة مناسبة لمرحلته': item.suggestedInitiatives,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 24 },
    { wch: 18 },
    { wch: 14 },
    { wch: 42 },
  ];
  ws['!views'] = [{ rightToLeft: true }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الطلاب غير المشاركين');
  XLSX.writeFile(
    wb,
    `متابعة_الطلاب_غير_المشاركين_${new Date().toISOString().split('T')[0]}.xlsx`
  );
}

