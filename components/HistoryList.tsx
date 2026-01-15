
import React from 'react';
import { Transaction } from '../types.ts';
import { formatDate, formatCurrency } from '../utils.ts';
import { BRAND } from '../constants.ts';

interface Props {
    transactions: Transaction[];
    balanceHidden: boolean;
    onDelete: (id: string) => void;
    onSelect: (t: Transaction) => void;
    currency: any;
}

export const HistoryList: React.FC<Props> = ({ transactions, balanceHidden, onDelete, onSelect, currency }) => {
    
    const displayAmount = (amt: number, type: string) => {
        if (balanceHidden) return '••••';
        const sign = type === 'expense' ? '-' : '+';
        return `${sign}${formatCurrency(amt, currency)}`;
    };

    if (transactions.length === 0) {
        return (
            <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-[2.5rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800 opacity-50 flex flex-col items-center">
                <div className="w-20 h-20 bg-zinc-50 dark:bg-[#252525] rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-search-minus text-3xl dark:text-white"></i>
                </div>
                <p className="text-xs font-black uppercase tracking-widest dark:text-white">لم يتم العثور على أي نتائج</p>
                <p className="text-[10px] text-zinc-400 mt-1">جرب تغيير معايير البحث أو الفلترة</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {transactions.map(t => (
                <div 
                    key={t.id} 
                    onClick={() => onSelect(t)}
                    className="bg-white dark:bg-[#1e1e1e] p-5 rounded-[2rem] shadow-sm border-r-[6px] flex items-center justify-between group transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer active:scale-[0.98] border-zinc-50 dark:border-zinc-800"
                    style={{ borderRightColor: t.type === 'expense' ? BRAND.danger : t.type === 'right' ? BRAND.success : BRAND.warning }}
                >
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${t.type === 'expense' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : t.type === 'right' ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                            <i className={`fas ${t.type === 'expense' ? 'fa-shopping-cart' : t.type === 'right' ? 'fa-handshake' : 'fa-file-invoice-dollar'} text-xl`}></i>
                        </div>
                        <div className="text-right">
                            <h4 className="font-extrabold text-[#333] dark:text-[#e0e0e0] text-sm mb-0.5">{t.category}</h4>
                            <div className="flex items-center gap-2">
                                <p className="text-[9px] text-zinc-400 font-bold">{formatDate(t.date)}</p>
                                {t.description && (
                                    <>
                                        <span className="text-zinc-200 dark:text-zinc-700 text-[10px]">|</span>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 max-w-[120px]">{t.description}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-left">
                            <p className="font-black text-sm" style={{ color: t.type === 'expense' ? BRAND.danger : t.type === 'right' ? BRAND.success : BRAND.warning }}>
                                {displayAmount(t.amount, t.type)}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(t.id);
                            }}
                            className="w-10 h-10 flex items-center justify-center text-zinc-200 hover:text-rose-500 transition-all rounded-xl active:scale-90"
                            title="حذف سريع"
                        >
                            <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
