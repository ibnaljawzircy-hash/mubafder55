import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, X, Edit3, AlertTriangle } from 'lucide-react';
import { ACTIVITY_DOMAINS } from '../../data/yanbuPlanData';
import { ActivityDomain, ActivityProgram, GradeStage } from '../../types';
import { resolveActivityDomainMeta } from '../../utils/programHelpers';

interface EditProgramModalProps {
  program: ActivityProgram | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgram: (updatedProgram: ActivityProgram) => void;
  onDeleteProgram: (programId: string) => void;
}

export const EditProgramModal: React.FC<EditProgramModalProps> = ({
  program,
  isOpen,
  onClose,
  onUpdateProgram,
  onDeleteProgram,
}) => {
  const [name, setName] = useState('');
  const [domain, setDomain] = useState<ActivityDomain>('scouts');
  const [stage, setStage] = useState<GradeStage>('all');
  const [month, setMonth] = useState('أكتوبر');
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ongoing' | 'upcoming' | 'completed' | 'auto'>('auto');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (program) {
      const resolvedMeta = resolveActivityDomainMeta(program.domain, program.domainName);
      setName(program.name);
      setDomain(resolvedMeta.id);
      setStage(program.stage);
      setMonth(program.month);
      setGregorianDate(program.gregorianDate);
      setHijriDate(program.hijriDate);
      setOrganizer(program.organizer);
      setDescription(program.description);
      setStatus(program.status || 'auto');
      setShowDeleteConfirm(false);
    }
  }, [program, isOpen]);

  if (!isOpen || !program) return null;

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

    onUpdateProgram({
      ...program,
      name: name.trim(),
      domain: domainMeta.id,
      domainName,
      stage,
      stageLabel,
      month,
      gregorianDate,
      hijriDate,
      organizer,
      description: description.trim(),
      status: status === 'auto' ? undefined : status,
    });

    onClose();
  };

  const handleDelete = () => {
    onDeleteProgram(program.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-7 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#f5f5f7] flex items-center justify-center text-[#0071e3]">
            <Edit3 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
              لوحة المشرف
            </span>
            <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-tight">
              تعديل بيانات المبادرة
            </h3>
          </div>
        </div>

        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-[13px]">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>تأكيد الحذف النهائي للمبادرة</span>
            </div>
            <p className="text-[12px] text-red-600 leading-relaxed">
              هل أنت متأكد من الحذف النهائي لمبادرة <strong>«{program.name}»</strong>؟ سيتم حذفها ومهامها المرتبطة بها نهائياً من قاعدة البيانات.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-medium rounded-full transition-colors cursor-pointer"
              >
                نعم، احذف نهائياً
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-[#1d1d1f] text-[12px] font-medium rounded-full border border-black/[0.08] transition-colors cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
              اسم المبادرة / البرنامج
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] focus:bg-white transition-all font-medium"
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
                تحديث التصنيف ينعكس مباشرة على إحصائيات المجالات الثمانية.
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
                التاريخ الميلادي
              </label>
              <input
                type="text"
                value={gregorianDate}
                onChange={(e) => setGregorianDate(e.target.value)}
                placeholder="2026/11/15"
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#1d1d1f] mb-1">
                الشهر أو الفترة
              </label>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="نوفمبر"
                className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
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
              placeholder="مدرسة ابن الجوزي للموهوبين"
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
              وصف المبادرة والمهام المطلوبة
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="وصف تفاصيل المبادرة..."
              className="w-full px-4 py-2.5 text-[13px] bg-[#f5f5f7] border border-black/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3]"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف المبادرة</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-medium text-[#1d1d1f] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-full transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13px] font-medium rounded-full transition-colors shadow-none cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
