
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom/client';

// --- Types & Constants ---
type TransactionType = 'expense' | 'right' | 'debt';

interface Transaction {
    id: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
    status: string;
    imageUrl?: string;
}

const BRAND = { 
    primary: '#0077b6', 
    danger: '#ef476f', 
    success: '#2a9d8f', 
    warning: '#fbc02d',
    neutral: '#64748b'
};

const CATEGORIES = {
    expense: ['طعام', 'مواصلات', 'سكن', 'اتصالات', 'صحة', 'ترفيه', 'تسوق', 'تعليم', 'صيانة', 'أخرى'],
    right: ['دين شخصي', 'بيع بالآجل', 'سلفة', 'أخرى'],
    debt: ['إيجار', 'كهرباء/ماء', 'إنترنت', 'قرض', 'قسط', 'فاتورة', 'أخرى']
};

// --- Utilities ---
const genId = (p = 'tx') => `${p}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const fmtCurr = (n: number, s = 'ر.س') => `${Number(n).toLocaleString('ar-SA')} ${s}`;
const fmtDate = (d: string) => new Date(d).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// --- Components ---

const Sidebar = ({ isOpen, onClose, darkMode, onToggleDark, onClear }: any) => (
    <div className={`fixed inset-0 z-[200] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <aside className={`absolute top-0 right-0 w-80 h-full bg-white dark:bg-[#1e293b] shadow-2xl sidebar-transition transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-400 ease-in-out`}>
            <div className="p-8 bg-[#0077b6] text-white flex justify-between items-center rounded-bl-[3rem]">
                <div>
                    <h2 className="text-xl font-black">الإعدادات</h2>
                    <p className="text-[10px] opacity-70">النسخة الفاخرة المكتملة</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active-scale hover:bg-white/20">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div onClick={onToggleDark} className="flex items-center justify-between p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer active-scale transition-all border border-transparent hover:border-[#0077b6]/30">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-500'}`}>
                            <i className={`fas ${darkMode ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
                        </div>
                        <span className="font-black text-sm dark:text-white">الوضع الليلي</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                </div>
                
                <hr className="border-zinc-100 dark:border-zinc-700" />
                
                <button onClick={onClear} className="w-full flex items-center gap-4 p-5 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-black active-scale transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">
                        <i className="fas fa-trash-alt text-lg"></i>
                    </div>
                    <span>تصفير كافة البيانات</span>
                </button>
            </div>
            <div className="absolute bottom-8 w-full px-8 text-center">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">ميزانيتك الذكية © 2025</p>
            </div>
        </aside>
    </div>
);

const TransactionForm = ({ type, onSubmit, initialData, onCancel }: any) => {
    const [amt, setAmt] = useState(initialData?.amount || '');
    const [cat, setCat] = useState(initialData?.category || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    const [status, setStatus] = useState(initialData?.status || 'غير مدفوع');
    const [img, setImg] = useState(initialData?.imageUrl || '');
    const fileRef = useRef<HTMLInputElement>(null);

    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;

    const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            const r = new FileReader();
            r.onload = () => setImg(r.result as string);
            r.readAsDataURL(f);
        }
    };

    return (
        <form onSubmit={e => {
            e.preventDefault();
            onSubmit({ 
                id: initialData?.id || genId(type), 
                type, 
                amount: parseFloat(amt), 
                category: cat, 
                description: desc, 
                date: new Date(date).toISOString(), 
                status, 
                imageUrl: img 
            });
            if(!initialData) { setAmt(''); setCat(''); setDesc(''); setImg(''); }
        }} className="bg-white dark:bg-[#1e293b] p-8 rounded-card shadow-luxe space-y-5 animate-slide-up border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xl font-black text-center" style={{ color }}>
                {initialData ? 'تعديل المعاملة' : `إضافة ${type === 'expense' ? 'مصروف جديد' : type === 'right' ? 'حق جديد' : 'التزام جديد'}`}
            </h3>
            
            <div className="space-y-4">
                <input 
                    type="number" step="any" value={amt} 
                    onChange={e=>setAmt(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl text-4xl font-black text-center outline-none border-2 border-transparent focus:border-[#0077b6] transition-all dark:text-white" 
                    required autoFocus 
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">الفئة</label>
                        <select 
                            value={cat} onChange={e=>setCat(e.target.value)} 
                            className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-[#0077b6]/30 dark:text-white" 
                            required
                        >
                            <option value="">الفئة...</option>
                            {CATEGORIES[type as keyof typeof CATEGORIES].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">الحالة</label>
                        <select 
                            value={status} onChange={e=>setStatus(e.target.value)} 
                            className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-[#0077b6]/30 dark:text-white" 
                            disabled={type === 'expense'}
                        >
                            <option value="غير مدفوع">غير مدفوع</option>
                            <option value="مدفوع">مدفوع بالكامل</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">التاريخ</label>
                    <input 
                        type="datetime-local" value={date} 
                        onChange={e=>setDate(e.target.value)} 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none border border-transparent focus:border-[#0077b6]/30 dark:text-white" 
                        required 
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase pr-2">ملاحظات</label>
                    <textarea 
                        value={desc} onChange={e=>setDesc(e.target.value)} 
                        placeholder="وصف إضافي..." 
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none h-20 resize-none dark:text-white border border-transparent focus:border-[#0077b6]/30"
                    ></textarea>
                </div>

                {type === 'expense' && (
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-600 transition-all hover:border-[#0077b6]/50">
                        <button type="button" onClick={() => fileRef.current?.click()} className="w-12 h-12 rounded-xl bg-[#0077b6] text-white flex items-center justify-center active-scale shadow-md">
                            <i className="fas fa-camera text-xl"></i>
                        </button>
                        <div className="flex-1">
                            <p className="text-xs font-black dark:text-zinc-200">{img ? 'تم التقاط الصورة' : 'إرفاق صورة الفاتورة'}</p>
                            <p className="text-[9px] text-zinc-400">للتوثيق والمراجعة</p>
                        </div>
                        {img && (
                            <div className="relative group">
                                <img src={img} className="w-12 h-12 rounded-lg object-cover border-2 border-white shadow-sm" />
                                <button type="button" onClick={()=>setImg('')} className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                        <input type="file" ref={fileRef} onChange={handleImg} accept="image/*" capture="environment" className="hidden" />
                    </div>
                )}
            </div>

            <div className="flex gap-4 pt-2">
                <button type="submit" className="flex-[2] text-white py-5 rounded-2xl font-black shadow-lg active-scale transition-all flex items-center justify-center gap-3" style={{ backgroundColor: color }}>
                    <i className="fas fa-check-circle text-xl"></i>
                    <span>{initialData ? 'تحديث البيانات' : 'حفظ المعاملة'}</span>
                </button>
                {initialData && (
                    <button type="button" onClick={onCancel} className="flex-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-400 rounded-2xl font-bold">إلغاء</button>
                )}
            </div>
        </form>
    );
};

const HistoryItem = ({ t, onDelete, onEdit, hidden }: any) => {
    const color = t.type === 'expense' ? BRAND.danger : t.type === 'right' ? BRAND.success : BRAND.warning;

    return (
        <div className="transaction-card bg-white dark:bg-[#1e293b] p-5 rounded-card flex justify-between items-center shadow-sm border-r-8 relative overflow-hidden transition-all hover:scale-[1.01]" style={{ borderRightColor: color }}>
            <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '15', color }}>
                    <i className={`fas ${t.type === 'expense' ? 'fa-shopping-basket' : t.type === 'right' ? 'fa-handshake' : 'fa-file-invoice-dollar'} text-2xl`}></i>
                </div>
                <div>
                    <p className="font-black text-base dark:text-white">{t.category}</p>
                    <p className="text-[10px] text-zinc-400 font-bold">{fmtDate(t.date)}</p>
                    {t.description && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">{t.description}</p>}
                </div>
            </div>
            <div className="flex items-center gap-6 relative z-10">
                <div className="text-left">
                    <p className="font-black text-xl" style={{ color }}>{hidden ? '••••' : fmtCurr(t.amount)}</p>
                    {t.status === 'مدفوع' && <span className="text-[9px] bg-teal-500/10 text-teal-600 px-2 py-1 rounded-full font-black uppercase tracking-tighter">مدفوع</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <button onClick={() => onEdit(t)} className="text-zinc-200 hover:text-blue-500 transition-colors active-scale p-1"><i className="fas fa-edit"></i></button>
                    <button onClick={() => onDelete(t.id)} className="text-zinc-200 hover:text-rose-500 transition-colors active-scale p-1"><i className="fas fa-trash-alt"></i></button>
                </div>
            </div>
            {t.imageUrl && <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none"><i className="fas fa-camera text-4xl -rotate-12 translate-y-2 translate-x-2"></i></div>}
        </div>
    );
};

// --- App Root ---

const App = () => {
    const [state, setState] = useState({ transactions: [] as Transaction[], balance: 0, balanceHidden: false, darkMode: false });
    const [activeTab, setActiveTab] = useState<'overview' | TransactionType>('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

    useEffect(() => {
        const saved = localStorage.getItem('LuxeBudget_Master_v3');
        if (saved) setState(JSON.parse(saved));
        
        // Remove loader
        const ls = document.getElementById('loading-screen');
        if(ls) {
            ls.style.opacity = '0';
            setTimeout(() => ls.remove(), 500);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('LuxeBudget_Master_v3', JSON.stringify(state));
        document.body.classList.toggle('dark-mode', state.darkMode);
    }, [state]);

    const handleTransaction = (t: Transaction) => {
        setState(prev => {
            let newTx = [...prev.transactions];
            let oldIdx = newTx.findIndex(x => x.id === t.id);
            let balAdj = 0;

            if (oldIdx !== -1) {
                const old = newTx[oldIdx];
                // Reverse old impact
                balAdj += old.type === 'expense' || (old.type === 'debt' && old.status === 'مدفوع') ? old.amount : (old.type === 'right' && old.status === 'مدفوع' ? -old.amount : 0);
                newTx.splice(oldIdx, 1);
            }

            // Apply new impact
            balAdj += t.type === 'expense' || (t.type === 'debt' && t.status === 'مدفوع') ? -t.amount : (t.type === 'right' && t.status === 'مدفوع' ? t.amount : 0);
            
            return { ...prev, transactions: [t, ...newTx], balance: prev.balance + balAdj };
        });
        setEditingTx(null);
    };

    const deleteTx = (id: string) => {
        if(!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
        setState(prev => {
            const t = prev.transactions.find(x => x.id === id);
            let adj = 0;
            if(t) adj = t.type === 'expense' || (t.type === 'debt' && t.status === 'مدفوع') ? t.amount : (t.type === 'right' && t.status === 'مدفوع' ? -t.amount : 0);
            return { ...prev, transactions: prev.transactions.filter(x => x.id !== id), balance: prev.balance + adj };
        });
    };

    const stats = useMemo(() => {
        const t = state.transactions;
        return {
            exp: t.filter(x=>x.type==='expense').reduce((s,x)=>s+x.amount,0),
            rights: t.filter(x=>x.type==='right' && x.status!=='مدفوع').reduce((s,x)=>s+x.amount,0),
            debts: t.filter(x=>x.type==='debt' && x.status!=='مدفوع').reduce((s,x)=>s+x.amount,0),
        };
    }, [state.transactions]);

    const filteredList = useMemo(() => {
        if (activeTab === 'overview') return [];
        return state.transactions.filter(t => t.type === activeTab);
    }, [state.transactions, activeTab]);

    return (
        <div className="min-h-screen pb-32 transition-colors duration-500">
            <Sidebar 
                isOpen={isSidebarOpen} 
                onClose={()=>setIsSidebarOpen(false)} 
                darkMode={state.darkMode} 
                onToggleDark={()=>setState(p=>({...p, darkMode: !p.darkMode}))} 
                onClear={()=>{if(confirm('سيتم مسح كافة البيانات نهائياً. هل أنت متأكد؟')){setState({transactions:[], balance:0, balanceHidden:false, darkMode:false}); setIsSidebarOpen(false);}}} 
            />

            <header className="bg-[#0077b6] text-white p-6 sticky top-0 z-50 shadow-2xl rounded-b-[2.5rem]">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center active-scale transition-all hover:bg-white/20">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">ميزانيتك الذكية</h1>
                    <div className="w-12"></div>
                </div>
            </header>

            <nav className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md flex border-b dark:border-zinc-800 sticky top-[92px] z-40 max-w-4xl mx-auto px-2 shadow-sm rounded-b-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'overview', label: 'الرئيسية', icon: 'fa-chart-pie' },
                    { id: 'expense', label: 'المصروفات', icon: 'fa-wallet' },
                    { id: 'right', label: 'حقوق لك', icon: 'fa-hand-holding-heart' },
                    { id: 'debt', label: 'التزامات', icon: 'fa-file-invoice' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => {setActiveTab(tab.id as any); setEditingTx(null); window.scrollTo(0,0);}} className={`flex-1 min-w-[90px] py-5 flex flex-col items-center gap-1 transition-all border-b-4 ${activeTab === tab.id ? 'text-[#0077b6] border-[#0077b6] bg-blue-50/40 dark:bg-blue-900/10 scale-105' : 'text-zinc-400 border-transparent'}`}>
                        <i className={`fas ${tab.icon} text-xl`}></i>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="p-4 max-w-4xl mx-auto mt-6 space-y-8">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-slide-up">
                        <div className="bg-white dark:bg-[#1e293b] rounded-custom p-12 shadow-luxe text-center flex flex-col items-center relative border-b-[12px] border-[#0077b6]/10 transition-all">
                            <h2 className="text-zinc-400 dark:text-zinc-500 text-xs font-black mb-3 uppercase tracking-widest">إجمالي الرصيد المتوفر</h2>
                            <div className="flex items-center gap-5">
                                <p className="text-5xl md:text-6xl font-black" style={{ color: BRAND.primary }}>
                                    {state.balanceHidden ? '••••••' : fmtCurr(state.balance)}
                                </p>
                                <button onClick={()=>setState(p=>({...p, balanceHidden: !p.balanceHidden}))} className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-300 flex items-center justify-center active-scale shadow-sm transition-all hover:text-[#0077b6]">
                                    <i className={`fas ${state.balanceHidden ? 'fa-eye' : 'fa-eye-slash'} text-lg`}></i>
                                </button>
                            </div>
                            <div className="flex gap-4 mt-10 w-full max-w-md">
                                <button onClick={() => {const v = prompt('أدخل مبلغ الإيداع:'); if(v && !isNaN(parseFloat(v))) setState(p=>({...p, balance: p.balance + parseFloat(v)}))}} className="flex-1 bg-[#2a9d8f] text-white py-5 rounded-2xl font-black shadow-xl active-scale transition-all hover:brightness-110 flex items-center justify-center gap-2">
                                    <i className="fas fa-plus-circle"></i> إيداع
                                </button>
                                <button onClick={() => {const v = prompt('أدخل مبلغ السحب:'); if(v && !isNaN(parseFloat(v))) setState(p=>({...p, balance: p.balance - parseFloat(v)}))}} className="flex-1 bg-[#ef476f] text-white py-5 rounded-2xl font-black shadow-xl active-scale transition-all hover:brightness-110 flex items-center justify-center gap-2">
                                    <i className="fas fa-minus-circle"></i> سحب
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <StatCard label="المصروفات" value={stats.exp} color={BRAND.danger} icon="fa-shopping-cart" hidden={state.balanceHidden} />
                            <StatCard label="حقوق لك" value={stats.rights} color={BRAND.success} icon="fa-handshake" hidden={state.balanceHidden} />
                            <StatCard label="التزامات" value={stats.debts} color={BRAND.warning} icon="fa-file-invoice-dollar" hidden={state.balanceHidden} />
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-8 rounded-card border-2 border-blue-100 dark:border-blue-800 text-center animate-pulse">
                            <p className="text-[#0077b6] dark:text-blue-400 font-black text-sm uppercase tracking-widest">تطبيق ميزانيتك الذكية v2.5 جاهز للاستخدام</p>
                        </div>
                    </div>
                )}

                {activeTab !== 'overview' && (
                    <div className="space-y-10">
                        <TransactionForm 
                            type={activeTab} 
                            onSubmit={handleTransaction} 
                            initialData={editingTx} 
                            onCancel={()=>setEditingTx(null)} 
                            key={editingTx ? editingTx.id : activeTab}
                        />
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-4">
                                <h3 className="font-black text-lg dark:text-white flex items-center gap-2">
                                    <i className="fas fa-history text-zinc-400"></i>
                                    <span>سجل العمليات</span>
                                </h3>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                                    {filteredList.length} سجلات
                                </span>
                            </div>
                            
                            {filteredList.length === 0 ? (
                                <div className="text-center py-20 bg-white dark:bg-[#1e293b] rounded-card border-2 border-dashed border-zinc-100 dark:border-zinc-800 opacity-30">
                                    <i className="fas fa-receipt text-5xl mb-4 block"></i>
                                    <p className="font-black text-lg">لا توجد بيانات مسجلة في هذا القسم</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredList.map(t => (
                                        <HistoryItem 
                                            key={t.id} 
                                            t={t} 
                                            onDelete={deleteTx} 
                                            onEdit={(item: any) => { setEditingTx(item); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                                            hidden={state.balanceHidden} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-lg rounded-custom p-5 shadow-2xl border border-white/30 dark:border-zinc-800 flex justify-center items-center z-30">
                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">نظام الإدارة المالية الشامل © 2025</p>
            </footer>
        </div>
    );
};

const StatCard = ({ label, value, color, icon, hidden }: any) => (
    <div className="bg-white dark:bg-[#1e293b] p-7 rounded-card shadow-luxe border-t-[6px] transition-all hover:scale-[1.03] group" style={{ borderTopColor: color }}>
        <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-30 group-hover:opacity-100 transition-all" style={{ backgroundColor: color + '20', color }}>
                <i className={`fas ${icon} text-lg`}></i>
            </div>
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-3xl font-black" style={{ color }}>{hidden ? '••••' : fmtCurr(value)}</p>
    </div>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
