import React from 'react';
import { Award, CheckCircle, Download, FileText, Printer, QrCode, Shield, Sparkles } from 'lucide-react';
import { Student, VolunteerRegistration, VolunteerTask } from '../../types';

interface StudentCertificateProps {
  student: Student;
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  onBack: () => void;
}

export const StudentCertificate: React.FC<StudentCertificateProps> = ({
  student,
  tasks,
  registrations,
  onBack,
}) => {
  // Get completed registrations
  const completedRegs = registrations.filter(
    (r) => r.studentId === student.id && r.attendanceStatus === 'completed'
  );

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden in Print) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            الشهادة الرسمية لتوثيق الساعات التطوعية
          </h2>
          <p className="text-xs text-slate-500">
            شهادة معتمدة موثقة برقم الجوال وبيانات النشاط الطلابي
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
          >
            ← العودة
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-[13px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-full transition-colors flex items-center gap-1.5 shadow-none cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الشهادة الرسمية</span>
          </button>
        </div>
      </div>

      {/* Printable Certificate Frame */}
      <div
        id="printable-certificate"
        className="bg-white border-8 border-double border-emerald-900/20 rounded-2xl p-8 sm:p-12 shadow-md relative overflow-hidden"
      >
        {/* Subtle Decorative Corners */}
        <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-emerald-800 opacity-60" />
        <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-emerald-800 opacity-60" />
        <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-emerald-800 opacity-60" />
        <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-emerald-800 opacity-60" />

        {/* Header Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-right border-b-2 border-slate-100 pb-6 gap-4">
          <div>
            <span className="text-xs font-bold text-slate-700 block">المملكة العربية السعودية</span>
            <span className="text-xs font-bold text-emerald-800 block">الهيئة الملكية للجبيل وينبع</span>
            <span className="text-xs font-semibold text-slate-600 block">إدارة التعليم العام بينبع</span>
            <span className="text-[11px] text-slate-500 block">قسم شؤون الطلاب · النشاط الطلابي</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm mb-1">
              مـ
            </div>
            <span className="text-xs font-bold text-emerald-900 tracking-wider">
              منصة مُبادر للتطوع
            </span>
          </div>

          <div className="text-center sm:text-left text-xs text-slate-500 font-mono space-y-0.5">
            <div>رقم الشهادة: RCJY-VOL-{student.mobile.slice(-4)}-{student.totalHours}</div>
            <div>تاريخ الإصدار: {currentDate}</div>
            <div>الرمز المرجعي: YNB-2026-2027</div>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center my-8">
          <span className="inline-block px-4 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200 mb-2">
            الخطة المركزية للأنشطة الطلابية
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            شهادة توثيق الساعات التطوعية المدرسية
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            تُشيد إدارة التعليم العام بالهيئة الملكية بينبع بالجهود المتميزة والمبادرة الإيجابية للطالب في خدمة مدرسته ومجتمعه
          </p>
        </div>

        {/* Recipient Details */}
        <div className="text-center max-w-2xl mx-auto space-y-4 my-6">
          <p className="text-sm text-slate-700">تَشهد إدارة المدرسة بأن الطالب:</p>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800 underline decoration-emerald-300 underline-offset-8">
            {student.name}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-slate-600 pt-2">
            <span>
              رقم الجوال: <strong className="font-mono">{student.mobile}</strong>
            </span>
            <span>·</span>
            <span>المدرسة: <strong>{student.schoolName}</strong></span>
            <span>·</span>
            <span>الصف: <strong>{student.grade} ({student.classroom})</strong></span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 my-6 text-center">
            <p className="text-sm text-slate-800 leading-relaxed">
              قد أتم بنجاح وبكفاءة عالية مشاركته في البرامج والأنشطة الطلابية المدرسية،
              وحصل على مجموع ساعات تطوعية معتمدة وموثقة قدرها:
            </p>
            <div className="text-3xl font-black text-emerald-700 font-mono my-2 tabular-nums">
              {student.totalHours} ساعة تطوعية
            </div>
            <p className="text-xs font-semibold text-slate-600">
              المستوى المستحق: <span className="text-amber-600 font-bold">{student.badgeLevel}</span>
            </p>
          </div>
        </div>

        {/* Tasks Log Table */}
        {completedRegs.length > 0 && (
          <div className="my-6">
            <h3 className="text-xs font-bold text-slate-700 mb-2">
              سجل المهام والأنشطة التطوعية المنجزة:
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2.5">النشاط / البرنامج</th>
                    <th className="p-2.5">المهمة التطوعية</th>
                    <th className="p-2.5">التاريخ</th>
                    <th className="p-2.5 text-center">الساعات</th>
                    <th className="p-2.5">المشرف المعتمد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {completedRegs.map((reg) => {
                    const task = tasks.find((t) => t.id === reg.taskId);
                    return (
                      <tr key={reg.id} className="text-slate-600">
                        <td className="p-2.5 font-medium">{task?.programName || 'نشاط مدرسي'}</td>
                        <td className="p-2.5">{task?.title || 'مهمة تطوعية'}</td>
                        <td className="p-2.5 font-mono">{task?.date}</td>
                        <td className="p-2.5 text-center font-bold font-mono text-emerald-700">
                          {reg.hoursAwarded} س
                        </td>
                        <td className="p-2.5">{reg.confirmedBy || task?.supervisorName || 'رائد النشاط'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Signatures and Stamp */}
        <div className="grid grid-cols-3 items-end pt-8 mt-8 border-t border-slate-200 text-center">
          <div>
            <span className="block text-xs font-bold text-slate-700">رائد النشاط الطلابي</span>
            <div className="h-12 flex items-center justify-center">
              <span className="font-serif italic text-slate-400 text-sm">أ. خالد الجهني</span>
            </div>
            <span className="block text-[11px] text-slate-500">التوقيع والاعتماد</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-800/40 flex flex-col items-center justify-center p-1 text-[9px] text-emerald-800 font-bold uppercase tracking-widest text-center">
              <span>ختم إدارة التعليم</span>
              <span className="font-mono text-[8px]">RCJY 2026</span>
              <Shield className="w-4 h-4 text-emerald-700 mt-0.5" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">الختم المعتمد</span>
          </div>

          <div>
            <span className="block text-xs font-bold text-slate-700">مدير المدرسة</span>
            <div className="h-12 flex items-center justify-center">
              <span className="font-serif italic text-slate-400 text-sm">د. أحمد السلمي</span>
            </div>
            <span className="block text-[11px] text-slate-500">الاعتماد الرسمي</span>
          </div>
        </div>
      </div>
    </div>
  );
};
