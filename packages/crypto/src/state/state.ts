import { IBlockHeader, ISlot, IState, IStateData, IStateNext } from "../interfaces";

export class State implements IState {
    private data: IStateData;

    public constructor(data: IStateData) {
        this.data = data;
    }

    public get finalizedTransactionCount(): number {
        return this.data.finalizedTransactionCount;
    }

    public get forgedTransactionCount(): number {
        return this.data.forgedTransactionCount;
    }

    public get finalizedHeight(): number {
        return this.data.finalizedHeight;
    }

    public get finalizedBlockId(): string {
        return this.data.finalizedBlockId;
    }

    public get justifiedHeight(): number {
        return this.data.justifiedHeight;
    }

    public get justifiedBlockId(): string {
        return this.data.justifiedBlockId;
    }

    public get lastSlot(): ISlot {
        return this.data.lastSlot;
    }

    public get lastHeight(): number {
        return this.data.lastHeight;
    }

    public get lastBlockId(): string {
        return this.data.lastBlockId;
    }

    public get next(): IStateNext | undefined {
        return this.data.next;
    }

    public chainNewBlock(header: IBlockHeader): void {
        // const nextData = { ...this.data };
        // const milestone = configManager.getMilestone(this.data.lastBlockRound.height);
        // const nextRoundHeight = this.data.lastBlockRound.height + milestone.activeDelegates;
        // nextData.forgedTransactionCount += header.numberOfTransactions;
        // this.data = nextData;
        // if (this.lastHeight === nextRoundHeight - 1) {
        //     // this.next = undefined;
        // }
    }

    public applyNextRound(delegates: readonly string[]): void {
        throw new Error("Method not implemented.");
    }

    public clone(): IState {
        return new State({ ...this.data });
    }

    // private updateNext(): void {
    //     const milestone = configManager.getMilestone(this.lastBlockRound.height);
    //     const nextRoundHeight = this.lastBlockRound.height + milestone.activeDelegates;

    //     if (this.lastHeight === nextRoundHeight - 1) {
    //         this.next = undefined;
    //     }

    //     if (!this.next) {
    //         // const forgers =

    //         const trustedValidators = this.finalizedRound.delegates.slice().sort();
    //         const pendingValidators = this.lastBlockRound.delegates
    //             .filter((delegate) => trustedValidators.includes(delegate) === false)
    //             .sort();

    //         const validators = [...trustedValidators, ...pendingValidators];
    //     }
    // }
}
