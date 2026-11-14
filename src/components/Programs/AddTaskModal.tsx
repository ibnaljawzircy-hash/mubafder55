import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, Plus, Sparkles, X } from 'lucide-react';
import { ActivityProgram, GradeStage, VolunteerTask } from '../../types';

interface AddTaskModalProps {
  program: ActivityProgram;
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: Omit<VolunteerTask, 'id' | 'checkInCode'>) => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  program,
  isOpen,
  onClose,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<GradeStage>(program.stage);
  const [hours, setHours] = useState(2);
  const [maxVolunteers, setMaxVolunteers] = useState(10);
  const [date, setDate] = useState(program.gregorianDate.replace(/\//g, '-'));
  const [time, setTime] = useState('08:00 ص - 10:30 ص');
  const [location, setLocation] = useState('مقر النشاط بالمدرسة');
  const [supervisorName, setSupervisorName] = useState(program.organizer || 'أ. رائد النشاط');
  const [skillsInput, setSkillsInput] = useState('التنظيم, العمل الجماعي, اللباقة');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onAddTask({
      programId: program.id,
      programName: program.name,
      domain: program.domain,
      title: title.trim(),
      description: description.trim(),
      stage,
      hours: Number(hours) || 2,
      maxVolunteers: Number(maxVolunteers) || 10,
      date,
      time,
      location,
      supervisorName,
      requiredSkills: skills,
      status: 'open',
    });

    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-4 relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
            {program.name}
          </span>
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight mt-0.5">
            إضافة مهمة تطوعية
          </h3>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            عنوان المهمة
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: استقبال الزملاء وتنظيم المعرض الكشفي"
            className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            وصف ما يقوم به الطالب
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مهام الطالب خلال النشاط..."
            rows={2}
            className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              المرحلة
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as any)}
              className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
            >
              <option value="all">جميع المراحل</option>
              <option value="primary">ابتدائي</option>
              <option value="intermediate">متوسط</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              الساعات
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono text-center font-semibold"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              الحد الأقصى
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxVolunteers}
              onChange={(e) => setMaxVolunteers(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono text-center font-semibold"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              تاريخ التنفيذ
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              الوقت
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="08:00 ص - 10:30 ص"
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              مكان النشاط
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="فناء المدرسة / الصالة"
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              اسم المشرف
            </label>
            <input
              type="text"
              value={supervisorName}
              onChange={(e) => setSupervisorName(e.target.value)}
              placeholder="أ. خالد الجهني"
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.04]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors shadow-none cursor-pointer"
          >
            إضافة المهمة
          </button>
        </div>
      </form>
    </div>
  );
};
