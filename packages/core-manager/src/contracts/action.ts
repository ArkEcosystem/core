export type Method = (params: object) => Promise<any>;

export interface Action {
    name: string,
    method: Method,
    schema?: any
}
