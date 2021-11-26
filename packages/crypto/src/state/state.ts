import { CryptoError } from "../errors";
import { IBlockHeader, IRound, ISlot, IState } from "../interfaces";
import { configManager } from "../managers";
import { Forgers } from "./forgers";
import { Rounds } from "./rounds";

export class State<B extends IBlockHeader> implements IState<B> {
    public nextBlockRound: IRound;
    public nextBlockRoundDelegates?: readonly string[];
    public nextBlockRoundForgers?: readonly string[];

    public constructor(
        public forgedTransactionCount: number,
        public finalizedTransactionCount: number,
        public finalizedDelegates: readonly string[],
        public finalizedBlock: B,
        public justifiedBlock: B,
        public lastBlock: B,
        public lastSlot: ISlot,
        public lastRound: IRound,
        public lastRoundDelegates: readonly string[],
    ) {
        this.nextBlockRound = Rounds.getNextBlockRound(this);

        const lastMilestone = configManager.getMilestone(this.lastBlock.height);
        const finalizedMilestone = configManager.getMilestone(this.finalizedBlock.height);

        if (lastMilestone.finalizedDelegates !== finalizedMilestone.finalizedDelegates) {
            this.finalizedDelegates = lastMilestone.finalizedDelegates;
        }
    }

    public setNextBlockRoundDelegates(delegates: readonly string[]): void {
        if (this.nextBlockRoundDelegates || this.nextBlockRoundForgers) {
            throw new CryptoError("Next block's round delegates are already set.");
        }

        if (delegates.length !== this.nextBlockRound.length) {
            throw new CryptoError("Invalid delegate count.");
        }

        this.nextBlockRoundForgers = Forgers.getRoundForgers(this.nextBlockRound, delegates);
        this.nextBlockRoundDelegates = delegates;
    }
}
