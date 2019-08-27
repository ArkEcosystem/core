export interface Parameters {
    offset?: number;
    limit?: number;
    orderBy?: string;
    [key: string]: object | number | string | boolean;
}
