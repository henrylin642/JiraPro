
export function serializeDecimal(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj === 'object') {
        // Handle Decimal (duck typing)
        if (obj.s && obj.e && obj.d) {
            return obj.toNumber ? obj.toNumber() : Number(obj);
        }
        // Handle Date
        if (obj instanceof Date) {
            return obj.toISOString();
        }

        if (Array.isArray(obj)) {
            return obj.map(serializeDecimal);
        }

        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = serializeDecimal(obj[key]);
        }
        return newObj;
    }

    return obj;
}
