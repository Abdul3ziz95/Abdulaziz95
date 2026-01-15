
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES ---
type TransactionType = 'expense' | 'right' | 'debt';

interface Transaction {
    id: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
    status?: string;
    imageUrl?: string;
}

interface BalanceChange {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'deposit' | 'withdraw' | 'expense' | 'right_collection' | 'debt_payment';
    balanceAfter: number;
}

interface AppState {
    transactions: Transaction[];
    balance: number;
    balanceHistory: BalanceChange[];
    currency: { code: string; symbol: string; name: string };
    darkMode: boolean;
    balanceHidden: boolean;
}

// --- CONSTANTS ---
const BRAND = { primary: '#0077b6', secondary: '#48cae4', danger: '#ef476f', success: '#2a9d8f', warning: '#fbc02d' };
const ARABIC_CURRENCIES = [{ code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' }, { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' }, { code: 'USD', symbol: '$', name: 'دولار أمريكي' }];
const CATEGORIES = { expense: ['طعام', 'مواصلات', 'رعاية شخصية', 'تسوق', 'أخرى'], right: ['دين لك', 'بيع بالآجل', 'أخرى'], debt: ['إيجار', 'كهرباء', 'قرض', 'أخرى'] };

// --- UTILS ---
const generateId = (prefix = 'id') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const formatCurrency = (amount: number, currency: any) => `${amount.toLocaleString('ar-SA')} ${currency.symbol}`;
const formatDate = (ds: string) => new Date(ds).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// --- DB SERVICE ---
const DB_NAME = 'BudgetSmartDB';
const saveState = async (state: AppState) => {
    localStorage.setItem(DB_NAME, JSON.stringify(state));
};
const loadState = (): Partial<AppState> | null => {
    const data = localStorage.getItem(DB_NAME);
    return data ? JSON.parse(data) : null;
};

// --- COMPONENTS ---

