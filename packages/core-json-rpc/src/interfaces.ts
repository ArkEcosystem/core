export interface IResponse<T> {
    jsonrpc: "2.0";
    id: string | number;
    result: T;
}

export interface IResponseError {
    jsonrpc: "2.0";
    id: string | number;
    error: {
        code: number;
        message: string;
        data: string;
    };
}
