import { IBlockHeader } from "./block";

export type ISlot = {
    readonly no: number;
    readonly height: number;
    readonly timestamp: number;
};

export type IStateData<B = IBlockHeader> = {
    readonly finalizedTransactionCount: number;
    readonly forgedTransactionCount: number;
    readonly finalizedBlock: B;
    readonly justifiedBlock: B;
    readonly lastBlock: B;
    readonly lastSlot: ISlot;
    readonly finalizedDelegates: readonly string[];
    readonly lastDelegates: readonly string[];
};

export interface IState<B = IBlockHeader> extends IStateData<B> {
    readonly nextDelegates?: readonly string[];

    createNewState(newBlock: B): IState<B>;
    applyRound(delegates: readonly string[]): void;
}
