import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { ActivityProgram, VolunteerTask } from '../../types';
import { downloadProgramTemplate, parseProgramsExcel } from '../../utils/excel';

interface ImportProgramsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchAddPrograms: (programs: ActivityProgram[], tasks: VolunteerTask[]) => void;
}

export const ImportProgramsModal: React.FC<ImportProgramsModalProps> = ({
  isOpen,
  onClose,
  onBatchAddPrograms,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPrograms, setParsedPrograms] = useState<ActivityProgram[]>([]);
  const [parsedTasks, setParsedTasks] = useState<VolunteerTask[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setErrors([]);
    setParsedPrograms([]);
    setParsedTasks([]);

    try {
      const result = await parseProgramsExcel(selectedFile);
      if (result.success) {
        setParsedPrograms(result.importedPrograms);
        setParsedTasks(result.importedTasks);
        setErrors(result.errors);
      } else {
        setErrors(result.errors.length > 0 ? result.errors : ['تعذر قراءة بيانات المبادرات من الملف.']);
      }
    } catch (err: any) {
      setErrors([err.message || 'حدث خطأ أثناء معالجة ملف الإكسل.']);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith('.xlsx') ||
        droppedFile.name.endsWith('.xls') ||
        droppedFile.name.endsWith('.csv')
      ) {
        handleFileChange(droppedFile);
      } else {
        setErrors(['يرجى رفع ملف بصيغة Excel (.xlsx, .xls) أو CSV فقط.']);
      }
    }
  };

  const handleConfirmImport = () => {
    if (parsedPrograms.length === 0) return;
    onBatchAddPrograms(parsedPrograms, parsedTasks);
    onClose();
    // Reset state
    setFile(null);
    setParsedPrograms([]);
    setParsedTasks([]);
    setErrors([]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#ffffff] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.12)] border border-black/[0.06] space-y-6 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/[0.04] rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/80 shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-[#1d1d1f] tracking-tight">
              استيراد المبادرات من ملف إكسل
            </h2>
            <p className="text-[13px] text-[#86868b]">
              إدراج مبادرات ومهام خطة النشاط المدرسي دفعة واحدة بسهولة
            </p>
          </div>
        </div>

        {/* Step 1: Download Template */}
        <div className="bg-[#f5f5f7] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-black/[0.04]">
          <div className="space-y-0.5">
            <span className="text-[13px] font-semibold text-[#1d1d1f] block">
              1. نموذج إكسل الجاهز والمطابق
            </span>
            <span className="text-[12px] text-[#86868b]">
              قم بتحميل النموذج المعتمد المجهز بالأعمدة الصحيحة والأمثلة الإرشادية.
            </span>
          </div>

          <button
            type="button"
            onClick={downloadProgramTemplate}
            className="px-4 py-2 bg-[#ffffff] hover:bg-[#e8e8ed] text-[#1d1d1f] text-[12px] font-medium rounded-full transition-all flex items-center justify-center gap-1.5 border border-black/[0.08] shadow-xs shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>تحميل نموذج الإكسل</span>
          </button>
        </div>

        {/* Step 2: Upload Area */}
        <div className="space-y-2">
          <label className="block text-[13px] font-semibold text-[#1d1d1f]">
            2. رفع ملف المبادرات (.xlsx, .xls, .csv)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#0071e3] bg-[#0071e3]/5'
                : 'border-black/[0.12] hover:border-[#0071e3] hover:bg-[#f5f5f7]'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-[14px] font-medium text-[#1d1d1f]">
                {file ? file.name : 'اسحب ملف الإكسل هنا أو اضغط للاختيار من جهازك'}
              </span>
              <span className="text-[12px] text-[#86868b]">
                يدعم ملفات Microsoft Excel و CSV
              </span>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isParsing && (
          <div className="text-center py-4 text-[13px] text-[#86868b] flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-[#0071e3] border-t-transparent rounded-full animate-spin" />
            <span>جاري قراءة ومعالجة صفوف المبادرات...</span>
          </div>
        )}

        {/* Error messages */}
        {errors.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-[12px] text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>ملاحظات التحقق من الملف:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-rose-700 pr-1">
              {errors.slice(0, 5).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
              {errors.length > 5 && (
                <li>وغيرها {errors.length - 5} ملاحظات...</li>
              )}
            </ul>
          </div>
        )}

        {/* Preview Extracted Programs */}
        {parsedPrograms.length > 0 && (
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-[#1d1d1f]">
                المعاينة: تم استخراج ({parsedPrograms.length}) مبادرة بنجاح
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                جاهزة للاستيراد
              </span>
            </div>

            <div className="border border-black/[0.08] rounded-2xl overflow-y-auto max-h-56 divide-y divide-black/[0.04]">
              {parsedPrograms.map((prog, idx) => {
                const task = parsedTasks[idx];
                return (
                  <div key={prog.id} className="p-3 text-[12px] flex items-start justify-between gap-3 bg-white hover:bg-[#fafafa]">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1d1d1f]">{prog.name}</span>
                        <span className="text-[10px] bg-[#f5f5f7] text-[#86868b] px-2 py-0.5 rounded-full">
                          {prog.stageLabel}
                        </span>
                        {prog.status === 'ongoing' && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            جاري تنفيذها
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#86868b] flex flex-wrap items-center gap-2">
                        <span>المجال: {prog.domainName}</span>
                        <span>·</span>
                        <span className="font-mono">التاريخ: {prog.gregorianDate}</span>
                        {task && (
                          <>
                            <span>·</span>
                            <span className="font-mono text-[#0071e3]">{task.hours} ساعات</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.04]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-[13px] font-medium text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={parsedPrograms.length === 0}
            onClick={handleConfirmImport}
            className={`px-6 py-2.5 text-[13px] font-medium rounded-full transition-all flex items-center justify-center gap-1.5 shadow-none ${
              parsedPrograms.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>تأكيد استيراد ({parsedPrograms.length}) مبادرة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
