export declare class HttpieError extends Error {
    constructor(error: any);
}
export interface IHttpieResponse<T> {
    body: T;
    headers: {
        [key: string]: string;
    };
    status: number;
}
declare class Httpie {
    get<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    post<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    put<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    patch<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    head<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    delete<T = any>(url: string, opts?: any): Promise<IHttpieResponse<T>>;
    private sendRequest;
}
export declare const httpie: Httpie;
export {};
