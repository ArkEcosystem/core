import { CryptoError } from "../errors";
import { IBlockHeader, IRound, ISlot, IState, IStateData, IStateNext } from "../interfaces";
import { configManager } from "../managers";
import { Utils } from "./utils";

export class State<B extends IBlockHeader> implements IState<B> {
    public finalizedTransactionCount: number;
    public forgedTransactionCount: number;
    public lastRound: IRound;
    public lastSlot: ISlot;
    public lastBlock: B;
    public justifiedBlock: B;
    public finalizedBlock: B;
    public finalizedRound: IRound;
    public next?: IStateNext | undefined;

    public constructor(data: IStateData<B>) {
        this.finalizedTransactionCount = data.finalizedTransactionCount;
        this.forgedTransactionCount = data.forgedTransactionCount;
        this.lastRound = data.lastRound;
        this.lastSlot = data.lastSlot;
        this.lastBlock = data.lastBlock;
        this.justifiedBlock = data.justifiedBlock;
        this.finalizedBlock = data.justifiedBlock;
        this.finalizedRound = data.finalizedRound;
        this.next = data.next;
    }

    public chainNewBlock(newBlock: B): void {
        try {
            if (!this.next) {
                throw new CryptoError("No next round.");
            }

            const newMilestone = configManager.getMilestone(newBlock.height);
            const newSlot = Utils.getNewSlot(this.lastSlot, newBlock.height, newBlock.timestamp);
            const newRound = this.next.round;
            const forgerIndex = newSlot.no % newMilestone.activeDelegates;

            if (newBlock.generatorPublicKey !== this.next.forgers[forgerIndex]) {
                throw new CryptoError("Wrong forger.");
            }

            this.forgedTransactionCount += newBlock.numberOfTransactions;
            this.lastBlock = newBlock;
            this.lastRound = newRound;
            this.lastSlot = newSlot;

            const nextRoundHeight = newRound.height + newRound.delegates.length;
            const nextHeight = newBlock.height + 1;

            if (nextHeight === nextRoundHeight) {
                this.next = undefined;
            }
        } catch (cause) {
            const msg = `Cannot chain new block (height=${newBlock.height}, id=${newBlock.id}).`;
            throw new CryptoError(msg, { cause });
        }
    }

    public applyNextRound(delegates: readonly string[]): void {
        if (this.next) {
            throw new CryptoError("Cannot apply next round.");
        }

        const nextHeight = this.lastBlock.height + 1;
        const nextMilestone = configManager.getMilestone(nextHeight);
        const nextRoundNo = this.lastRound.no + 1;

        if (delegates.length !== nextMilestone.activeDelegates) {
            throw new CryptoError("Invalid delegates count.");
        }

        const nextRound = { no: nextRoundNo, height: nextHeight, delegates };
        const nextForgers = Utils.getRoundForgers(nextRound);
        const nextValidators = Utils.getValidators(this.finalizedRound, nextRound);

        this.next = {
            round: nextRound,
            forgers: nextForgers,
            validators: nextValidators,
        };
    }

    public clone(): IState<B> {
        return new State(this);
    }
}
