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

    public createNextState(nextBlock: B): State<B> {
        if (!this.nextDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        try {
            if (nextBlock.previousBlock !== this.lastBlock.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (nextBlock.height !== this.lastBlock.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const nextBlockSlot = Slots.getFutureSlot(this.lastSlot, nextBlock);
            const nextBlockMilestone = configManager.getMilestone(nextBlock.height);
            const nextBlockForgerIndex = nextBlockSlot.no % nextBlockMilestone.activeDelegates;

            if (nextBlockSlot.no <= this.lastSlot.no) {
                throw new CryptoError("Invalid timestamp.");
            }

            // TODO: future timestamp check

            if (nextBlock.generatorPublicKey !== this.nextDelegates[nextBlockForgerIndex]) {
                throw new CryptoError("Invalid generator public key.");
            }

            const nextData = { ...this.data };
            nextData.lastBlock = nextBlock;
            nextData.lastSlot = nextBlockSlot;
            nextData.lastDelegates = this.nextDelegates;
            nextData.forgedTransactionCount = this.forgedTransactionCount + nextBlock.numberOfTransactions;

            if (nextBlock.version === 1 && Consensus.hasSupermajorityVote(this, nextBlock.previousBlockVotes)) {
                nextData.justifiedBlock = this.lastBlock;

                if (nextData.justifiedBlock.height === this.justifiedBlock.height + 1) {
                    nextData.finalizedDelegates = this.lastDelegates;
                    nextData.finalizedBlock = this.justifiedBlock;
                    nextData.finalizedTransactionCount =
                        this.forgedTransactionCount - this.lastBlock.numberOfTransactions;
                }
            }

            if (nextBlockMilestone.height === nextBlock.height && nextBlockMilestone.finalizedDelegates) {
                const prevBlockMilestone = configManager.getMilestone(nextBlock.height - 1);

                if (prevBlockMilestone.finalizedDelegates !== nextBlockMilestone.finalizedDelegates) {
                    nextData.finalizedDelegates = nextBlockMilestone.finalizedDelegates;
                }
            }

            if (Rounds.getRound(nextBlock.height + 1) === Rounds.getRound(nextBlock.height)) {
                return new State(nextData, this.nextDelegates);
            } else {
                return new State(nextData);
            }
        } catch (cause) {
            const msg = `Cannot chain new block (height=${nextBlock.height}, id=${nextBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }

    public applyRound(delegates: readonly string[]): void {
        if (this.nextDelegates) {
            throw new CryptoError("Next round already applied.");
        }

        const nextRound = Rounds.getRound(this.lastBlock.height + 1);
        const nextMilestone = configManager.getMilestone(this.lastBlock.height + 1);

        if (delegates.length !== nextMilestone.activeDelegates) {
            throw new CryptoError("Invalid delegates count.");
        }

        this.nextDelegates = Rounds.getRoundForgers(nextRound, delegates);
    }
}
