import { CryptoError } from "../errors";
import { IBlockHeader, IDelegate, IRound, ISlot, IState, ITransitionState, ITransitionStateData } from "../interfaces";
import { configManager } from "../managers";
import { State } from "./state";
import { Utils } from "./utils";

export class TransitionState<B extends IBlockHeader> implements ITransitionState<B> {
    public readonly forgedTransactionCount: number;
    public readonly finalizedTransactionCount: number;
    public readonly finalizedValidators: readonly string[];

    public readonly finalizedBlock: B;
    public readonly justifiedBlock: B;

    public readonly currentBlock: B;
    public readonly currentSlot: ISlot;
    public readonly currentRound: IRound;
    public readonly currentDelegates: readonly IDelegate[];
    public readonly currentValidators: readonly string[];
    public readonly currentForgers: readonly string[];

    public readonly nextHeightRound: IRound;

    public constructor(data: ITransitionStateData<B>) {
        this.forgedTransactionCount = data.forgedTransactionCount;
        this.finalizedTransactionCount = data.finalizedTransactionCount;
        this.finalizedValidators = data.finalizedValidators;

        this.finalizedBlock = data.finalizedBlock;
        this.justifiedBlock = data.justifiedBlock;

        this.currentBlock = data.currentBlock;
        this.currentSlot = data.currentSlot;
        this.currentRound = data.currentRound;
        this.currentDelegates = data.currentDelegates;
        this.currentValidators = data.currentValidators;
        this.currentForgers = data.currentForgers;

        const nextHeight = this.currentBlock.height + 1;
        const nextRoundHeight = this.currentRound.height + this.currentRound.length;

        if (nextHeight < nextRoundHeight) {
            this.nextHeightRound = this.currentRound;
        } else {
            this.nextHeightRound = {
                no: this.currentRound.no + 1,
                height: nextRoundHeight,
                length: configManager.getMilestone(nextHeight).activeDelegates,
            };
        }
    }

    public continueCurrentRound(): IState<B> {
        if (this.nextHeightRound.no !== this.currentRound.no) {
            throw new CryptoError("New round.");
        }

        return new State({
            forgedTransactionCount: this.forgedTransactionCount,
            finalizedTransactionCount: this.finalizedTransactionCount,
            finalizedValidators: this.finalizedValidators,

            finalizedBlock: this.finalizedBlock,
            justifiedBlock: this.justifiedBlock,

            lastBlock: this.currentBlock,
            lastSlot: this.currentSlot,
            lastValidators: this.currentValidators,

            currentRound: this.currentRound,
            currentDelegates: this.currentDelegates,
            currentValidators: this.currentValidators,
            currentForgers: this.currentForgers,
        });
    }

    public startNewRound(newDelegates: readonly IDelegate[]): IState<B> {
        if (this.nextHeightRound.no === this.currentRound.no) {
            throw new CryptoError("Not a new round.");
        }

        const newForgers = Utils.getRoundShuffledForgers(this.nextHeightRound, newDelegates);
        const newValidators = newDelegates.map((d) => d.publicKey);

        return new State({
            forgedTransactionCount: this.forgedTransactionCount,
            finalizedTransactionCount: this.finalizedTransactionCount,
            finalizedValidators: this.finalizedValidators,

            finalizedBlock: this.finalizedBlock,
            justifiedBlock: this.justifiedBlock,

            lastBlock: this.currentBlock,
            lastSlot: this.currentSlot,
            lastValidators: this.currentValidators,

            currentRound: this.nextHeightRound,
            currentDelegates: newDelegates,
            currentValidators: newValidators,
            currentForgers: newForgers,
        });
    }
}
