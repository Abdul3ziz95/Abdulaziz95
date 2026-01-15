
import React, { useState, useRef } from 'react';
import { Transaction, TransactionType } from '../types.ts';
import { CATEGORIES, BRAND } from '../constants.ts';
import { generateId } from '../utils.ts';

interface Props {
    type: TransactionType;
    onSubmit: (t: Transaction) => void;
    onCancel: () => void;
    initialData?: Transaction;
}

export const TransactionForm: React.FC<Props> = ({ type, onSubmit, onCancel, initialData }) => {
    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [category, setCategory] = useState(initialData?.category || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [status, setStatus] = useState(initialData?.status || (type === 'expense' ? 'مدفوع' : 'غير مدفوع'));
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 16));
    const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
    const [showImageOptions, setShowImageOptions] = useState(false);
    
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
                setShowImageOptions(false);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const val = parseFloat(amount);
        
        if (isNaN(val) || val <= 0 || !category || !date) {
            alert("يرجى إدخال كافة الحقول المطلوبة بشكل صحيح.");
            return;
        }

        const transaction: Transaction = {
            id: initialData?.id || generateId(type),
            type,
            category,
            amount: val,
            description: description.trim(),
            date,
            status: type === 'expense' ? 'مدفوع' : status,
            imageUrl: type === 'expense' ? imageUrl : '', // No image for non-expenses
            remainingAmount: (type === 'expense' || status === 'مدفوع' || status === 'كامل') ? 0 : val,
            paidAmount: (type === 'expense' || status === 'مدفوع' || status === 'كامل') ? val : 0
        };

        onSubmit(transaction);
        if (!initialData) {
            setAmount('');
            setCategory('');
            setDescription('');
            setImageUrl('');
        }
    };

    const title = initialData ? 'تعديل المعاملة' : (type === 'expense' ? 'تسجيل مصروف' : type === 'right' ? 'تسجيل حق' : 'تسجيل التزام');
    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;

    return (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#2d2d2d] p-8 rounded-[2rem] shadow-2xl space-y-6 animate-slide-up border border-zinc-100 dark:border-zinc-700">
            <h2 className="text-2xl font-black mb-4 text-center" style={{ color }}>{title}</h2>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2">المبلغ المالي</label>
                    <input 
                        type="number" 
                        step="any"
                        value={amount} 
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#f7f9fc] dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-800 rounded-[1.5rem] p-5 text-3xl font-black focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-center"
                        style={{ color }}
                        required
                        autoFocus
                    />
                </div>

                <div className={`grid grid-cols-1 ${type === 'expense' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} gap-5`}>
                    <div>
                        <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2">الفئة</label>
                        <select 
                            value={category} 
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-[#f7f9fc] dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-800 rounded-[1.2rem] p-4 font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer dark:text-white"
                            required
                        >
                            <option value="">اختر الفئة...</option>
                            {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {type !== 'expense' && (
                        <div>
                            <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2">الحالة</label>
                            <select 
                                value={status} 
                                onChange={e => setStatus(e.target.value)}
                                className="w-full bg-[#f7f9fc] dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-800 rounded-[1.2rem] p-4 font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all cursor-pointer dark:text-white"
                            >
                                <option value="غير مدفوع">غير مدفوع بعد</option>
                                <option value="مدفوع">مدفوع بالكامل</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className={`grid grid-cols-1 ${type === 'expense' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-5`}>
                    <div>
                        <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2">التاريخ والوقت</label>
                        <input 
                            type="datetime-local" 
                            value={date} 
                            onChange={e => setDate(e.target.value)}
                            className="w-full bg-[#f7f9fc] dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-800 rounded-[1.2rem] p-4 font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
                            required
                        />
                    </div>
                    
                    {/* Image field ONLY for expenses */}
                    {type === 'expense' && (
                        <div className="relative">
                            <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2 text-right">صورة الفاتورة</label>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    {!showImageOptions ? (
                                        <button 
                                            type="button"
                                            onClick={() => setShowImageOptions(true)}
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-center justify-center gap-3 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-[#0077b6] shadow-sm font-black"
                                        >
                                            <i className="fas fa-paperclip text-lg"></i>
                                            <span>إرفاق صورة</span>
                                        </button>
                                    ) : (
                                        <div className="flex gap-2 animate-scale-in">
                                            <button 
                                                type="button"
                                                onClick={() => cameraInputRef.current?.click()}
                                                className="flex-1 bg-teal-500 text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-teal-600 transition-all shadow-md"
                                            >
                                                <i className="fas fa-camera text-lg"></i>
                                                <span className="text-[10px] font-black">كاميرا</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => galleryInputRef.current?.click()}
                                                className="flex-1 bg-[#0077b6] text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-[#005f92] transition-all shadow-md"
                                            >
                                                <i className="fas fa-images text-lg"></i>
                                                <span className="text-[10px] font-black">معرض</span>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setShowImageOptions(false)}
                                                className="bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl px-3 flex items-center justify-center"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {imageUrl && (
                                    <div className="w-14 h-14 rounded-xl overflow-hidden relative group border border-zinc-200 dark:border-zinc-700 shrink-0">
                                        <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => setImageUrl('')}
                                            className="absolute inset-0 bg-rose-500/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <i className="fas fa-trash-alt text-xs"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" className="hidden" />
                            <input type="file" ref={galleryInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-[11px] font-black text-zinc-400 mb-2 uppercase pr-2">ملاحظات إضافية</label>
                    <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)}
                        placeholder="أدخل أي ملاحظات هنا..."
                        rows={2}
                        className="w-full bg-[#f7f9fc] dark:bg-[#1f1f1f] border border-zinc-200 dark:border-zinc-800 rounded-[1.2rem] p-5 font-medium focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none shadow-inner text-right dark:text-white"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-6">
                <button 
                    type="submit" 
                    className="flex-[2] text-white py-5 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all text-xl flex items-center justify-center gap-3"
                    style={{ backgroundColor: color }}
                >
                    <i className="fas fa-save"></i>
                    <span>{initialData ? 'تحديث المعاملة' : 'حفظ البيانات'}</span>
                </button>
                <button 
                    type="button" 
                    onClick={onCancel}
                    className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-[1.5rem] font-extrabold text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
                >
                    إلغاء
                </button>
            </div>
        </form>
    );
};
