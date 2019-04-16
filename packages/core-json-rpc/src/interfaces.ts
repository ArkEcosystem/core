import { Interfaces } from "@arkecosystem/crypto";

export interface IRequestParameters {
    jsonrpc: "2.0";
    method: string;
    id: string | number;
    params: object;
}

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

export interface IWallet {
    keys: Interfaces.IKeyPair;
    wif: string;
}
