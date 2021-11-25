import { IBlockHeader } from "./block";
import { ISlot } from "./crypto";

export type IStateData<B = IBlockHeader> = {
    // Sum of numbeOfTransactions up to last finalized block
    readonly finalizedTransactionCount: number;

    // Sum of numbeOfTransactions up to last forged block
    readonly forgedTransactionCount: number;

    // Last finalized block
    readonly finalizedBlock: B;

    // Last justified block
    readonly justifiedBlock: B;

    // Last forged block
    readonly lastBlock: B;

    // Last forged block slot
    readonly lastSlot: ISlot;

    // Delegates from round of last finalized block *immediate child*
    readonly finalizedDelegates: readonly string[];

    // Delegates from round of last forged block
    readonly lastDelegates: readonly string[];
};

export interface IState<B = IBlockHeader> extends IStateData<B> {
    // Delegates from round of next about to be forged block
    readonly nextDelegates?: readonly string[];

    createNextState(nexBlock: B): IState<B>;
    applyRound(delegates: readonly string[]): void;
}
