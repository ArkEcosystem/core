import { IBlockHeader } from "./block";

export type IRound = {
    readonly no: number;
    readonly height: number;
    readonly delegates: readonly string[];
};

export type ISlot = {
    readonly no: number;
    readonly height: number;
    readonly timestamp: number;
};

export type IStateNext = {
    readonly round: IRound;
    readonly forgers: readonly string[];
    readonly validators: readonly string[];
};

export type IStateData<B extends IBlockHeader> = {
    readonly finalizedTransactionCount: number;
    readonly forgedTransactionCount: number;
    readonly lastRound: IRound;
    readonly lastSlot: ISlot;
    readonly lastBlock: B;
    readonly justifiedBlock: B;
    readonly finalizedBlock: B;
    readonly finalizedRound: IRound;
    readonly next?: IStateNext;
};

export type IState<B extends IBlockHeader> = IStateData<B> & {
    chainNewBlock(block: B): void;
    applyNextRound(delegates: readonly string[]): void;
    clone(): IState<B>;
};
