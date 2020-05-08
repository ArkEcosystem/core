export type Method = (params: any) => Promise<any>;

export interface Action {
    name: string,
    method: Method,
    schema?: any
}
