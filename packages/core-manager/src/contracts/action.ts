export type ExecuteFunction = (params: any) => Promise<any>;

export interface Action {
    name: string;
    execute: ExecuteFunction;
    schema?: any;
}

export interface Method {
    name: string;
    method: Function;
    schema?: any;
}
