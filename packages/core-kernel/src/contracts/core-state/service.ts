import { IStateStore } from "./state-store";

export interface IStateService {
    getBlocks(): any; // @TODO: add type
    getTransactions(): any; // @TODO: add type
    getStore(): IStateStore;
}
