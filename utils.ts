
export const formatCurrency = (amount: number, currency: { symbol: string }): string => {
    const formatted = amount.toLocaleString('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
    return `${formatted} ${currency.symbol}`;
};

export const generateId = (prefix: string = 'id'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};
