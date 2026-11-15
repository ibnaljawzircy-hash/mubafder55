import React, { useRef, useState } from 'react';
import { Award, CheckCircle, Download, FileSpreadsheet, Plus, Search, Trash2, Upload, Users, X } from 'lucide-react';
import { GradeStage, Student } from '../../types';
import { downloadStudentTemplate, parseStudentsExcel } from '../../utils/excel';

interface StudentRosterProps {
  students: Student[];
  onAddStudents: (newStudents: Student[]) => void;
  onDeleteStudent: (studentId: string) => void;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
  students,
  onAddStudents,
  onDeleteStudent,
}) => {
  const [stageFilter, setStageFilter] = useState<GradeStage | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    students: Student[];
    errors: string[];
    fileName: string;
  } | null>(null);

  // Manual student form
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [stage, setStage] = useState<GradeStage>('primary');
  const [grade, setGrade] = useState('الصف الخامس الابتدائي');
  const [classroom, setClassroom] = useState('5/1');
  const [schoolName, setSchoolName] = useState('مدرسة ابن الجوزي للموهوبين');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    const result = await parseStudentsExcel(file);
    setImportLoading(false);

    if (result.success && result.importedStudents.length > 0) {
      setImportPreview({
        students: result.importedStudents,
        errors: result.errors,
        fileName: file.name,
      });
    } else {
      alert(`تعذر استيراد الطلاب: ${result.errors.join(' | ') || 'الملف غير صالح'}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = () => {
    if (importPreview) {
      onAddStudents(importPreview.students);
      setImportPreview(null);
    }
  };

  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    const cleanMobile = mobile.trim().replace(/[\s-]/g, '');
    const newStudent: Student = {
      id: cleanMobile,
      name: name.trim(),
      mobile: cleanMobile,
      stage,
      grade,
      classroom,
      schoolName,
      totalHours: 0,
      completedTasksCount: 0,
      registeredDate: new Date().toISOString().split('T')[0],
      badgeLevel: 'متطوع جديد',
    };

    onAddStudents([newStudent]);
    setShowAddModal(false);
    setName('');
    setMobile('');
  };

  const filteredStudents = students.filter((s) => {
    if (stageFilter !== 'all' && s.stage !== stageFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchMobile = s.mobile.includes(q);
      const matchSchool = s.schoolName.toLowerCase().includes(q);
      if (!matchName && !matchMobile && !matchSchool) return false;
    }
    return true;
  });

  const primaryCount = students.filter((s) => s.stage === 'primary').length;
  const intermediateCount = students.filter((s) => s.stage === 'intermediate').length;

  return (
    <div className="space-y-6">
      {/* Header and Excel Import Actions - Apple Style */}
      <div className="bg-[#ffffff] rounded-3xl p-7 border border-black/[0.04] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wide">
              {students.length} طالب مسجل ({primaryCount} ابتدائي · {intermediateCount} متوسط)
            </span>
            <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
              سجل الطلاب واستيراد إكسل
            </h2>
            <p className="text-[13px] text-[#86868b]">
              الدخول للطلاب متاح عبر رقم الجوال وآخر 5 أرقام من رقم الجوال
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={downloadStudentTemplate}
              className="px-4 py-2 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>تحميل نموذج إكسل</span>
            </button>

            <label className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[12px] font-medium rounded-full transition-colors flex items-center gap-1.5 shadow-none cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>{importLoading ? 'جاري القراءة...' : 'استيراد ملف إكسل'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white text-[12px] font-medium rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>طالب يدوي</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-black/[0.04]">
          <div className="flex items-center p-1 bg-[#f5f5f7] rounded-full text-[12px]">
            <button
              onClick={() => setStageFilter('all')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                stageFilter === 'all'
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              الكل ({students.length})
            </button>
            <button
              onClick={() => setStageFilter('primary')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                stageFilter === 'primary'
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              الابتدائية ({primaryCount})
            </button>
            <button
              onClick={() => setStageFilter('intermediate')}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                stageFilter === 'intermediate'
                  ? 'bg-white text-[#1d1d1f] font-semibold shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              المتوسطة ({intermediateCount})
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#86868b] absolute right-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم، رقم الجوال، أو المدرسة..."
              className="w-full pr-9 pl-3 py-1.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-full focus:outline-none focus:border-[#0071e3] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Excel Import Preview Modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#ffffff] rounded-3xl max-w-2xl w-full p-7 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-semibold text-[#1d1d1f]">
                معاينة ملف الطلاب ({importPreview.fileName})
              </h3>
              <button
                onClick={() => setImportPreview(null)}
                className="text-[#86868b] hover:text-[#1d1d1f] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[13px] text-[#86868b]">
              تم العثور على <strong>{importPreview.students.length}</strong> طالب. سيتمكن هؤلاء الطلاب من الدخول فورياً برقم الجوال وآخر 5 أرقام.
            </p>

            <div className="flex-1 overflow-y-auto border border-black/[0.06] rounded-2xl">
              <table className="w-full text-right text-[12px]">
                <thead className="bg-[#f5f5f7] text-[#86868b] font-medium sticky top-0">
                  <tr>
                    <th className="p-2.5">اسم الطالب</th>
                    <th className="p-2.5">رقم الجوال</th>
                    <th className="p-2.5">المرحلة</th>
                    <th className="p-2.5">الصف / الفصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {importPreview.students.map((s, idx) => (
                    <tr key={idx} className="hover:bg-[#f5f5f7]/50">
                      <td className="p-2.5 font-semibold text-[#1d1d1f]">{s.name}</td>
                      <td className="p-2.5 font-mono text-[#86868b]">{s.mobile}</td>
                      <td className="p-2.5 text-[#86868b]">{s.stage === 'primary' ? 'الابتدائية' : 'المتوسطة'}</td>
                      <td className="p-2.5 text-[#86868b]">{s.grade} ({s.classroom})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setImportPreview(null)}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] rounded-full"
              >
                إلغاء
              </button>
              <button
                onClick={confirmImport}
                className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full cursor-pointer"
              >
                تأكيد وإضافة {importPreview.students.length} طالب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Student Addition Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleManualAddSubmit}
            className="bg-[#ffffff] rounded-3xl max-w-md w-full p-7 shadow-xl space-y-4"
          >
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-semibold text-[#1d1d1f]">إضافة طالب جديد</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#86868b] hover:text-[#1d1d1f] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">اسم الطالب:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="محمد فهد الجهني"
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">رقم الجوال:</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="0551122334"
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">المرحلة:</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none"
                >
                  <option value="primary">المرحلة الابتدائية</option>
                  <option value="intermediate">المرحلة المتوسطة</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">الفصل:</label>
                <input
                  type="text"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  placeholder="5/1"
                  className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">الصف:</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="الصف الخامس الابتدائي"
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.04]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] rounded-full"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full cursor-pointer"
              >
                إضافة الطالب
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Students Directory Table */}
      <div className="bg-[#ffffff] rounded-3xl border border-black/[0.04] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-[12px]">
            <thead className="bg-[#f5f5f7] text-[#86868b] font-medium">
              <tr>
                <th className="p-3.5 w-12 text-center">م</th>
                <th className="p-3.5">اسم الطالب</th>
                <th className="p-3.5">الجوال</th>
                <th className="p-3.5">الصف والفصل</th>
                <th className="p-3.5">المدرسة</th>
                <th className="p-3.5 text-center">الساعات</th>
                <th className="p-3.5">الوسام</th>
                <th className="p-3.5 w-14 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#86868b]">
                    لا يوجد طلاب مطابقون.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, index) => (
                  <tr key={s.id} className="hover:bg-[#f5f5f7]/50 transition-colors">
                    <td className="p-3.5 text-center font-mono text-[#86868b]">
                      {index + 1}
                    </td>

                    <td className="p-3.5 font-semibold text-[#1d1d1f]">
                      {s.name}
                    </td>

                    <td className="p-3.5 font-mono text-[#86868b] tabular-nums">
                      {s.mobile}
                    </td>

                    <td className="p-3.5 text-[#1d1d1f]">
                      {s.grade} ({s.classroom})
                    </td>

                    <td className="p-3.5 text-[#86868b]">
                      {s.schoolName}
                    </td>

                    <td className="p-3.5 text-center font-mono font-semibold text-[#0071e3] tabular-nums">
                      {s.totalHours}س
                    </td>

                    <td className="p-3.5">
                      <span className="text-[11px] font-medium text-[#1d1d1f] bg-[#f5f5f7] px-2.5 py-0.5 rounded-full">
                        {s.badgeLevel}
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteStudent(s.id)}
                        title="حذف الطالب"
                        className="p-1 text-[#86868b] hover:text-red-600 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
