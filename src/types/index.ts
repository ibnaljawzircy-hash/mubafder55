export type GradeStage = 'primary' | 'intermediate' | 'all';

export type ActivityDomain = 
  | 'cultural_arts'        // الثقافة والفنون
  | 'citizenship_life'     // المواطنة والحياة
  | 'health_sports'        // الصحة والرياضة
  | 'scouts'               // النشاط الكشفي
  | 'science_tech'         // العلوم والتقنية
  | 'national_world_days'  // المناسبات والأيام العالمية
  | 'educational_initiatives' // المبادرات التعليمية
  | 'awards_competitions'; // الجوائز والمسابقات

export interface ActivityProgram {
  id: string;
  name: string;
  domain: ActivityDomain;
  domainName: string;
  stage: GradeStage;
  stageLabel: string;
  month: string;
  gregorianDate: string;
  hijriDate: string;
  organizer: string;
  description: string;
  status?: 'ongoing' | 'upcoming' | 'completed';
  maxSeats?: number;
}

export interface VolunteerTask {
  id: string;
  programId: string;
  programName: string;
  domain: ActivityDomain;
  title: string;
  description: string;
  requiredSkills?: string[];
  stage: GradeStage;
  hours: number;
  maxVolunteers: number;
  date: string;
  time: string;
  location: string;
  supervisorName: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  checkInCode: string;
}

export interface Student {
  id: string; // unique identifier (usually student's mobile number)
  name: string;
  mobile: string;
  stage: GradeStage;
  grade: string; // e.g. "الصف الخامس", "الصف الثاني متوسط"
  classroom: string; // e.g. "5/1", "2/3"
  schoolName: string;
  totalHours: number;
  completedTasksCount: number;
  registeredDate: string;
  badgeLevel: string;
}

export interface VolunteerRegistration {
  id: string;
  taskId: string;
  programId?: string;
  programName?: string;
  studentId: string;
  studentName: string;
  studentMobile?: string;
  studentStage: GradeStage;
  registeredAt: string;
  attendanceStatus: 'registered' | 'attended' | 'absent' | 'completed';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  hoursAwarded: number;
  notes?: string;
  confirmedAt?: string;
  confirmedBy?: string;
  rating?: number; // 1 to 5 star rating given after completing activity
}

export interface ActivityDomainMeta {
  id: ActivityDomain;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  badgeColor: string;
}
