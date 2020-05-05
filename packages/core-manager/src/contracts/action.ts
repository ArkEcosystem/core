export type ExecuteFunction = (data: object) => Promise<object>;

export interface Action {
    name: string,
    execute: ExecuteFunction
}
