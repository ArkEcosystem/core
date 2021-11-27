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
        public block: B,
        public slot: ISlot,
        public round: IRound,
        public delegates: readonly string[],
    ) {
        this.nextBlockRound = Rounds.getNextBlockRound(this);

        const lastMilestone = configManager.getMilestone(this.block.height);
        const finalizedMilestone = configManager.getMilestone(this.finalizedBlock.height);

        if (lastMilestone.finalizedDelegates !== finalizedMilestone.finalizedDelegates) {
            this.finalizedDelegates = lastMilestone.finalizedDelegates;
        }
    }

    public get height(): number {
        return this.block.height;
    }

    public get incomplete(): boolean {
        return !this.nextBlockRoundDelegates || !this.nextBlockRoundForgers;
    }

    public complete(nextBlockRoundDelegates: readonly string[]): void {
        if (this.incomplete === false) {
            throw new CryptoError("State is complete.");
        }

        if (nextBlockRoundDelegates.length !== this.nextBlockRound.length) {
            throw new CryptoError("Invalid delegate count.");
        }

        this.nextBlockRoundForgers = Forgers.getRoundForgers(this.nextBlockRound, nextBlockRoundDelegates);
        this.nextBlockRoundDelegates = nextBlockRoundDelegates;
    }
}
