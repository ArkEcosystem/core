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

    public createNewState(newBlock: B): State<B> {
        if (!this.nextDelegates) {
            throw new CryptoError("Next round not applied.");
        }

        try {
            if (newBlock.previousBlock !== this.lastBlock.id) {
                throw new CryptoError("Invalid previous block.");
            }

            if (newBlock.height !== this.lastBlock.height + 1) {
                throw new CryptoError("Invalid height.");
            }

            const newBlockSlot = Slots.getFutureSlot(this.lastSlot, newBlock);
            const newBlockMilestone = configManager.getMilestone(newBlock.height);
            const newBlockForgerIndex = newBlockSlot.no % newBlockMilestone.activeDelegates;

            if (newBlockSlot.no <= this.lastSlot.no) {
                throw new CryptoError("Invalid timestamp.");
            }

            // TODO: future timestamp check

            if (newBlock.generatorPublicKey !== this.nextDelegates[newBlockForgerIndex]) {
                throw new CryptoError("Invalid generator public key.");
            }

            const newData = { ...this.data };
            newData.lastBlock = newBlock;
            newData.lastSlot = newBlockSlot;
            newData.lastDelegates = this.nextDelegates;
            newData.forgedTransactionCount = this.forgedTransactionCount + newBlock.numberOfTransactions;

            if (newBlock.version === 1 && Consensus.hasSupermajorityVote(this, newBlock.previousBlockVotes)) {
                newData.justifiedBlock = this.lastBlock;

                if (newData.justifiedBlock.height === this.justifiedBlock.height + 1) {
                    newData.finalizedDelegates = this.lastDelegates;
                    newData.finalizedBlock = this.justifiedBlock;
                    newData.finalizedTransactionCount =
                        this.forgedTransactionCount - this.lastBlock.numberOfTransactions;
                }
            }

            if (newBlockMilestone.height === newBlock.height && newBlockMilestone.finalizedDelegates) {
                const prevBlockMilestone = configManager.getMilestone(newBlock.height - 1);

                if (prevBlockMilestone.finalizedDelegates !== newBlockMilestone.finalizedDelegates) {
                    newData.finalizedDelegates = newBlockMilestone.finalizedDelegates;
                }
            }

            if (Rounds.getRound(newBlock.height + 1) === Rounds.getRound(newBlock.height)) {
                return new State(newData, this.nextDelegates);
            } else {
                return new State(newData);
            }
        } catch (cause) {
            const msg = `Cannot chain new block (height=${newBlock.height}, id=${newBlock.id}).`;
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
