export interface Action {
    name: string,
    execute: Function
}

export type ActionList = Record<string, Action>;
