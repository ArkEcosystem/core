import { IStateStore } from "./state-store";
export interface IStateService {
    getBlocks(): any;
    getTransactions(): any;
    getStore(): IStateStore;
}
