
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType } from '../types.ts';
import { TransactionForm } from './TransactionForm.tsx';
import { HistoryList } from './HistoryList.tsx';
import { BRAND, CATEGORIES } from '../constants.ts';
import { formatCurrency, formatDate } from '../utils.ts';

interface Props {
    type: TransactionType;
    transactions: Transaction[];
    currency: any;
    balanceHidden: boolean;
    onSubmit: (t: Transaction) => void;
    onDelete: (id: string) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type QuickDateRange = 'all' | 'today' | 'week' | 'month';

export const SectionView: React.FC<Props> = ({ type, transactions, currency, balanceHidden, onSubmit, onDelete }) => {
    const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [showInvoiceFullscreen, setShowInvoiceFullscreen] = useState(false);
    const [formKey, setFormKey] = useState(Date.now());

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [quickDate, setQuickDate] = useState<QuickDateRange>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    useEffect(() => {
        setEditingTransaction(null);
        setViewingTransaction(null);
        setConfirmDeleteId(null);
        setFormKey(Date.now());
        resetFilters();
    }, [type]);

    const resetFilters = () => {
        setSearchTerm('');
        setFilterCategory('الكل');
        setQuickDate('all');
        setStartDate('');
        setEndDate('');
        setSortBy('date-desc');
    };

    const title = type === 'expense' ? 'المصروفات' : type === 'right' ? 'الحقوق لك' : 'الالتزامات';
    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;
    
    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter(t => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = t.category.toLowerCase().includes(searchLower) || 
                                 t.description.toLowerCase().includes(searchLower) ||
                                 t.amount.toString().includes(searchTerm);
            
            const matchesCategory = filterCategory === 'الكل' || t.category === filterCategory;
            
            let matchesDate = true;
            const tDate = new Date(t.date);
            const now = new Date();

            if (quickDate === 'today') {
                matchesDate = tDate.toDateString() === now.toDateString();
            } else if (quickDate === 'week') {
                const weekAgo = new Date();
                weekAgo.setDate(now.getDate() - 7);
                matchesDate = tDate >= weekAgo;
            } else if (quickDate === 'month') {
                matchesDate = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            }

            if (startDate) matchesDate = matchesDate && tDate >= new Date(startDate);
            if (endDate) {
                const e = new Date(endDate);
                e.setHours(23, 59, 59);
                matchesDate = matchesDate && tDate <= e;
            }

            return matchesSearch && matchesCategory && matchesDate;
        });

        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                default: return 0;
            }
        });

        return result;
    }, [transactions, searchTerm, filterCategory, quickDate, startDate, endDate, sortBy]);

    const filteredTotal = filteredTransactions.reduce((s, t) => s + t.amount, 0);

    const handleFormSubmit = (t: Transaction) => {
        onSubmit(t);
        setEditingTransaction(null);
        setFormKey(Date.now());
    };

    const handleEdit = (t: Transaction) => {
        setViewingTransaction(null);
        setShowHistoryOverlay(false);
        setEditingTransaction(t);
        setFormKey(Date.now());
    };

    return (
        <div className="space-y-6 animate-fade-in relative max-w-4xl mx-auto pb-10">
            {/* بطاقة الإجمالي */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-[2.5rem] p-7 shadow-xl border-r-[12px] flex justify-between items-center border-zinc-100 dark:border-zinc-800" style={{ borderRightColor: color }}>
                <div>
                    <h2 className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black mb-1 uppercase tracking-widest">إجمالي {title}</h2>
                    <p className="text-4xl font-black" style={{ color }}>
                        {balanceHidden ? '••••••' : formatCurrency(total, currency)}
                    </p>
                </div>
                <button 
                    onClick={() => setShowHistoryOverlay(true)}
                    className="w-16 h-16 rounded-[1.8rem] bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[#0077b6] shadow-sm active-scale transition-all border border-zinc-100 dark:border-zinc-700"
                >
                    <i className="fas fa-receipt text-2xl"></i>
                </button>
            </div>

            {/* نموذج الإدخال الرئيسي */}
            <div className="animate-slide-down">
                <TransactionForm 
                    key={formKey}
                    type={type} 
                    initialData={editingTransaction || undefined}
                    onSubmit={handleFormSubmit} 
                    onCancel={() => {
                        setEditingTransaction(null);
                        setFormKey(Date.now());
                    }} 
                />
            </div>

            {/* زر فتح واجهة السجل المستقلة */}
            <div className="pt-4">
                <button 
                    onClick={() => setShowHistoryOverlay(true)}
                    className="w-full bg-white dark:bg-[#1e1e1e] text-zinc-600 dark:text-zinc-300 p-6 rounded-[2.2rem] shadow-lg border border-zinc-100 dark:border-zinc-800 flex items-center justify-between font-bold active-scale transition-all"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-[#252525] flex items-center justify-center text-[#0077b6]">
                            <i className="fas fa-list-ul text-xl"></i>
                        </div>
                        <div className="text-right">
                            <span className="block text-sm">عرض سجل {title}</span>
                            <span className="block text-[10px] text-zinc-400 font-medium">لديك {transactions.length} معاملات مسجلة</span>
                        </div>
                    </div>
                    <i className="fas fa-chevron-left text-zinc-300"></i>
                </button>
            </div>

            {/* صفحة السجل المنبثقة المستقلة بالكامل */}
            {showHistoryOverlay && (
                <div className="fixed inset-0 z-[1000] bg-[#f7f9fc] dark:bg-[#121212] animate-slide-up flex flex-col overflow-hidden">
                    {/* هيدر الصفحة المستقلة */}
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 flex justify-between items-center shadow-lg border-b dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setShowHistoryOverlay(false)}
                                className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-500 flex items-center justify-center active-scale shadow-sm"
                            >
                                <i className="fas fa-arrow-right"></i>
                            </button>
                            <div>
                                <h3 className="text-xl font-black dark:text-white leading-none">سجل {title}</h3>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">تصفية وبحث متقدم</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-left bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-2xl border dark:border-zinc-700">
                                <span className="block text-[8px] font-black text-zinc-400 uppercase leading-none">الإجمالي المعروض</span>
                                <span className="text-sm font-black" style={{ color }}>{balanceHidden ? '••••' : formatCurrency(filteredTotal, currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* منطقة البحث والفلترة */}
                    <div className="p-4 bg-white dark:bg-[#1e1e1e] shadow-sm shrink-0">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400"></i>
                                <input 
                                    type="text" 
                                    placeholder="ابحث هنا..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-[#f7f9fc] dark:bg-[#252525] border-none rounded-[1.5rem] py-4 pr-12 pl-6 font-bold text-sm focus:ring-4 ring-[#0077b6]/10 outline-none transition-all dark:text-white"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-rose-500"><i className="fas fa-times-circle"></i></button>
                                )}
                            </div>
                            <button 
                                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                                className={`px-5 rounded-[1.5rem] flex items-center justify-center gap-2 font-black text-xs transition-all ${isFilterPanelOpen ? 'bg-[#0077b6] text-white shadow-xl shadow-blue-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                            >
                                <i className="fas fa-sliders-h"></i>
                                <span>فلترة</span>
                            </button>
                        </div>

                        {/* لوحة الخيارات المتقدمة */}
                        {isFilterPanelOpen && (
                            <div className="mt-4 p-5 bg-zinc-50 dark:bg-[#252525] rounded-[2rem] border border-zinc-200 dark:border-zinc-800 animate-slide-down space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pr-2">ترتيب البيانات</label>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="الأحدث" active={sortBy === 'date-desc'} onClick={() => setSortBy('date-desc')} />
                                        <FilterChip label="الأقدم" active={sortBy === 'date-asc'} onClick={() => setSortBy('date-asc')} />
                                        <FilterChip label="الأعلى مبلغا" active={sortBy === 'amount-desc'} onClick={() => setSortBy('amount-desc')} />
                                        <FilterChip label="الأقل مبلغا" active={sortBy === 'amount-asc'} onClick={() => setSortBy('amount-asc')} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pr-2">نطاق زمني سريع</label>
                                    <div className="flex flex-wrap gap-2">
                                        <FilterChip label="الكل" active={quickDate === 'all'} onClick={() => setQuickDate('all')} />
                                        <FilterChip label="اليوم" active={quickDate === 'today'} onClick={() => setQuickDate('today')} />
                                        <FilterChip label="هذا الأسبوع" active={quickDate === 'week'} onClick={() => setQuickDate('week')} />
                                        <FilterChip label="هذا الشهر" active={quickDate === 'month'} onClick={() => setQuickDate('month')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">من تاريخ</label>
                                        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setQuickDate('all'); }} className="w-full bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border-none font-bold text-xs dark:text-white shadow-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">إلى تاريخ</label>
                                        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setQuickDate('all'); }} className="w-full bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border-none font-bold text-xs dark:text-white shadow-sm" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pr-2">الفئات</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                        <FilterChip label="الكل" active={filterCategory === 'الكل'} onClick={() => setFilterCategory('الكل')} />
                                        {CATEGORIES[type].map(cat => (
                                            <FilterChip key={cat} label={cat} active={filterCategory === cat} onClick={() => setFilterCategory(cat)} />
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    onClick={resetFilters} 
                                    className="w-full py-4 text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-900/10 rounded-2xl uppercase tracking-[0.2em] border border-rose-100 dark:border-rose-800"
                                >
                                    إعادة ضبط الفلاتر
                                </button>
                            </div>
                        )}
                    </div>

                    {/* قائمة السجل داخل الصفحة المنبثقة */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-zinc-50/50 dark:bg-black/20">
                        <HistoryList 
                            transactions={filteredTransactions} 
                            balanceHidden={balanceHidden}
                            onDelete={id => setConfirmDeleteId(id)} 
                            onSelect={setViewingTransaction} 
                            currency={currency} 
                        />
                        {/* مساحة فارغة في الأسفل لضمان وضوح العناصر الأخيرة */}
                        <div className="h-20"></div>
                    </div>
                </div>
            )}

            {/* عرض تفاصيل المعاملة */}
            {viewingTransaction && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/85 backdrop-blur-md animate-fade-in" onClick={() => setViewingTransaction(null)}></div>
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl relative animate-scale-in flex flex-col max-h-[90vh]">
                        <div className="p-7 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#252525] shrink-0">
                            <h3 className="text-lg font-black dark:text-white">تفاصيل العملية</h3>
                            <button onClick={() => setViewingTransaction(null)} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 active-scale"><i className="fas fa-times text-xl"></i></button>
                        </div>
                        
                        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar text-right">
                            <div className="text-center space-y-3">
                                <div className="inline-block px-6 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest">{viewingTransaction.category}</div>
                                <p className="text-5xl font-black" style={{ color }}>{balanceHidden ? '••••••' : formatCurrency(viewingTransaction.amount, currency)}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <DetailBox icon="fa-calendar-alt" label="تاريخ المعاملة" value={formatDate(viewingTransaction.date)} />
                                <DetailBox icon="fa-info-circle" label="حالة المعاملة" value={viewingTransaction.status || 'مكتملة'} />
                                {viewingTransaction.description && <DetailBox icon="fa-quote-right" label="الملاحظات" value={viewingTransaction.description} />}
                            </div>

                            {viewingTransaction.imageUrl && (
                                <div className="relative group cursor-pointer" onClick={() => setShowInvoiceFullscreen(true)}>
                                    <img src={viewingTransaction.imageUrl} alt="Invoice" className="w-full h-48 object-cover rounded-[2rem] border-4 border-zinc-50 dark:border-zinc-800 shadow-sm" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                                        <i className="fas fa-expand text-white text-3xl"></i>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 shrink-0">
                                <button onClick={() => handleEdit(viewingTransaction)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 dark:text-white py-5 rounded-[1.5rem] font-black active-scale transition-all border dark:border-zinc-700">تعديل</button>
                                <button onClick={() => { setConfirmDeleteId(viewingTransaction.id); setViewingTransaction(null); }} className="flex-1 bg-rose-500 text-white py-5 rounded-[1.5rem] font-black shadow-lg shadow-rose-500/20 active-scale transition-all">حذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* تأكيد الحذف النهائي */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-fade-in" onClick={() => setConfirmDeleteId(null)}></div>
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative animate-scale-in text-center">
                        <div className="w-24 h-24 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8"><i className="fas fa-trash-alt text-4xl"></i></div>
                        <h3 className="text-2xl font-black mb-3 dark:text-white">هل أنت متأكد؟</h3>
                        <p className="text-zinc-400 text-sm mb-10 font-bold">لا يمكن التراجع عن حذف هذه المعاملة بعد تنفيذ هذه الخطوة.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="w-full bg-rose-500 text-white py-5 rounded-2xl font-black active-scale shadow-xl shadow-rose-500/30">تأكيد الحذف</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-4 rounded-2xl font-bold active-scale">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* صورة الفاتورة ملء الشاشة */}
            {showInvoiceFullscreen && viewingTransaction?.imageUrl && (
                <div className="fixed inset-0 z-[1300] bg-black/98 flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button onClick={() => setShowInvoiceFullscreen(false)} className="absolute top-10 right-10 text-white/50 hover:text-white text-4xl active-scale"><i className="fas fa-times"></i></button>
                    <img src={viewingTransaction.imageUrl} alt="Full Invoice" className="max-w-full max-h-[85vh] rounded-[2rem] animate-scale-in shadow-2xl object-contain" />
                </div>
            )}
        </div>
    );
};

const FilterChip: React.FC<{ label: string, active: boolean, onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-2.5 rounded-full font-black text-[11px] transition-all whitespace-nowrap active-scale shadow-sm border ${active ? 'bg-[#0077b6] text-white border-[#0077b6]' : 'bg-white dark:bg-zinc-800 text-zinc-400 border-zinc-100 dark:border-zinc-700 hover:border-[#0077b6]/30'}`}
    >
        {label}
    </button>
);

const DetailBox: React.FC<{ icon: string, label: string, value: string }> = ({ icon, label, value }) => (
    <div className="p-5 bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] flex gap-5 items-center border border-zinc-100 dark:border-zinc-800">
        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-[#0077b6] shadow-sm shrink-0"><i className={`fas ${icon} text-lg`}></i></div>
        <div className="flex-1">
            <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{label}</span>
            <span className="block font-bold dark:text-white text-sm">{value}</span>
        </div>
    </div>
);
