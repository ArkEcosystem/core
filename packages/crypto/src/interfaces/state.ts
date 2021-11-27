import { IBlock, IBlockHeader } from "./block";

export type IHeaderState = IState<IBlockHeader>;

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

export interface IState<B extends IBlockHeader = IBlock> {
    // State must be completed
    readonly incomplete: boolean;

    // Last forged height
    readonly height: number;

    // Sum of numberOfTransactions up to last forged block
    readonly forgedTransactionCount: number;

    // Sum of numberOfTransactions up to last finalized block
    readonly finalizedTransactionCount: number;

    // Delegates from round of last finalized block *immediate child*
    readonly finalizedDelegates: readonly string[];

    // Last finalized block
    readonly finalizedBlock: B;

    // Last justified block
    readonly justifiedBlock: B;

    // Last forged block
    readonly block: B;

    // Last forged block slot
    readonly slot: ISlot;

    // Last forged block round
    readonly round: IRound;

    // Last forged block round delegates
    readonly delegates: readonly string[];

    // Round of block that is about to be forged
    readonly nextBlockRound: IRound;

    // Delegates from round of block that is about to be forged
    readonly nextBlockRoundDelegates?: readonly string[];

    // Shuffled delegates from round of block that is about to be forged
    readonly nextBlockRoundForgers?: readonly string[];

    // Complete state
    complete(nextBlockRoundDelegates: readonly string[]): void;
}
