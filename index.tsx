// Add React and ReactDOM imports to resolve "Cannot find name" errors
import React from 'react';
import ReactDOM from 'react-dom/client';

const { useState, useEffect, useCallback, useMemo, useRef } = React;

// --- Constants & Config ---
const BRAND = { primary: '#0077b6', danger: '#ef476f', success: '#2a9d8f', warning: '#fbc02d' };
const CATEGORIES = {
    expense: ['طعام', 'مواصلات', 'رعاية شخصية', 'إلكترونيات', 'صحة', 'ترفيه', 'تسوق', 'تعليم', 'أخرى'],
    right: ['دين لك', 'بيع بالآجل', 'قرض شخصي', 'أخرى'],
    debt: ['إيجار', 'كهرباء/ماء', 'إنترنت', 'قرض بنكي', 'دين شخصي', 'قسط', 'أخرى']
};

// --- Utilities ---
const generateId = (p = 'id') => `${p}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const formatCurrency = (amt, symbol = 'ر.س') => `${Number(amt).toLocaleString('ar-SA')} ${symbol}`;
const formatDate = (ds) => new Date(ds).toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// --- Components ---

const Sidebar = ({ isOpen, onClose, state, onToggleDark, onClear }) => (
    <div className={`fixed inset-0 z-[200] ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-opacity duration-300`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        <aside className={`absolute top-0 right-0 w-80 h-full bg-white dark:bg-[#1e1e1e] shadow-2xl sidebar-transition transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-8 bg-[#0077b6] text-white flex justify-between items-center">
                <h2 className="text-xl font-black">الإعدادات</h2>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active-scale"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-6 space-y-4">
                <div onClick={onToggleDark} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 cursor-pointer active-scale transition-all">
                    <div className="flex items-center gap-4">
                        <i className={`fas ${state.darkMode ? 'fa-moon text-indigo-400' : 'fa-sun text-amber-500'} text-xl`}></i>
                        <span className="font-bold">الوضع الليلي</span>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-colors ${state.darkMode ? 'bg-indigo-600' : 'bg-zinc-300'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.darkMode ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </div>
                </div>
                <hr className="border-zinc-100 dark:border-zinc-800" />
                <button onClick={onClear} className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 font-bold active-scale transition-all">
                    <i className="fas fa-trash-alt text-xl"></i>
                    <span>مسح كافة البيانات</span>
                </button>
            </div>
        </aside>
    </div>
);

// Added : any to resolve key prop assignment error in strict TypeScript environments
const TransactionForm = ({ type, onSubmit, initialData, onCancel }: any) => {
    const [amt, setAmt] = useState(initialData?.amount || '');
    const [cat, setCat] = useState(initialData?.category || '');
    const [desc, setDesc] = useState(initialData?.description || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
    const [status, setStatus] = useState(initialData?.status || 'غير مدفوع');
    const [img, setImg] = useState(initialData?.imageUrl || '');
    const fileRef = useRef(null);

    const handleImg = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            const r = new FileReader();
            r.onload = () => setImg(r.result);
            r.readAsDataURL(f);
        }
    };

    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;

    return (
        <form onSubmit={e => {
            e.preventDefault();
            onSubmit({ id: initialData?.id || generateId(type), type, amount: parseFloat(amt), category: cat, description: desc, date: new Date(date).toISOString(), status, imageUrl: img });
            if(!initialData) { setAmt(''); setCat(''); setDesc(''); setImg(''); }
        }} className="bg-white dark:bg-[#1e1e1e] p-8 rounded-card shadow-2xl space-y-5 animate-slide-up border border-zinc-100 dark:border-zinc-800">
            <h3 className="text-xl font-black text-center" style={{ color }}>{initialData ? 'تعديل المعاملة' : `إضافة ${type === 'expense' ? 'مصروف' : type === 'right' ? 'حق' : 'التزام'}`}</h3>
            
            <div className="space-y-4">
                <input type="number" step="any" value={amt} onChange={e=>setAmt(e.target.value)} placeholder="0.00" className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl text-3xl font-black text-center outline-none border-2 border-transparent focus:border-[#0077b6] transition-all" required />
                
                <div className="grid grid-cols-2 gap-3">
                    <select value={cat} onChange={e=>setCat(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none dark:text-white" required>
                        <option value="">الفئة...</option>
                        {CATEGORIES[type].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={status} onChange={e=>setStatus(e.target.value)} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none dark:text-white" disabled={type === 'expense'}>
                        <option value="غير مدفوع">غير مدفوع</option>
                        <option value="مدفوع">مدفوع بالكامل</option>
                    </select>
                </div>

                <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl font-bold outline-none dark:text-white" required />
                
                <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="وصف أو ملاحظات..." className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-xl outline-none h-24 resize-none dark:text-white"></textarea>

                {type === 'expense' && (
                    <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-dashed border-zinc-300">
                        <button type="button" onClick={() => fileRef.current?.click()} className="w-12 h-12 rounded-lg bg-[#0077b6] text-white flex items-center justify-center active-scale">
                            <i className="fas fa-camera"></i>
                        </button>
                        <span className="text-xs font-bold text-zinc-400 flex-1">{img ? 'تم التقاط الصورة' : 'إرفاق صورة الفاتورة'}</span>
                        {img && <img src={img} className="w-10 h-10 rounded-lg object-cover" />}
                        <input type="file" ref={fileRef} onChange={handleImg} accept="image/*" capture="environment" className="hidden" />
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button type="submit" className="flex-[2] text-white py-4 rounded-2xl font-black shadow-lg active-scale" style={{ backgroundColor: color }}>حفظ البيانات</button>
                {initialData && <button type="button" onClick={onCancel} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-2xl font-bold">إلغاء</button>}
            </div>
        </form>
    );
};

const HistoryList = ({ transactions, type, onDelete, onEdit, hidden }) => {
    const color = type === 'expense' ? BRAND.danger : type === 'right' ? BRAND.success : BRAND.warning;

    if (transactions.length === 0) return (
        <div className="text-center py-10 opacity-30 animate-pulse">
            <i className="fas fa-box-open text-4xl mb-2"></i>
            <p className="font-bold">لا توجد سجلات حالياً</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {transactions.map(t => (
                <div key={t.id} className="bg-white dark:bg-[#1e1e1e] p-5 rounded-card flex justify-between items-center shadow-sm border-r-8 transition-all hover:scale-[1.01]" style={{ borderRightColor: color }}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '15', color }}>
                            <i className={`fas ${type === 'expense' ? 'fa-shopping-basket' : 'fa-handshake'}`}></i>
                        </div>
                        <div>
                            <p className="font-black text-sm">{t.category}</p>
                            <p className="text-[10px] text-zinc-400 font-bold">{formatDate(t.date)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-left">
                            <p className="font-black text-lg" style={{ color }}>{hidden ? '••••' : formatCurrency(t.amount)}</p>
                            {t.status === 'مدفوع' && <span className="text-[9px] bg-teal-500/10 text-teal-600 px-2 py-0.5 rounded-full font-bold">مدفوع</span>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onEdit(t)} className="text-zinc-200 hover:text-blue-500 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                            <button onClick={() => onDelete(t.id)} className="text-zinc-200 hover:text-rose-500 transition-colors"><i className="fas fa-trash-alt text-xs"></i></button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- App Root ---

const App = () => {
    const [state, setState] = useState({ transactions: [], balance: 0, balanceHidden: false, darkMode: false });
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingTx, setEditingTx] = useState(null);

    useEffect(() => {
        const saved = localStorage.getItem('SmartBudgetProV1');
        if (saved) setState(JSON.parse(saved));
        setTimeout(() => document.getElementById('loading-screen')?.remove(), 1000);
    }, []);

    useEffect(() => {
        localStorage.setItem('SmartBudgetProV1', JSON.stringify(state));
        document.body.classList.toggle('dark-mode', state.darkMode);
    }, [state]);

    const handleTransaction = (t) => {
        setState(prev => {
            let newTx = [...prev.transactions];
            let oldTx = newTx.find(x => x.id === t.id);
            
            // Revert old impact if editing
            let balanceAdj = 0;
            if (oldTx) {
                balanceAdj += oldTx.type === 'expense' || (oldTx.type === 'debt' && oldTx.status === 'مدفوع') ? oldTx.amount : (oldTx.type === 'right' && oldTx.status === 'مدفوع' ? -oldTx.amount : 0);
                newTx = newTx.filter(x => x.id !== t.id);
            }

            // Apply new impact
            balanceAdj += t.type === 'expense' || (t.type === 'debt' && t.status === 'مدفوع') ? -t.amount : (t.type === 'right' && t.status === 'مدفوع' ? t.amount : 0);
            
            return { ...prev, transactions: [t, ...newTx], balance: prev.balance + balanceAdj };
        });
        setEditingTx(null);
    };

    const deleteTx = (id) => {
        if(!confirm('هل تريد الحذف؟')) return;
        setState(prev => {
            const t = prev.transactions.find(x => x.id === id);
            let adj = 0;
            if(t) adj = t.type === 'expense' || (t.type === 'debt' && t.status === 'مدفوع') ? t.amount : (t.type === 'right' && t.status === 'مدفوع' ? -t.amount : 0);
            return { ...prev, transactions: prev.transactions.filter(x => x.id !== id), balance: prev.balance + adj };
        });
    };

    const stats = useMemo(() => ({
        exp: state.transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0),
        rights: state.transactions.filter(t=>t.type==='right' && t.status!=='مدفوع').reduce((s,t)=>s+t.amount,0),
        debts: state.transactions.filter(t=>t.type==='debt' && t.status!=='مدفوع').reduce((s,t)=>s+t.amount,0),
    }), [state.transactions]);

    return (
        <div className="min-h-screen pb-24 transition-colors duration-500">
            <Sidebar isOpen={isSidebarOpen} onClose={()=>setIsSidebarOpen(false)} state={state} onToggleDark={()=>setState(p=>({...p, darkMode: !p.darkMode}))} onClear={()=>{if(confirm('تصفير البيانات؟')){setState({transactions:[], balance:0, balanceHidden:false, darkMode:false}); setIsSidebarOpen(false);}}} />

            <header className="bg-[#0077b6] text-white p-6 sticky top-0 z-50 shadow-2xl rounded-b-[2rem]">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center active-scale transition-colors">
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">ميزانيتك الذكية</h1>
                    <div className="w-12"></div>
                </div>
            </header>

            <nav className="bg-white dark:bg-[#1e1e1e] flex border-b dark:border-zinc-800 sticky top-[92px] z-40 max-w-4xl mx-auto px-2 shadow-sm rounded-b-xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'overview', label: 'الرئيسية', icon: 'fa-home' },
                    { id: 'expense', label: 'مصروفات', icon: 'fa-wallet' },
                    { id: 'right', label: 'حقوق لك', icon: 'fa-hand-holding-usd' },
                    { id: 'debt', label: 'ديون عليك', icon: 'fa-file-invoice' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => {setActiveTab(tab.id); setEditingTx(null);}} className={`flex-1 min-w-[80px] py-4 flex flex-col items-center gap-1 transition-all border-b-4 ${activeTab === tab.id ? 'text-[#0077b6] border-[#0077b6] bg-blue-50/30' : 'text-zinc-400 border-transparent'}`}>
                        <i className={`fas ${tab.icon} text-lg`}></i>
                        <span className="text-[10px] font-black uppercase">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <main className="p-4 max-w-4xl mx-auto mt-4 space-y-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-slide-up">
                        <div className="bg-white dark:bg-[#1e1e1e] rounded-custom p-10 shadow-xl text-center flex flex-col items-center relative border-b-8 border-[#0077b6]/10">
                            <h2 className="text-zinc-400 text-xs font-black mb-2 uppercase tracking-widest">الرصيد النقدي الحالي</h2>
                            <div className="flex items-center gap-4">
                                <p className="text-5xl font-black" style={{ color: BRAND.primary }}>
                                    {state.balanceHidden ? '••••••' : formatCurrency(state.balance)}
                                </p>
                                <button onClick={()=>setState(p=>({...p, balanceHidden: !p.balanceHidden}))} className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 text-zinc-300 flex items-center justify-center active-scale">
                                    <i className={`fas ${state.balanceHidden ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                                </button>
                            </div>
                            <div className="flex gap-4 mt-8 w-full max-w-sm">
                                <button onClick={() => {const v = prompt('مبلغ الإيداع:'); if(v) setState(p=>({...p, balance: p.balance + parseFloat(v)}))}} className="flex-1 bg-teal-500 text-white py-4 rounded-2xl font-black shadow-lg active-scale">إيداع</button>
                                <button onClick={() => {const v = prompt('مبلغ السحب:'); if(v) setState(p=>({...p, balance: p.balance - parseFloat(v)}))}} className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-black shadow-lg active-scale">سحب</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard label="المصروفات" value={stats.exp} color={BRAND.danger} icon="fa-shopping-cart" hidden={state.balanceHidden} />
                            <StatCard label="الحقوق لك" value={stats.rights} color={BRAND.success} icon="fa-handshake" hidden={state.balanceHidden} />
                            <StatCard label="الالتزامات" value={stats.debts} color={BRAND.warning} icon="fa-file-invoice-dollar" hidden={state.balanceHidden} />
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-card border-2 border-blue-100 dark:border-blue-800 text-center">
                            <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">استخدم التبويبات بالأعلى لإضافة وتعديل سجلاتك المالية</p>
                        </div>
                    </div>
                )}

                {activeTab !== 'overview' && (
                    <div className="space-y-8">
                        <TransactionForm 
                            type={activeTab} 
                            onSubmit={handleTransaction} 
                            initialData={editingTx} 
                            onCancel={()=>setEditingTx(null)} 
                            key={editingTx ? editingTx.id : activeTab}
                        />
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h3 className="font-black text-lg">سجل {activeTab === 'expense' ? 'المصروفات' : activeTab === 'right' ? 'الحقوق' : 'الالتزامات'}</h3>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                    الإجمالي: {formatCurrency(state.transactions.filter(t=>t.type===activeTab).reduce((s,t)=>s+t.amount,0))}
                                </div>
                            </div>
                            
                            <HistoryList 
                                transactions={state.transactions.filter(t => t.type === activeTab)} 
                                type={activeTab} 
                                onDelete={deleteTx} 
                                onEdit={(t) => { setEditingTx(t); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                                hidden={state.balanceHidden}
                            />
                        </div>
                    </div>
                )}
            </main>

            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 dark:bg-[#1e1e1e]/80 backdrop-blur-md rounded-custom p-4 shadow-2xl border border-white/20 dark:border-zinc-800 flex justify-center items-center">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">نظام إدارة الأموال الذكي © 2025</p>
            </footer>
        </div>
    );
};

const StatCard = ({ label, value, color, icon, hidden }) => (
    <div className="bg-white dark:bg-[#1e1e1e] p-6 rounded-card shadow-md border-t-4 transition-transform hover:scale-[1.02]" style={{ borderTopColor: color }}>
        <div className="flex justify-between items-center mb-2">
            <i className={`fas ${icon} opacity-30 text-xl`} style={{ color }}></i>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-2xl font-black" style={{ color }}>{hidden ? '••••' : formatCurrency(value)}</p>
    </div>
);

// Use ReactDOM from 'react-dom/client' to fix "Cannot find name 'ReactDOM'"
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
