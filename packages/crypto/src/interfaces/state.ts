import { IBlockHeader } from "./block";

export type ISlot = {
    readonly no: number;
    readonly timestamp: number;
    readonly duration: number;
};

export type IRound = {
    readonly no: number;
    readonly height: number;
    readonly length: number;
};

export interface IState<B = IBlockHeader> {
    // Sum of numbeOfTransactions up to last forged block
    readonly forgedTransactionCount: number;

    // Sum of numbeOfTransactions up to last finalized block
    readonly finalizedTransactionCount: number;

    // Delegates from round of last finalized block *immediate child*
    readonly finalizedDelegates: readonly string[];

    // Last finalized block
    readonly finalizedBlock: B;

    // Last justified block
    readonly justifiedBlock: B;

    // Last forged block
    readonly lastBlock: B;

    // Last forged block slot
    readonly lastSlot: ISlot;

    // Last forged block round
    readonly lastRound: IRound;

    // Last forged block round delegates
    readonly lastRoundDelegates: readonly string[];

    // Round of block that is about to be forged
    readonly nextBlockRound: IRound;

    // Delegates from round of block that is about to be forged
    readonly nextBlockRoundDelegates?: readonly string[];

    // Shuffled delegates from round of block that is about to be forged
    readonly nextBlockRoundForgers?: readonly string[];

    setNextBlockRoundDelegates(delegates: readonly string[]): void;
}
