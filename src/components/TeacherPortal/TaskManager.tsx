import React, { useState } from 'react';
import { Calendar, CheckCircle, Clock, MapPin, Plus, Trash2, Users } from 'lucide-react';
import { ACTIVITY_DOMAINS, YANBU_PROGRAMS } from '../../data/yanbuPlanData';
import { ActivityDomain, GradeStage, VolunteerTask } from '../../types';

interface TaskManagerProps {
  tasks: VolunteerTask[];
  onAddTask: (newTask: Omit<VolunteerTask, 'id' | 'checkInCode'>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskStatus: (taskId: string) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleTaskStatus,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState(YANBU_PROGRAMS[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<GradeStage>('all');
  const [hours, setHours] = useState(2);
  const [maxVolunteers, setMaxVolunteers] = useState(12);
  const [date, setDate] = useState('2026-10-15');
  const [time, setTime] = useState('08:00 ص - 10:00 ص');
  const [location, setLocation] = useState('ساحة المدرسة والبهو الرئيسي');
  const [supervisorName, setSupervisorName] = useState('أ. رائد النشاط الطلابي');
  const [skillsInput, setSkillsInput] = useState('التعاون, التنظيم, الالتزام');

  const handleProgramChange = (progId: string) => {
    setSelectedProgramId(progId);
    const prog = YANBU_PROGRAMS.find((p) => p.id === progId);
    if (prog) {
      setStage(prog.stage);
      setDate(prog.gregorianDate.replace(/\//g, '-'));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const prog = YANBU_PROGRAMS.find((p) => p.id === selectedProgramId);
    const domain: ActivityDomain = prog ? prog.domain : 'citizenship_life';
    const programName = prog ? prog.name : 'نشاط مدرسي عام';

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddTask({
      programId: selectedProgramId,
      programName,
      domain,
      title: title.trim(),
      description: description.trim(),
      requiredSkills: skills,
      stage,
      hours: Number(hours) || 2,
      maxVolunteers: Number(maxVolunteers) || 10,
      date,
      time,
      location,
      supervisorName,
      status: 'open',
    });

    // Reset form
    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Toggle Form Button */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            إدارة وطرح المهام التطوعية لبرامج النشاط
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            طرح مهمة تطوعية جديدة مقترنة بالخطة المركزية وتحديد الساعات والمقاعد المتاحة
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'إلغاء النموذج' : 'طرح مهمة تطوعية جديدة'}</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border-2 border-emerald-600/30 rounded-xl p-6 shadow-md space-y-4"
        >
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              بيانات المهمة التطوعية الجديدة
            </h3>
            <span className="text-xs text-slate-500">
              اختر البرنامج من خطة الأنشطة المعتمدة ثم حدد مواصفات المهمة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                البرنامج / النشاط من الخطة المركزية (إدارة التعليم العام بينبع):
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => handleProgramChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              >
                {YANBU_PROGRAMS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.domainName}] {p.name} ({p.stageLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان المهمة التطوعية للطلاب:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تنظيم قاعة المسرح وإرشاد المتسابقين"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                وصف المهمة وما يقوم به الطالب:
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح الدور المطلوب من الطالب وكيف سيساهم في نجاح النشاط..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المرحلة المستهدفة:
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">جميع المراحل (ابتدائي ومتوسط)</option>
                <option value="primary">المرحلة الابتدائية فقط</option>
                <option value="intermediate">المرحلة المتوسطة فقط</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عدد الساعات التطوعية المعتمدة:
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الحد الأقصى للمتطوعين:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={maxVolunteers}
                onChange={(e) => setMaxVolunteers(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                تاريخ التنفيذ:
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الوقت:
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:00 ص - 10:30 ص"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مكان التنفيذ:
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="صالة الأنشطة / فناء المدرسة / مسرح الإمام نافع"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم المشرف المسؤول:
              </label>
              <input
                type="text"
                value={supervisorName}
                onChange={(e) => setSupervisorName(e.target.value)}
                placeholder="أ. خالد الجهني"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المهارات المطلوبة (مفصولة بفواصل):
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="التنظيم, الهدوء, سرعة البديهة"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              حفظ ونشر المهمة التطوعية للطلاب
            </button>
          </div>
        </form>
      )}

      {/* Existing Tasks List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            قائمة المهام المطروحة في المدرسة ({tasks.length})
          </h3>
          <span className="text-xs text-slate-400">
            يمكن إغلاق المهمة أو حذفها أو متابعة كشف حضورها
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {tasks.map((task) => {
            const domainMeta = ACTIVITY_DOMAINS.find((d) => d.id === task.domain);
            return (
              <div
                key={task.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold ${domainMeta?.color || 'text-slate-700'}`}>
                      {domainMeta?.name}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs text-slate-500">
                      {task.stage === 'all' ? 'جميع المراحل' : task.stage === 'primary' ? 'ابتدائي' : 'متوسط'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {task.hours} ساعات
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      رمز التحضير: {task.checkInCode}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                  <p className="text-xs text-slate-600">البرنامج: {task.programName}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span>{task.date} ({task.time})</span>
                    <span>·</span>
                    <span>الموقع: {task.location}</span>
                    <span>·</span>
                    <span>المشرف: {task.supervisorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onToggleTaskStatus(task.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      task.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {task.status === 'completed' ? 'إعادة الفتح' : 'تحديد كمكتمل'}
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="حذف المهمة"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
