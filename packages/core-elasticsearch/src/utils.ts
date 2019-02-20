export function first<T = any>(values: T[]): T {
    return values[0];
}

export function last<T = any>(values: T[]): T {
    return values[values.length - 1];
}
