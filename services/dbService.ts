
import { AppState, Transaction, BalanceChange } from '../types';

const DB_NAME = 'SmartBudgetAIDB';
const DB_VERSION = 2; // تحديث النسخة لضمان تفعيل التغييرات

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('transactions')) {
                db.createObjectStore('transactions', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('balance')) {
                db.createObjectStore('balance', { keyPath: 'key' });
            }
        };

        request.onsuccess = (e: any) => resolve(e.target.result);
        request.onerror = (e) => {
            console.error("IndexedDB error:", e);
            reject(e);
        };
    });
};

export const saveState = async (state: AppState) => {
    try {
        const db = await initDB();
        const tx = db.transaction(['transactions', 'balance'], 'readwrite');
        
        const tStore = tx.objectStore('transactions');
        // مسح القديم وإضافة الجديد لضمان المزامنة الكاملة
        tStore.clear();
        state.transactions.forEach(t => tStore.put(t));

        const bStore = tx.objectStore('balance');
        bStore.put({ key: 'current', value: state.balance });
        bStore.put({ key: 'history', value: state.balanceHistory });
        bStore.put({ key: 'settings', value: { 
            currency: state.currency, 
            darkMode: state.darkMode, 
            balanceHidden: state.balanceHidden 
        }});
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    } catch (err) {
        console.error("Failed to save state locally:", err);
    }
};

export const loadState = async (): Promise<Partial<AppState>> => {
    try {
        const db = await initDB();
        return new Promise((resolve) => {
            const tx = db.transaction(['transactions', 'balance'], 'readonly');
            const tStore = tx.objectStore('transactions');
            const bStore = tx.objectStore('balance');

            const state: Partial<AppState> = {
                transactions: [],
                balance: 0,
                balanceHistory: []
            };

            tStore.getAll().onsuccess = (e: any) => { state.transactions = e.target.result; };
            bStore.get('current').onsuccess = (e: any) => { if(e.target.result) state.balance = e.target.result.value; };
            bStore.get('history').onsuccess = (e: any) => { if(e.target.result) state.balanceHistory = e.target.result.value; };
            bStore.get('settings').onsuccess = (e: any) => {
                if(e.target.result) {
                    state.currency = e.target.result.value.currency;
                    state.darkMode = e.target.result.value.darkMode;
                    state.balanceHidden = e.target.result.value.balanceHidden;
                }
            };

            tx.oncomplete = () => resolve(state);
            tx.onerror = () => resolve(state); // Return empty state on error
        });
    } catch (err) {
        console.error("Failed to load state from local storage:", err);
        return {};
    }
};
