export function formatNumber(value: number | string | null | undefined, maximumFractionDigits = 0) {
    if (value === null || value === undefined) return '-';
    const numberValue = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numberValue)) return '-';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(numberValue);
}

export function formatCurrency(
    value: number | string | null | undefined,
    currency: string = 'TWD',
    maximumFractionDigits = 0
) {
    if (value === null || value === undefined) return '-';
    const numberValue = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numberValue)) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits
    }).format(numberValue);
}

export function stripNumberFormatting(value: string) {
    return value.replace(/,/g, '');
}

export function formatNumberInput(value: string) {
    if (!value) return '';
    const cleaned = value.replace(/[^\d.]/g, '');
    if (!cleaned) return '';
    const [integerPart, decimalPart] = cleaned.split('.');
    const integerNumber = integerPart ? Number(integerPart) : 0;
    const formattedInteger = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(integerNumber);
    if (decimalPart !== undefined) {
        return `${formattedInteger}.${decimalPart}`;
    }
    return formattedInteger;
}
