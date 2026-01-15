
import React, { useState, useEffect, useCallback } from 'react';
import { Dashboard } from './components/Dashboard.tsx';
import { SectionView } from './components/SectionView.tsx';
import { AppState, Transaction, TransactionType, BalanceChange } from './types.ts';
import { ARABIC_CURRENCIES, BRAND } from './constants.ts';
import { loadState, saveState } from './services/dbService.ts';
import { generateId } from './utils.ts';

const calculateBalanceImpact = (t: Transaction, revert: boolean = false): number => {
    let impact = 0;
    const multiplier = revert ? -1 : 1;

    if (t.type === 'expense') {
        impact = -t.amount;
    } else if (t.type === 'right' && (t.status === 'مدفوع' || t.status === 'كامل' || t.status === 'مدفوع بالكامل')) {
        impact = t.amount;
    } else if (t.type === 'debt' && (t.status === 'مدفوع' || t.status === 'كامل' || t.status === 'مدفوع بالكامل')) {
        impact = -t.amount;
    }
    return impact * multiplier;
};

const createBalanceHistoryEntry = (amount: number, type: BalanceChange['type'], description: string, newBalance: number) => {
    return {
        id: generateId('bal'),
        date: new Date().toISOString(),
        description,
        amount,
        type,
        balanceAfter: newBalance
    } as BalanceChange;
};

