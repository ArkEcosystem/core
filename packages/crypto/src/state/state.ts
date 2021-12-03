import { isEqual } from "@arkecosystem/utils";

import { CryptoError } from "../errors";
import {
    IBlockHeader,
    IDelegate,
    IRound,
    ISchnorrMultiSignature,
    ISlot,
    IState,
    IStateData,
    ITransitionState,
    IVotingTarget,
} from "../interfaces";
import { configManager } from "../managers";
import { TransitionState } from "./transition-state";
import { Utils } from "./utils";

export class State<B extends IBlockHeader> implements IState<B> {
    public readonly forgedTransactionCount: number;
    public readonly finalizedTransactionCount: number;
    public readonly finalizedValidators: readonly string[];

    public readonly finalizedBlock: B;
    public readonly justifiedBlock: B;

    public readonly lastBlock: B;
    public readonly lastSlot: ISlot;
    public readonly lastValidators: readonly string[];

    public readonly currentRound: IRound;
    public readonly currentDelegates: readonly IDelegate[];
    public readonly currentValidators: readonly string[];
    public readonly currentForgers: readonly string[];

    public constructor(data: IStateData<B>) {
        this.forgedTransactionCount = data.forgedTransactionCount;
        this.finalizedTransactionCount = data.finalizedTransactionCount;
        this.finalizedValidators = data.finalizedValidators;

        this.finalizedBlock = data.finalizedBlock;
        this.justifiedBlock = data.justifiedBlock;

        this.lastBlock = data.lastBlock;
        this.lastSlot = data.lastSlot;
        this.lastValidators = data.lastValidators;

        this.currentRound = data.currentRound;
        this.currentDelegates = data.currentDelegates;
        this.currentValidators = data.currentValidators;
        this.currentForgers = data.currentForgers;
    }

    public hasUnfinalizedTransactions(): boolean {
        return this.forgedTransactionCount !== this.finalizedTransactionCount;
    }

    public hasUnfinalizedValidators(): boolean {
        if (isEqual(this.finalizedValidators, this.lastValidators) === false) return true;
        if (isEqual(this.lastValidators, this.currentValidators) === false) return true;

        return false;
    }

    public getValidators(): readonly string[] {
        const validators = this.finalizedValidators.slice();

        for (const lastValidator of this.lastValidators) {
            if (validators.includes(lastValidator)) continue;
            validators.push(lastValidator);
        }

        for (const currentValidator of this.currentValidators) {
            if (validators.includes(currentValidator)) continue;
            validators.push(currentValidator);
        }

        return validators;
    }

    public getVotingTarget(): IVotingTarget {
        const sourceHeight = this.justifiedBlock.height;
        const sourceBlockId = this.justifiedBlock.id;
        const targetHeight = this.lastBlock.height;
        const targetBlockId = this.lastBlock.id;

        return { sourceHeight, sourceBlockId, targetHeight, targetBlockId };
    }

    public hasEnoughVotes(votes: readonly ISchnorrMultiSignature[]): boolean {
        const votingTarget = this.getVotingTarget();
        const validators = this.getValidators();
        const votedValidators = Utils.getVotedValidators(votingTarget, validators, votes);

        for (const validatorSet of [this.finalizedValidators, this.lastValidators, this.currentValidators]) {
            const voteThreshold = (validatorSet.length * 2) / 3;
            const voteCount = validatorSet.filter((validator) => votedValidators.includes(validator)).length;

            if (voteCount < voteThreshold) {
                return false;
            }
        }

        return true;
    }

    public getCurrentSlot(timestamp: number): ISlot {
        if (timestamp < this.lastSlot.timestamp + this.lastSlot.duration) {
            throw new CryptoError("Invalid timestamp.");
        }

        const timestampDelta = timestamp - this.lastSlot.timestamp;
        const slotNoChange = Math.floor(timestampDelta / this.lastSlot.duration);
        const slotTimestampChange = slotNoChange * this.lastSlot.duration;

        const currentSlot = {
            no: this.lastSlot.no + slotNoChange,
            timestamp: this.lastSlot.timestamp + slotTimestampChange,
            duration: configManager.getMilestone(this.lastBlock.height + 1).blocktime,
        };

        return currentSlot;
    }

    public getCurrentForger(slot: ISlot): string {
        if (slot.no <= this.lastSlot.no) {
            throw new CryptoError("Invalid slot.");
        }

        return this.currentForgers[slot.no % this.currentForgers.length];
    }

    public chainBlock(currentBlock: B): ITransitionState<B> {
        try {
            if (currentBlock.previousBlock !== this.lastBlock.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (currentBlock.height !== this.lastBlock.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const forgedTransactionCount = this.forgedTransactionCount + currentBlock.numberOfTransactions;
            const currentSlot = this.getCurrentSlot(currentBlock.timestamp);
            const currentForger = this.getCurrentForger(currentSlot);

            if (currentBlock.generatorPublicKey !== currentForger) {
                throw new CryptoError("Invalid generator public key.");
            }

            let justifiedBlock = this.justifiedBlock;
            let finalizedBlock = this.finalizedBlock;
            let finalizedValidators = this.finalizedValidators;
            let finalizedTransactionCount = this.finalizedTransactionCount;

            if (currentBlock.version === 1 && this.hasEnoughVotes(currentBlock.previousBlockVotes)) {
                justifiedBlock = this.lastBlock;

                if (justifiedBlock.height === this.justifiedBlock.height + 1) {
                    finalizedBlock = this.justifiedBlock;
                    finalizedValidators = this.lastValidators;
                    finalizedTransactionCount = this.forgedTransactionCount - this.lastBlock.numberOfTransactions;
                }
            }

            return new TransitionState({
                forgedTransactionCount,
                finalizedTransactionCount,
                finalizedValidators,

                finalizedBlock,
                justifiedBlock,

                currentBlock,
                currentSlot,
                currentRound: this.currentRound,
                currentDelegates: this.currentDelegates,
                currentValidators: this.currentValidators,
                currentForgers: this.currentForgers,
            });
        } catch (cause) {
            const msg = `Cannot chain new block (height=${currentBlock.height}, id=${currentBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }
}
