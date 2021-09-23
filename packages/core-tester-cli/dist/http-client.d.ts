export declare class HttpClient {
    private baseUrl;
    constructor(baseUrl: string);
    get(path: string, query?: any, headers?: any): Promise<any>;
    post(path: string, payload: any): Promise<any>;
}
