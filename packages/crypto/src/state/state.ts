import { CryptoError } from "../errors";
import { IBlockHeader, ISlot, IState, IStateData } from "../interfaces";
import { configManager } from "../managers";
import { Consensus } from "./consensus";
import { Rounds } from "./rounds";
import { Slots } from "./slots";

export class State<B extends IBlockHeader> implements IState<B> {
    public nextDelegates?: readonly string[];

    private readonly data: IStateData<B>;

    public constructor(data: IStateData<B>, nextDelegates?: readonly string[]) {
        this.data = data;
        this.nextDelegates = nextDelegates;
    }

    public get finalizedTransactionCount(): number {
        return this.data.finalizedTransactionCount;
    }

    public get forgedTransactionCount(): number {
        return this.data.forgedTransactionCount;
    }

    public get finalizedBlock(): B {
        return this.data.finalizedBlock;
    }

    public get justifiedBlock(): B {
        return this.data.justifiedBlock;
    }

    public get lastBlock(): B {
        return this.data.lastBlock;
    }

    public get lastSlot(): ISlot {
        return this.data.lastSlot;
    }

    public get finalizedDelegates(): readonly string[] {
        return this.data.finalizedDelegates;
    }

    public get lastDelegates(): readonly string[] {
        return this.data.lastDelegates;
    }

    public createNextState(nextLastBlock: B): State<B> {
        try {
            if (!this.nextDelegates) {
                throw new CryptoError("Next round not applied.");
            }

            if (nextLastBlock.previousBlock !== this.lastBlock.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (nextLastBlock.height !== this.lastBlock.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const nextLastSlot = Slots.getSubsequentSlot(
                this.data.lastBlock.height,
                this.data.lastSlot,
                nextLastBlock.height,
                nextLastBlock.timestamp,
            );

            const nextMilestone = configManager.getMilestone(nextLastBlock.height);
            const nextForgerIndex = nextLastSlot.no % nextMilestone.activeDelegates;

            if (nextLastSlot.no <= this.lastSlot.no) {
                throw new CryptoError("Invalid timestamp.");
            }

            if (nextLastBlock.generatorPublicKey !== this.nextDelegates[nextForgerIndex]) {
                throw new CryptoError("Invalid generator public key.");
            }

            const nextLastDelegates = this.nextDelegates;
            const nextForgedTransactoinCount = this.data.forgedTransactionCount + nextLastBlock.numberOfTransactions;

            let nextJustifiedBlock = this.data.justifiedBlock;
            let nextFinalizedBlock = this.data.finalizedBlock;
            let nextFinalizedDelegates = this.data.finalizedDelegates;
            let nextFinalizedTransactionCount = this.data.finalizedTransactionCount;

            if (nextLastBlock.version === 1 && Consensus.hasSupermajorityVote(this, nextLastBlock.previousBlockVotes)) {
                nextJustifiedBlock = this.data.lastBlock;

                if (nextJustifiedBlock.height === this.data.justifiedBlock.height + 1) {
                    nextFinalizedBlock = this.data.justifiedBlock;
                    nextFinalizedDelegates = this.data.lastDelegates;
                    nextFinalizedTransactionCount =
                        this.data.forgedTransactionCount - this.data.lastBlock.numberOfTransactions;
                }
            }

            if (nextMilestone.height === nextLastBlock.height && nextMilestone.finalizedDelegates) {
                const lastMilestone = configManager.getMilestone(this.lastBlock.height);

                if (lastMilestone.finalizedDelegates !== nextMilestone.finalizedDelegates) {
                    nextFinalizedDelegates = nextMilestone.finalizedDelegates;
                }
            }

            const nextData = {
                finalizedTransactionCount: nextFinalizedTransactionCount,
                forgedTransactionCount: nextForgedTransactoinCount,
                finalizedBlock: nextFinalizedBlock,
                justifiedBlock: nextJustifiedBlock,
                lastBlock: nextLastBlock,
                lastSlot: nextLastSlot,
                finalizedDelegates: nextFinalizedDelegates,
                lastDelegates: nextLastDelegates,
            };

            if (Rounds.getRound(nextLastBlock.height) === Rounds.getRound(nextLastBlock.height + 1)) {
                return new State(nextData, this.nextDelegates);
            } else {
                return new State(nextData);
            }
        } catch (cause) {
            const msg = `Cannot chain new block (height=${nextLastBlock.height}, id=${nextLastBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }

    public applyRound(delegatePublicKeys: readonly string[]): void {
        if (this.nextDelegates) {
            throw new CryptoError("Next round already applied.");
        }

        const nextRound = Rounds.getRound(this.lastBlock.height + 1);
        const nextMilestone = configManager.getMilestone(this.lastBlock.height + 1);

        if (delegatePublicKeys.length !== nextMilestone.activeDelegates) {
            throw new CryptoError("Invalid delegates count.");
        }

        this.nextDelegates = Rounds.getShuffledDelegates(nextRound, delegatePublicKeys);
    }
}
