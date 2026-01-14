
export type TransactionType = 'expense' | 'right' | 'debt';

export interface Transaction {
    id: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
    date: string;
    status?: string;
    imageUrl?: string;
    // Specific for debts/rights
    totalAmount?: number;
    paidAmount?: number;
    remainingAmount?: number;
    expectedDate?: string;
}

export interface BalanceChange {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'deposit' | 'withdraw' | 'expense' | 'right_collection' | 'debt_payment';
    balanceAfter: number;
}

export interface AppState {
    transactions: Transaction[];
    balance: number;
    balanceHistory: BalanceChange[];
    currency: { code: string; symbol: string; name: string };
    darkMode: boolean;
    balanceHidden: boolean;
}
