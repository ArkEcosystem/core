/* tslint:disable:no-empty */
import { State } from "@arkecosystem/core-interfaces";
import { Blocks, Interfaces } from "@arkecosystem/crypto";

export class StateStoreStub implements State.IStateStore {
    public blockchain: any;
    public lastDownloadedBlock: Interfaces.IBlockData | undefined;
    public genesisBlock: Interfaces.IBlock | undefined;
    public blockPing: any;
    public started: boolean;
    public forkedBlock: Interfaces.IBlock | undefined;
    public wakeUpTimeout: any;
    public noBlockCounter: number = 0;
    public p2pUpdateCounter: number = 0;
    public numberOfBlocksToRollback: number | undefined;
    public networkStart: boolean;

    public cacheTransactions(
        transactions: Interfaces.ITransactionData[],
    ): { added: Interfaces.ITransactionData[]; notAdded: Interfaces.ITransactionData[] } {
        return undefined;
    }

    public clear(): void {}

    public clearWakeUpTimeout(): void {}

    public getCachedTransactionIds(): string[] {
        return [];
    }

    public getCommonBlocks(ids: string[]): Interfaces.IBlockData[] {
        return [];
    }

    public getLastHeight(): number {
        const lastBlock = this.getLastBlock();

        return lastBlock ? lastBlock.data.height : 1;
    }

    public getGenesisBlock(): Interfaces.IBlock {
        return this.genesisBlock;
    }

    public setGenesisBlock(block: Interfaces.IBlock): void {
        this.genesisBlock = block;
    }

    public getLastBlock(): Interfaces.IBlock | undefined {
        return Blocks.BlockFactory.fromData(this.lastDownloadedBlock) || undefined;
    }

    public getLastBlockIds(): string[] {
        return [];
    }

    public getLastBlocks(): Interfaces.IBlock[] {
        return [];
    }

    public getLastBlocksByHeight(start: number, end?: number, headersOnly?: boolean): Interfaces.IBlockData[] {
        return [];
    }

    public pingBlock(incomingBlock: Interfaces.IBlockData): boolean {
        return false;
    }

    public pushPingBlock(block: Interfaces.IBlockData): void {
        this.blockPing = {
            count: 1,
            first: new Date().getTime(),
            last: new Date().getTime(),
            block,
        };
    }

    public clearCachedTransactionIds(): void {}

    public reset(): void {}

    public setLastBlock(block: Blocks.Block): void {
        this.lastDownloadedBlock = block.data;
    }
}

export const stateStorageStub = new StateStoreStub();
