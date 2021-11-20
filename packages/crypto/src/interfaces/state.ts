import { IBlockHeader } from "./block";

export type ISlot = {
    readonly no: number;
    readonly timestamp: number;
};

export type IStateNext = {
    readonly forgers: readonly string[];
    readonly validators: readonly string[];
};

export type IStateData = {
    readonly finalizedTransactionCount: number;
    readonly justifiedTransactionCount: number;
    readonly forgedTransactionCount: number;

    readonly finalizedHeight: number;
    readonly finalizedBlockId: string;
    readonly finalizedDelegates: readonly string[];

    readonly justifiedHeight: number;
    readonly justifiedBlockId: string;
    readonly justifiedDelegates: readonly string[];

    readonly lastSlot: ISlot;
    readonly lastHeight: number;
    readonly lastBlockId: string;
    readonly lastDelegates: readonly string[];

    readonly next?: IStateNext;
};

export type IState = {
    readonly finalizedTransactionCount: number;
    readonly forgedTransactionCount: number;

    readonly finalizedHeight: number;
    readonly finalizedBlockId: string;

    readonly justifiedHeight: number;
    readonly justifiedBlockId: string;

    readonly lastSlot: ISlot;
    readonly lastHeight: number;
    readonly lastBlockId: string;

    readonly next?: IStateNext;

    chainNewBlock(header: IBlockHeader): void;
    applyNextRound(delegates: readonly string[]): void;
    clone(): IState;
};