const Dashboard = ({ state, onDeposit, onWithdraw, onToggleVisibility }: any) => {
    const [modal, setModal] = useState<any>(null);
    const [val, setVal] = useState('');
    const displayValue = (v: number) => state.balanceHidden ? '••••••' : formatCurrency(v, state.currency);

    const stats = {
        expenses: state.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        rights: state.transactions.filter(t => t.type === 'right' && t.status !== 'مدفوع').reduce((s, t) => s + t.amount, 0),
        debts: state.transactions.filter(t => t.type === 'debt' && t.status !== 'مدفوع').reduce((s, t) => s + t.amount, 0),
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e1e1e] rounded-3xl p-8 shadow-xl text-center flex flex-col items-center">
                <h2 className="text-zinc-400 text-xs font-bold mb-2 uppercase tracking-widest">الرصيد النقدي</h2>
                <div className="flex items-center gap-4">
                    <p className="text-4xl font-black" style={{ color: BRAND.primary }}>{displayValue(state.balance)}</p>
                    <button onClick={onToggleVisibility} className="text-zinc-300"><i className={`fas ${state.balanceHidden ? 'fa-eye' : 'fa-eye-slash'}`}></i></button>
                </div>
                <div className="flex gap-4 mt-6 w-full">
                    <button onClick={() => setModal('deposit')} className="flex-1 bg-teal-500 text-white py-3 rounded-xl font-bold active-scale">إيداع</button>
                    <button onClick={() => setModal('withdraw')} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-bold active-scale">سحب</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm border-t-4 border-rose-500">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">المصروفات</p>
                    <p className="text-xl font-black text-rose-500">{state.balanceHidden ? '•••' : formatCurrency(stats.expenses, state.currency)}</p>
                </div>
                <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm border-t-4 border-teal-500">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">الحقوق لك</p>
                    <p className="text-xl font-black text-teal-500">{state.balanceHidden ? '•••' : formatCurrency(stats.rights, state.currency)}</p>
                </div>
                <div className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl shadow-sm border-t-4 border-amber-500">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">الالتزامات</p>
                    <p className="text-xl font-black text-amber-500">{state.balanceHidden ? '•••' : formatCurrency(stats.debts, state.currency)}</p>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                        <h3 className="font-bold mb-4">{modal === 'deposit' ? 'إيداع رصيد' : 'سحب رصيد'}</h3>
                        <input type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="المبلغ" className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl mb-4 outline-none font-bold" />
                        <button onClick={() => { onDeposit(parseFloat(val), modal); setModal(null); setVal(''); }} className="w-full bg-[#0077b6] text-white py-4 rounded-xl font-bold">تأكيد</button>
                        <button onClick={() => setModal(null)} className="w-full mt-2 text-zinc-400 py-2">إلغاء</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionView = ({ type, transactions, currency, balanceHidden, onSubmit, onDelete }: any) => {
    const [showForm, setShowForm] = useState(false);
    const [amt, setAmt] = useState('');
    const [cat, setCat] = useState('');
    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if(!amt || !cat) return;
        onSubmit({ id: generateId(type), type, amount: parseFloat(amt), category: cat, date: new Date().toISOString(), description: '' });
        setShowForm(false); setAmt(''); setCat('');
    };

    return (
        <div className="space-y-4">
            <button onClick={() => setShowForm(true)} className="w-full py-4 rounded-2xl text-white font-bold shadow-lg" style={{ backgroundColor: color }}>
                <i className="fas fa-plus ml-2"></i> إضافة {type === 'expense' ? 'مصروف' : 'معاملة'}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl shadow-xl space-y-4">
                    <input type="number" placeholder="المبلغ" value={amt} onChange={e=>setAmt(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none" required />
                    <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none" required>
                        <option value="">اختر الفئة...</option>
                        {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-[#0077b6] text-white py-3 rounded-xl font-bold">حفظ</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl">إلغاء</button>
                    </div>
                </form>
            )}

            <div className="space-y-2">
                {transactions.map((t: any) => (
                    <div key={t.id} className="bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl flex justify-between items-center shadow-sm border-r-4" style={{ borderRightColor: color }}>
                        <div>
                            <p className="font-bold text-sm">{t.category}</p>
                            <p className="text-[10px] text-zinc-400">{formatDate(t.date)}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-black" style={{ color }}>{balanceHidden ? '•••' : formatCurrency(t.amount, currency)}</p>
                            <button onClick={() => onDelete(t.id)} className="text-zinc-200 hover:text-rose-500"><i className="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- APP ROOT ---

const App = () => {
    const [state, setState] = useState<AppState>({
        transactions: [], balance: 0, balanceHistory: [], currency: ARABIC_CURRENCIES[0], darkMode: false, balanceHidden: false
    });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const saved = loadState();
        if (saved) setState(prev => ({ ...prev, ...saved }));
        // إخفاء شاشة التحميل بعد استقرار الـ State
        setTimeout(() => {
            const ls = document.getElementById('loading-screen');
            if (ls) { ls.style.opacity = '0'; setTimeout(() => ls.remove(), 500); }
        }, 1000);
    }, []);

    useEffect(() => {
        saveState(state);
        document.body.classList.toggle('dark-mode', state.darkMode);
    }, [state]);

    const upsertTransaction = (t: Transaction) => {
        setState(prev => {
            const impact = t.type === 'expense' ? -t.amount : 0; // تبسيط للأغراض التعليمية
            return {
                ...prev,
                transactions: [t, ...prev.transactions],
                balance: prev.balance + impact
            };
        });
    };

    const deleteTransaction = (id: string) => {
        setState(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    };

    const handleManualBalance = (amt: number, type: string) => {
        setState(prev => ({ ...prev, balance: prev.balance + (type === 'deposit' ? amt : -amt) }));
    };

    return (
        <div className="min-h-screen pb-20 transition-colors">
            <header className="bg-[#0077b6] text-white p-5 sticky top-0 z-50 shadow-lg">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button onClick={() => setState(p=>({...p, darkMode: !p.darkMode}))} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <i className={`fas ${state.darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    <h1 className="text-xl font-black">ميزانيتك</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <nav className="bg-white dark:bg-[#1e1e1e] flex border-b dark:border-zinc-800 sticky top-[72px] z-40 max-w-4xl mx-auto">
                {['overview', 'expense', 'right', 'debt'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-4 text-[10px] font-bold uppercase ${activeTab === tab ? 'text-[#0077b6] border-b-4 border-[#0077b6]' : 'text-zinc-400'}`}>
                        {tab === 'overview' ? 'الرئيسية' : tab === 'expense' ? 'مصروفات' : tab === 'right' ? 'حقوق' : 'ديون'}
                    </button>
                ))}
            </nav>

            <main className="p-4 max-w-4xl mx-auto">
                {activeTab === 'overview' && <Dashboard state={state} onDeposit={handleManualBalance} onWithdraw={handleManualBalance} onToggleVisibility={()=>setState(p=>({...p, balanceHidden: !p.balanceHidden}))} />}
                {activeTab !== 'overview' && <SectionView type={activeTab} transactions={state.transactions.filter(t=>t.type===activeTab)} currency={state.currency} balanceHidden={state.balanceHidden} onSubmit={upsertTransaction} onDelete={deleteTransaction} />}
            </main>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
