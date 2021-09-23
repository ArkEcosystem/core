export interface IParameters {
    offset?: number;
    limit?: number;
    orderBy?: string;
    [key: string]: object | number | string | boolean;
}
