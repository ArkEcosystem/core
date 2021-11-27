import { CryptoError } from "../errors";
import { IBlockHeader, IRound, ISlot, IState, IStateCompletionData, IStateData } from "../interfaces";
import { configManager } from "../managers";
import { Forgers } from "./forgers";
import { Rounds } from "./rounds";

export class State<B extends IBlockHeader> implements IState<B> {
    public forgedTransactionCount: number;
    public finalizedTransactionCount: number;
    public finalizedDelegates: readonly string[];
    public finalizedBlock: B;
    public justifiedBlock: B;
    public block: B;
    public slot: ISlot;
    public round: IRound;
    public delegates: readonly string[];
    public nextBlockRound: IRound;
    public nextBlockRoundDelegates?: readonly string[];
    public nextBlockRoundForgers?: readonly string[];

    public constructor(data: IStateData<B>) {
        this.forgedTransactionCount = data.forgedTransactionCount;
        this.finalizedTransactionCount = data.finalizedTransactionCount;
        this.finalizedDelegates = data.finalizedDelegates;
        this.finalizedBlock = data.finalizedBlock;
        this.justifiedBlock = data.justifiedBlock;
        this.block = data.block;
        this.slot = data.slot;
        this.round = data.round;
        this.delegates = data.delegates;
        this.nextBlockRound = Rounds.getNextHeightRound(this.height, this.round);

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

    public complete(data: IStateCompletionData): void {
        if (this.incomplete === false) {
            throw new CryptoError("State is complete.");
        }

        if (data.nextBlockRoundDelegates.length !== this.nextBlockRound.length) {
            throw new CryptoError("Invalid delegate count.");
        }

        this.nextBlockRoundForgers = Forgers.getRoundForgers(this.nextBlockRound, data.nextBlockRoundDelegates);
        this.nextBlockRoundDelegates = data.nextBlockRoundDelegates;
    }
}
