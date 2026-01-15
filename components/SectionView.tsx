
import React, { useState, useEffect, useMemo } from 'react';
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
    const [formKey, setFormKey] = useState(Date.now());

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [quickDate, setQuickDate] = useState<QuickDateRange>('all');
    const [sortBy, setSortBy] = useState<SortOption>('date-desc');
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

    useEffect(() => {
        if (showHistoryOverlay) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [showHistoryOverlay]);

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
    }, [transactions, searchTerm, filterCategory, quickDate, sortBy]);

    const handleFormSubmit = (t: Transaction) => {
        onSubmit(t);
        setEditingTransaction(null);
        setFormKey(Date.now());
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-10">
            {/* ملخص سريع */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] p-6 shadow-lg border-r-[8px] flex justify-between items-center border-zinc-100 dark:border-zinc-800" style={{ borderRightColor: color }}>
                <div>
                    <h2 className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black mb-1 uppercase tracking-widest">إجمالي {title}</h2>
                    <p className="text-3xl font-black" style={{ color }}>
                        {balanceHidden ? '••••••' : formatCurrency(total, currency)}
                    </p>
                </div>
                <button 
                    onClick={() => setShowHistoryOverlay(true)}
                    className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[#0077b6] shadow-sm active-scale transition-all border border-zinc-100 dark:border-zinc-700"
                >
                    <i className="fas fa-history text-2xl"></i>
                </button>
            </div>

            {/* النموذج */}
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

            {/* زر عرض السجل الكامل */}
            <button 
                onClick={() => setShowHistoryOverlay(true)}
                className="w-full bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center font-bold active-scale transition-all"
            >
                <div className="flex items-center gap-3">
                    <i className="fas fa-list-ul text-[#0077b6]"></i>
                    <span>عرض كافة {title}</span>
                </div>
                <i className="fas fa-chevron-left text-zinc-300"></i>
            </button>

            {/* واجهة السجل المنبثقة */}
            {showHistoryOverlay && (
                <div className="fixed inset-0 z-[1000] bg-[#f7f9fc] dark:bg-[#121212] animate-fade-in flex flex-col overflow-hidden">
                    <div className="bg-white dark:bg-[#1e1e1e] p-6 flex justify-between items-center shadow-md shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowHistoryOverlay(false)} className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 active-scale shadow-sm">
                                <i className="fas fa-arrow-right"></i>
                            </button>
                            <h3 className="text-xl font-black dark:text-white">سجل {title}</h3>
                        </div>
                        <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-sm ${isFilterPanelOpen ? 'bg-[#0077b6] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                            <i className="fas fa-filter"></i>
                            <span>تصفية</span>
                        </button>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#1e1e1e] shrink-0">
                        <div className="relative">
                            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400"></i>
                            <input 
                                type="text" 
                                placeholder="ابحث في المعاملات..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-[#252525] border-none rounded-xl py-4 pr-11 pl-4 font-bold text-sm outline-none dark:text-white"
                            />
                        </div>

                        {isFilterPanelOpen && (
                            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl animate-fade-in space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">النطاق الزمني</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {['all', 'today', 'week', 'month'].map((range) => (
                                            <button 
                                                key={range}
                                                onClick={() => setQuickDate(range as QuickDateRange)}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${quickDate === range ? 'bg-[#0077b6] text-white shadow-md' : 'bg-white dark:bg-zinc-700 text-zinc-400'}`}
                                            >
                                                {range === 'all' ? 'الكل' : range === 'today' ? 'اليوم' : range === 'week' ? 'الأسبوع' : 'الشهر'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-2">ترتيب</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        <button onClick={() => setSortBy('date-desc')} className={`px-4 py-2 rounded-lg text-xs font-bold ${sortBy === 'date-desc' ? 'bg-[#0077b6] text-white' : 'bg-white dark:bg-zinc-700 text-zinc-400'}`}>الأحدث</button>
                                        <button onClick={() => setSortBy('amount-desc')} className={`px-4 py-2 rounded-lg text-xs font-bold ${sortBy === 'amount-desc' ? 'bg-[#0077b6] text-white' : 'bg-white dark:bg-zinc-700 text-zinc-400'}`}>الأعلى مبلغاً</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <HistoryList 
                            transactions={filteredTransactions} 
                            balanceHidden={balanceHidden}
                            onDelete={id => setConfirmDeleteId(id)} 
                            onSelect={t => { setViewingTransaction(t); }} 
                            currency={currency} 
                        />
                        <div className="h-20"></div>
                    </div>
                </div>
            )}

            {/* تفاصيل المعاملة (مودال) */}
            {viewingTransaction && (
                <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingTransaction(null)}></div>
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl relative animate-toast p-8">
                        <div className="text-center mb-6">
                            <span className="text-zinc-400 font-bold text-xs uppercase tracking-widest">{viewingTransaction.category}</span>
                            <h3 className="text-4xl font-black mt-2" style={{ color }}>{balanceHidden ? '••••' : formatCurrency(viewingTransaction.amount, currency)}</h3>
                            <p className="text-zinc-500 text-xs mt-1 font-bold">{formatDate(viewingTransaction.date)}</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl mb-6">
                            <label className="block text-[10px] font-black text-zinc-400 mb-1">الملاحظات</label>
                            <p className="text-sm font-medium dark:text-white leading-relaxed">{viewingTransaction.description || 'لا توجد ملاحظات إضافية'}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setEditingTransaction(viewingTransaction); setViewingTransaction(null); setShowHistoryOverlay(false); }} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-bold dark:text-white">تعديل</button>
                            <button onClick={() => { setConfirmDeleteId(viewingTransaction.id); setViewingTransaction(null); }} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold">حذف</button>
                        </div>
                    </div>
                </div>
            )}

            {/* تأكيد الحذف */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)}></div>
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative text-center">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl"><i className="fas fa-trash-alt"></i></div>
                        <h3 className="text-xl font-bold mb-2 dark:text-white">حذف المعاملة؟</h3>
                        <p className="text-zinc-400 text-sm mb-6">هل أنت متأكد من رغبتك في حذف هذه المعاملة نهائياً؟</p>
                        <div className="flex gap-3">
                            <button onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold">حذف</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl font-bold dark:text-white">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
