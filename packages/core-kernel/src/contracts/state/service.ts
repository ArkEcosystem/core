import { IStateStore } from "./state-store";

export interface IStateService {
    getBlocks(): any; // @todo: add type
    getTransactions(): any; // @todo: add type
    getStore(): IStateStore;
}
