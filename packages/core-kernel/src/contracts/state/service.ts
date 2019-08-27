import { StateStore } from "./state-store";

export interface StateService {
    getBlocks(): any; // @todo: add type
    getTransactions(): any; // @todo: add type
    getStore(): StateStore;
}
