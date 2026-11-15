import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Share2, X, Sparkles } from 'lucide-react';
import { ActivityProgram, VolunteerTask } from '../../types';
import { resolveActivityDomainMeta } from '../../utils/programHelpers';

interface WhatsAppShareModalProps {
  program: ActivityProgram | null;
  tasks: VolunteerTask[];
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  program,
  tasks,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !program) return null;

  const domainMeta = resolveActivityDomainMeta(program.domain, program.domainName);
  const progTasks = tasks.filter((t) => t.programId === program.id);
  const hours = progTasks.length > 0 ? Math.max(...progTasks.map((t) => t.hours)) : 2;
  const tasksList = progTasks.length > 0
    ? progTasks.map((t) => `• ${t.title} (${t.hours} ساعات)`).join('\n')
    : '';

  // Direct initiative URL
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/?program=${program.id}`;

  const messageText = `✨ *فرصة تطوعية مدرسية جديدة - منصة مُبادر* ✨
━━━━━━━━━━━━━━━━━━━━
📌 *اسم المبادرة:* ${program.name}
🏷️ *التصنيف:* ${domainMeta.name}
⏱️ *عدد الساعات:* ${hours} ساعات معتمدة
📅 *التاريخ:* ${program.gregorianDate} (${program.month})
🏫 *المرحلة:* ${program.stageLabel}
🏛️ *الجهة المنظمة:* ${program.organizer}

📝 *تعريف بالمبادرة:*
${program.description}
${tasksList ? `\n🎯 *المهام التطوعية المتاحة:*\n${tasksList}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
📲 *رابط التسجيل الفوري في المبادرة:*
${shareUrl}
(يمكن للطلاب الدخول والتسجيل بطلب الانضمام مباشرة)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            {/* WhatsApp Icon SVG */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">
              مشاركة مع الطلاب وأولياء الأمور
            </span>
            <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
              إرسال المبادرة عبر واتساب
            </h3>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="bg-[#f5f5f7] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div>
            <span className="text-[#86868b] block text-[11px]">المبادرة</span>
            <span className="font-semibold text-[#1d1d1f]">{program.name}</span>
          </div>
          <div>
            <span className="text-[#86868b] block text-[11px]">التصنيف</span>
            <span className={`font-semibold text-[11px] px-2 py-0.5 rounded-full border inline-block mt-0.5 ${domainMeta.bgColor} ${domainMeta.badgeColor}`}>
              {domainMeta.name}
            </span>
          </div>
          <div>
            <span className="text-[#86868b] block text-[11px]">الساعات</span>
            <span className="font-mono font-semibold text-[#0071e3]">{hours} ساعات معتمدة</span>
          </div>
          <div>
            <span className="text-[#86868b] block text-[11px]">التاريخ</span>
            <span className="font-mono text-[#1d1d1f]">{program.gregorianDate}</span>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#86868b] px-1">
            <span>معاينة نص الرسالة الجاهزة للإرسال:</span>
            <button
              onClick={handleCopy}
              className="text-[#0071e3] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
            </button>
          </div>

          <div className="bg-[#f5f5f7]/80 border border-black/[0.06] rounded-2xl p-4 text-[12px] text-[#1d1d1f] font-sans leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto text-right select-all">
            {messageText}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-black/[0.04]">
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="flex-1 py-3 px-5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-[13px] font-medium rounded-full transition-all flex items-center justify-center gap-2 shadow-none cursor-pointer active:scale-[0.98]"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>فتح واتساب والإرسال للطلاب</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[13px] font-medium rounded-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تم النسخ بنجاح</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#86868b]" />
                <span>نسخ الرسالة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
