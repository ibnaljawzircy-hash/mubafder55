import React, { useState } from 'react';
import { Calendar, Check, CheckCircle2, Clock, Filter, MapPin, Search, Sparkles, User, Users } from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import { ActivityDomain, GradeStage, Student, VolunteerRegistration, VolunteerTask } from '../../types';

interface VolunteerTasksBrowserProps {
  student: Student;
  tasks: VolunteerTask[];
  registrations: VolunteerRegistration[];
  onRegisterTask: (taskId: string) => void;
}

export const VolunteerTasksBrowser: React.FC<VolunteerTasksBrowserProps> = ({
  student,
  tasks,
  registrations,
  onRegisterTask,
}) => {
  const [selectedStage, setSelectedStage] = useState<GradeStage | 'all'>(student.stage);
  const [selectedDomain, setSelectedDomain] = useState<ActivityDomain | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if student is registered in a task
  const isRegisteredIn = (taskId: string) => {
    return registrations.some((r) => r.taskId === taskId && r.studentId === student.id);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Stage filter
    if (selectedStage !== 'all' && task.stage !== 'all' && task.stage !== selectedStage) {
      return false;
    }

    // Domain filter
    if (selectedDomain !== 'all' && task.domain !== selectedDomain) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchProgram = task.programName.toLowerCase().includes(q);
      const matchLocation = task.location.toLowerCase().includes(q);
      const matchSupervisor = task.supervisorName.toLowerCase().includes(q);
      if (!matchTitle && !matchProgram && !matchLocation && !matchSupervisor) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Explanation */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-xl font-bold text-slate-900">
            الفرص التطوعية المقترنة بالخطة المركزية للأنشطة الطلابية
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            جميع المهام التطوعية مرتبطة مباشرة ببرامج ومسابقات إدارة التعليم العام بالهيئة الملكية بينبع (2026-2027). اختر المهمة المناسبة لك لمساعدة زملائك والمدرسة وتوثيق ساعاتك التطوعية المعتمدة.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Stage Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedStage('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStage === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع المراحل
            </button>
            <button
              onClick={() => setSelectedStage('primary')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStage === 'primary'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المرحلة الابتدائية
            </button>
            <button
              onClick={() => setSelectedStage('intermediate')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedStage === 'intermediate'
                  ? 'bg-white text-sky-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              المرحلة المتوسطة
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-md">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المهمة أو النشاط أو الموقع..."
                className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {/* Domain Dropdown */}
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="all">جميع المجالات (8 مجالات)</option>
              {ACTIVITY_DOMAINS.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Domain Quick Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 text-xs shrink-0">المجالات:</span>
        <button
          onClick={() => setSelectedDomain('all')}
          className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
            selectedDomain === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          الكل ({tasks.length})
        </button>
        {ACTIVITY_DOMAINS.map((d) => {
          const count = tasks.filter((t) => t.domain === d.id).length;
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDomain(d.id)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap font-medium ${
                selectedDomain === d.id
                  ? 'bg-emerald-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {d.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-xl">
          <p className="text-sm font-bold text-slate-700">لا توجد مهام تطوعية مطابقة لمعايير البحث</p>
          <p className="text-xs text-slate-500 mt-1">
            جرب اختيار مرحلة أخرى أو تغيير المجال المحدد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const domainMeta = ACTIVITY_DOMAINS.find((d) => d.id === task.domain);
            const taskRegistrations = registrations.filter((r) => r.taskId === task.id);
            const isFull = taskRegistrations.length >= task.maxVolunteers;
            const registered = isRegisteredIn(task.id);

            return (
              <div
                key={task.id}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Metadata line without pill sandwich */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={domainMeta?.color || 'text-slate-700'}>
                        {domainMeta?.name || 'نشاط مدرسي'}
                      </span>
                      <span>·</span>
                      <span>
                        {task.stage === 'all'
                          ? 'جميع المراحل'
                          : task.stage === 'primary'
                          ? 'ابتدائي'
                          : 'متوسط'}
                      </span>
                    </div>

                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 tabular-nums">
                      {task.hours} ساعات معتمدة
                    </span>
                  </div>

                  {/* Title and Program */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {task.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    البرنامج: {task.programName}
                  </p>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    {task.description}
                  </p>

                  {/* Required Skills */}
                  {task.requiredSkills && task.requiredSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">المهارات المطلوبة:</span>
                      {task.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Task details */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{task.location}</span>
                    </div>
                  </div>
                </div>

                {/* Footer and CTA */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono tabular-nums">
                        {taskRegistrations.length} / {task.maxVolunteers} متطوع
                      </span>
                    </div>
                  </div>

                  {registered ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <Check className="w-3.5 h-3.5" />
                      <span>مسجل بالفعل</span>
                    </span>
                  ) : isFull ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                      اكتمل العدد
                    </span>
                  ) : (
                    <button
                      onClick={() => onRegisterTask(task.id)}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      تسجيل في المهمة
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
