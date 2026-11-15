import React, { useState } from 'react';
import { BookOpen, Calendar, Plus, X } from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import { ActivityDomain, ActivityProgram, GradeStage } from '../../types';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProgram: (program: Omit<ActivityProgram, 'id'>) => void;
}

export const AddProgramModal: React.FC<AddProgramModalProps> = ({
  isOpen,
  onClose,
  onAddProgram,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<ActivityDomain>('scouts');
  const [stage, setStage] = useState<GradeStage>('all');
  const [month, setMonth] = useState('أكتوبر');
  const [gregorianDate, setGregorianDate] = useState('2026/10/20');
  const [hijriDate, setHijriDate] = useState('1448/05/09');
  const [organizer, setOrganizer] = useState('إدارة التعليم العام بينبع');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'upcoming' | 'completed' | 'auto'>('auto');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const domainMeta = ACTIVITY_DOMAINS.find((d) => d.id === domain) || ACTIVITY_DOMAINS[0];
    const domainName = domainMeta.name;

    const stageLabel =
      stage === 'all'
        ? 'جميع المراحل'
        : stage === 'primary'
        ? 'المرحلة الابتدائية'
        : 'المرحلة المتوسطة';

    onAddProgram({
      name: name.trim(),
      domain: domainMeta.id,
      domainName,
      stage,
      stageLabel,
      month,
      gregorianDate,
      hijriDate,
      organizer,
      description: description.trim() || 'برنامج ونشاط مدرسي ضمن خطة الأنشطة الطلابية.',
      status: status === 'auto' ? undefined : status,
    });

    onClose();
    setName('');
    setDescription('');
    setStatus('auto');
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
            خطة الأنشطة المعتمدة
          </span>
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight mt-0.5">
            إضافة مبادرة جديدة
          </h3>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            اسم المبادرة / البرنامج *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مبادرة التشجير والعناية بالبيئة المدرسية"
            className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white transition-all"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              تصنيف المبادرة (المجالات الثمانية) *
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as ActivityDomain)}
              className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-medium"
              required
            >
              {ACTIVITY_DOMAINS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <span className="block text-[10px] text-[#86868b] mt-1">
              يظهر التصنيف في بطاقة المبادرة ويُحتسب تلقائياً في الإحصائية.
            </span>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              المرحلة المستهدفة *
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as GradeStage)}
              className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
            >
              <option value="all">جميع المراحل</option>
              <option value="primary">المرحلة الابتدائية</option>
              <option value="intermediate">المرحلة المتوسطة</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              الشهر
            </label>
            <input
              type="text"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="نوفمبر"
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              التاريخ
            </label>
            <input
              type="text"
              value={gregorianDate}
              onChange={(e) => setGregorianDate(e.target.value)}
              placeholder="2026/11/15"
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            الجهة المنظمة / المدرسة
          </label>
          <input
            type="text"
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="مدرسة ابن الجوزي / مدرسة الإمام نافع"
            className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            حالة المبادرة والعرض (التنفيذ والرؤية)
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2.5 text-[12px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
          >
            <option value="auto">تلقائي (حسب التسلسل الزمني وتاريخ المبادرة)</option>
            <option value="ongoing">🟢 جاري تنفيذها الآن (رؤية مباشرة وإبراز)</option>
            <option value="upcoming">⚙️ قادمة / قيد الإعداد</option>
            <option value="completed">🔒 منتهية ومقفلة (باهتة وقفل التسجيل)</option>
          </select>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
            وصف موجز للبرنامج
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="أهداف البرنامج ومحتواه..."
            rows={2}
            className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
          />
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
            إضافة المبادرة
          </button>
        </div>
      </form>
    </div>
  );
};
