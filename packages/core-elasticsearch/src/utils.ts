export const first = <T = any>(values: T[]): T => {
    return values[0];
};

export const last = <T = any>(values: T[]): T => {
    return values[values.length - 1];
};
