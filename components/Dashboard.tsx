
import React, { useState } from 'react';
import { AppState, BalanceChange } from '../types.ts';
import { formatCurrency, formatDate } from '../utils.ts';
import { BRAND } from '../constants.ts';

interface DashboardProps {
    state: AppState;
    onDeposit: (amount: number, desc: string) => void;
    onWithdraw: (amount: number, desc: string) => void;
    onToggleVisibility: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onDeposit, onWithdraw, onToggleVisibility }) => {
    const [actionModal, setActionModal] = useState<'deposit' | 'withdraw' | null>(null);
    const [amt, setAmt] = useState('');
    const [desc, setDesc] = useState('');
    const [showLog, setShowLog] = useState(false);

    const totalExpenses = state.transactions
        .filter(t => t.type === 'expense' || (t.type === 'debt' && t.status === 'مدفوع'))
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalRights = state.transactions
        .filter(t => t.type === 'right' && t.status !== 'مدفوع' && t.status !== 'كامل' && t.status !== 'مدفوع بالكامل')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalDebts = state.transactions
        .filter(t => t.type === 'debt' && t.status !== 'مدفوع')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const handleAction = () => {
        const value = parseFloat(amt);
        if (isNaN(value) || value <= 0) return;
        if (actionModal === 'deposit') onDeposit(value, desc || 'إيداع يدوي');
        else if (actionModal === 'withdraw') onWithdraw(value, desc || 'سحب يدوي');
        setActionModal(null);
        setAmt('');
        setDesc('');
    };

    const displayValue = (val: number) => state.balanceHidden ? '••••••' : formatCurrency(val, state.currency);

    return (
        <div className="space-y-6 p-4 animate-fade-in">
            {/* Legacy Style Balance Display */}
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 shadow-xl text-center border-b-2 border-zinc-100 dark:border-zinc-800 flex flex-col items-center relative group">
                <h2 className="text-zinc-400 dark:text-zinc-500 text-sm font-bold mb-2 uppercase tracking-widest">الرصيد النقدي الحالي</h2>
                <div className="flex items-center justify-center gap-4 relative">
                    <p className="text-4xl md:text-5xl font-black transition-all duration-300" style={{ color: BRAND.primary }}>
                        {displayValue(state.balance)}
                    </p>
                    <button 
                        onClick={onToggleVisibility}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-[#0077b6] transition-all active:scale-90 shadow-sm"
                        title={state.balanceHidden ? "إظهار المبالغ" : "إخفاء المبالغ"}
                    >
                        <i className={`fas ${state.balanceHidden ? 'fa-eye' : 'fa-eye-slash'} text-lg`}></i>
                    </button>
                </div>
                
                <div className="flex gap-4 mt-8 w-full max-w-sm">
                    <button 
                        onClick={() => setActionModal('deposit')}
                        className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all shadow-md active-scale"
                    >
                        <i className="fas fa-plus-circle text-xl"></i>
                        <span className="text-xs">إيداع</span>
                    </button>
                    <button 
                        onClick={() => setActionModal('withdraw')}
                        className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-4 rounded-2xl font-bold flex flex-col items-center gap-1 transition-all shadow-md active-scale"
                    >
                        <i className="fas fa-minus-circle text-xl"></i>
                        <span className="text-xs">سحب</span>
                    </button>
                </div>

                <button 
                    onClick={() => setShowLog(!showLog)}
                    className="mt-6 text-zinc-500 dark:text-zinc-400 text-xs font-bold underline decoration-dotted"
                >
                    <i className="fas fa-history ml-1"></i> سجل حركات الرصيد
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="المصروفات" value={totalExpenses} hidden={state.balanceHidden} currency={state.currency} color={BRAND.danger} icon="fa-shopping-cart" />
                <StatCard label="الحقوق لك" value={totalRights} hidden={state.balanceHidden} currency={state.currency} color={BRAND.success} icon="fa-hand-holding-usd" />
                <StatCard label="الالتزامات" value={totalDebts} hidden={state.balanceHidden} currency={state.currency} color={BRAND.warning} icon="fa-file-invoice-dollar" />
            </div>

            {/* Balance Log Display */}
            {showLog && (
                <div className="space-y-3 animate-slide-down">
                    <h3 className="font-bold text-sm text-zinc-500 dark:text-zinc-400 pr-2">آخر حركات الرصيد</h3>
                    <div className="space-y-2">
                        {state.balanceHistory.map(h => (
                            <div key={h.id} className="bg-white dark:bg-[#1e1e1e] p-3 rounded-xl shadow-sm flex justify-between items-center border-r-4" style={{ borderRightColor: h.type === 'deposit' || h.type === 'right_collection' ? '#2a9d8f' : '#ef476f' }}>
                                <div>
                                    <p className="text-xs font-bold dark:text-white">{h.description}</p>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(h.date)}</p>
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-black ${h.type === 'deposit' || h.type === 'right_collection' ? 'text-teal-600' : 'text-rose-600'}`}>
                                        {h.type === 'deposit' || h.type === 'right_collection' ? '+' : '-'}{state.balanceHidden ? '••••' : formatCurrency(h.amount, state.currency)}
                                    </p>
                                    <p className="text-[9px] text-zinc-400">الرصيد بعد: {state.balanceHidden ? '••••' : formatCurrency(h.balanceAfter, state.currency)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Modals */}
            {actionModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActionModal(null)}></div>
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-sm rounded-3xl overflow-hidden shadow-2xl relative animate-slide-up">
                        <div className="p-6 bg-[#0077b6] text-white flex justify-between items-center">
                            <h3 className="font-bold">{actionModal === 'deposit' ? 'إيداع رصيد جديد' : 'سحب/تحويل رصيد'}</h3>
                            <button onClick={() => setActionModal(null)} className="active-scale p-1"><i className="fas fa-times"></i></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <input 
                                type="number" 
                                value={amt} 
                                onChange={e => setAmt(e.target.value)}
                                placeholder="المبلغ" 
                                className="w-full bg-zinc-50 dark:bg-[#2a2a2a] p-4 rounded-2xl font-bold focus:ring-2 ring-blue-500/10 outline-none border-none dark:text-white" 
                            />
                            <input 
                                type="text" 
                                value={desc} 
                                onChange={e => setDesc(e.target.value)}
                                placeholder="وصف العملية (اختياري)" 
                                className="w-full bg-zinc-50 dark:bg-[#2a2a2a] p-4 rounded-2xl text-sm focus:ring-2 ring-blue-500/10 outline-none border-none dark:text-white" 
                            />
                            <button 
                                onClick={handleAction}
                                className="w-full bg-[#0077b6] text-white py-4 rounded-2xl font-bold shadow-lg active-scale transition-all"
                            >
                                تنفيذ العملية
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{ label: string, value: number, hidden: boolean, currency: any, color: string, icon: string }> = ({ label, value, hidden, currency, color, icon }) => (
    <div className="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl shadow-sm border-t-4 transition-all hover:scale-[1.02] border-zinc-50 dark:border-zinc-800" style={{ borderTopColor: color }}>
        <div className="flex items-center justify-between mb-2">
            <i className={`fas ${icon} opacity-50`} style={{ color }}></i>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">{label}</span>
        </div>
        <p className="text-xl font-extrabold" style={{ color }}>
            {hidden ? '••••••' : formatCurrency(value, currency)}
        </p>
    </div>
);