const App: React.FC = () => {
    const [state, setState] = useState<AppState>({
        transactions: [],
        balance: 0,
        balanceHistory: [],
        currency: ARABIC_CURRENCIES[0],
        darkMode: false,
        balanceHidden: false
    });
    
    const [activeTab, setActiveTab] = useState<'overview' | TransactionType>('overview');
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [toasts, setToasts] = useState<{id: string, message: string, type: string}[]>([]);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    };

    useEffect(() => {
        loadState().then((saved) => {
            if (saved) {
                setState(prev => ({
                    ...prev,
                    transactions: saved.transactions || [],
                    balance: saved.balance ?? 0,
                    balanceHistory: saved.balanceHistory || [],
                    currency: saved.currency || ARABIC_CURRENCIES[0],
                    darkMode: !!saved.darkMode,
                    balanceHidden: !!saved.balanceHidden
                }));
            }
            setIsLoaded(true);
        });

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    useEffect(() => {
        if (isLoaded) {
            saveState(state);
            if (state.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
        }
    }, [state, isLoaded]);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    addToast("تم بدء التثبيت", "success");
                }
                setDeferredPrompt(null);
            });
        } else {
            addToast("التطبيق مثبت بالفعل أو المتصفح لا يدعم التثبيت التلقائي", "info");
        }
    };

    const upsertTransaction = useCallback((t: Transaction) => {
        setState(prev => {
            const existingIdx = prev.transactions.findIndex(item => item.id === t.id);
            let newBalance = prev.balance;
            let newTransactions = [...prev.transactions];
            let newHistory = [...prev.balanceHistory];

            if (existingIdx > -1) {
                newBalance += calculateBalanceImpact(prev.transactions[existingIdx], true);
                newBalance += calculateBalanceImpact(t);
                newTransactions[existingIdx] = t;
                addToast("تم التحديث", "info");
            } else {
                const impact = calculateBalanceImpact(t);
                newBalance += impact;
                newTransactions = [t, ...newTransactions];
                
                if (impact !== 0) {
                    const hType = t.type === 'expense' ? 'expense' : (t.type === 'right' ? 'right_collection' : 'debt_payment');
                    newHistory = [createBalanceHistoryEntry(t.amount, hType, `${t.category}: ${t.description || 'بدون وصف'}`, newBalance), ...newHistory];
                }
                addToast("تم الحفظ", "success");
            }

            return {
                ...prev,
                transactions: newTransactions,
                balance: newBalance,
                balanceHistory: newHistory.slice(0, 50)
            };
        });
    }, []);

    const deleteTransaction = useCallback((id: string) => {
        setState(prev => {
            const tToDelete = prev.transactions.find(item => item.id === id);
            if (!tToDelete) return prev;
            
            const impactToRevert = calculateBalanceImpact(tToDelete, true);
            const newBalance = prev.balance + impactToRevert;
            
            let newHistory = [...prev.balanceHistory];
            if (impactToRevert !== 0) {
                newHistory = [
                    createBalanceHistoryEntry(Math.abs(impactToRevert), impactToRevert > 0 ? 'deposit' : 'withdraw', `حذف: ${tToDelete.category}`, newBalance),
                    ...newHistory
                ];
            }

            addToast("تم الحذف بنجاح", "info");
            return {
                ...prev,
                transactions: prev.transactions.filter(item => item.id !== id),
                balance: newBalance,
                balanceHistory: newHistory.slice(0, 50)
            };
        });
    }, []);

    const manualBalanceAction = (amount: number, action: 'deposit' | 'withdraw', description: string) => {
        setState(prev => {
            const netChange = action === 'deposit' ? amount : -amount;
            const newBalance = prev.balance + netChange;
            const newHistory = [
                createBalanceHistoryEntry(amount, action, description, newBalance),
                ...prev.balanceHistory
            ];
            addToast(action === 'deposit' ? "تم الإيداع" : "تم السحب", "success");
            return {
                ...prev,
                balance: newBalance,
                balanceHistory: newHistory.slice(0, 50)
            };
        });
    };

    const toggleBalanceVisibility = useCallback(() => {
        setState(p => ({ ...p, balanceHidden: !p.balanceHidden }));
    }, []);

    const clearAllData = () => {
        if (window.confirm('سيتم مسح كافة البيانات نهائياً. هل أنت متأكد؟')) {
            setState({
                transactions: [],
                balance: 0,
                balanceHistory: [],
                currency: ARABIC_CURRENCIES[0],
                darkMode: false,
                balanceHidden: false
            });
            setIsSidebarOpen(false);
            addToast("تم تصفير التطبيق", "info");
        }
    };

    return (
        <div className={`min-h-screen font-['Tajawal'] pb-12 transition-colors duration-500`}>
            {/* نظام الإشعارات */}
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`animate-toast pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-2xl border ${
                        toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-200' : 
                        toast.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/40 dark:border-blue-800 dark:text-blue-200' :
                        'bg-teal-50 border-teal-200 text-teal-700 dark:bg-teal-900/40 dark:border-teal-800 dark:text-teal-200'
                    }`}>
                        <i className={`fas ${
                            toast.type === 'error' ? 'fa-exclamation-circle' : 
                            toast.type === 'info' ? 'fa-info-circle' : 'fa-check-circle'
                        } text-xl`}></i>
                        <span className="font-bold text-sm">{toast.message}</span>
                    </div>
                ))}
            </div>

            <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
                <aside className={`absolute top-0 right-0 w-80 h-full bg-white dark:bg-[#1e1e1e] shadow-2xl transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="p-6 bg-[#0077b6] text-white flex justify-between items-center">
                        <h2 className="font-extrabold text-xl">الإعدادات</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="text-2xl p-2 active-scale"><i className="fas fa-times"></i></button>
                    </div>
                    <nav className="p-6 space-y-4">
                        <div 
                            className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-[#2a2a2a] cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-[#333]" 
                            onClick={() => setState(p => ({ ...p, darkMode: !p.darkMode }))}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${state.darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-500/20 text-orange-500'}`}>
                                    <i className={`fas ${state.darkMode ? 'fa-moon' : 'fa-sun'} text-lg`}></i>
                                </div>
                                <span className="font-bold dark:text-white">الوضع الليلي</span>
                            </div>
                            <div className={`w-14 h-7 rounded-full relative transition-all duration-300 ${state.darkMode ? 'bg-indigo-600' : 'bg-zinc-300 shadow-inner'}`}>
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${state.darkMode ? 'translate-x-8' : 'translate-x-1'}`}></div>
                            </div>
                        </div>

                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="w-full text-right p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 text-[#0077b6] flex items-center gap-4 font-bold active-scale transition-all">
                                <div className="w-10 h-10 rounded-xl bg-[#0077b6]/10 text-[#0077b6] flex items-center justify-center">
                                    <i className="fas fa-download text-lg"></i>
                                </div>
                                <span>تثبيت التطبيق على الشاشة</span>
                            </button>
                        )}
                        
                        <hr className="border-zinc-100 dark:border-zinc-800 my-6" />
                        
                        <button onClick={clearAllData} className="w-full text-right p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 flex items-center gap-4 font-bold active-scale transition-all">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                                <i className="fas fa-trash-alt text-lg"></i>
                            </div>
                            <span>مسح كافة البيانات</span>
                        </button>
                    </nav>
                </aside>
            </div>

            <header className="sticky top-0 z-40 bg-[#0077b6] text-white shadow-xl">
                <div className="max-w-4xl mx-auto px-4 py-5 flex justify-between items-center">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-2xl p-2 active:scale-90 transition-transform">
                        <i className="fas fa-bars"></i>
                    </button>
                    <h1 className="text-2xl font-black">ميزانيتك المالية</h1>
                    <div className="w-10"></div>
                </div>

                <div className="max-w-4xl mx-auto flex bg-white dark:bg-[#1e1e1e] border-b dark:border-zinc-800 overflow-x-auto no-scrollbar">
                    <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="الرئيسية" icon="fa-tachometer-alt" />
                    <TabBtn active={activeTab === 'expense'} onClick={() => setActiveTab('expense')} label="مصروفات" icon="fa-money-bill-wave" />
                    <TabBtn active={activeTab === 'right'} onClick={() => setActiveTab('right')} label="حقوق" icon="fa-handshake" />
                    <TabBtn active={activeTab === 'debt'} onClick={() => setActiveTab('debt')} label="التزامات" icon="fa-file-invoice" />
                </div>
            </header>

            <main className="max-w-4xl mx-auto pt-4 px-4 pb-20">
                {activeTab === 'overview' && (
                    <Dashboard 
                        state={state} 
                        onDeposit={(amt, desc) => manualBalanceAction(amt, 'deposit', desc)}
                        onWithdraw={(amt, desc) => manualBalanceAction(amt, 'withdraw', desc)}
                        onToggleVisibility={toggleBalanceVisibility}
                    />
                )}
                
                {activeTab !== 'overview' && (
                    <SectionView 
                        key={activeTab}
                        type={activeTab as TransactionType}
                        transactions={state.transactions.filter(t => t.type === activeTab)}
                        currency={state.currency}
                        balanceHidden={state.balanceHidden}
                        onSubmit={upsertTransaction}
                        onDelete={deleteTransaction}
                    />
                )}
            </main>
        </div>
    );
};

const TabBtn: React.FC<{ active: boolean, onClick: () => void, label: string, icon: string }> = ({ active, onClick, label, icon }) => (
    <button 
        onClick={onClick} 
        className={`flex-1 min-w-[80px] py-4 text-xs font-bold transition-all border-b-4 flex flex-col items-center gap-1 ${active ? 'border-[#0077b6] text-[#0077b6] bg-blue-50/40 dark:bg-blue-500/10' : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
    >
        <i className={`fas ${icon} text-xl mb-1`}></i>
        <span>{label}</span>
    </button>
);

export default App;
