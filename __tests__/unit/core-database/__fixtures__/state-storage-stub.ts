/* tslint:disable:no-empty */
import { Blockchain } from "@arkecosystem/core-interfaces";
import { blocks, interfaces } from "@arkecosystem/crypto";

export class StateStorageStub implements Blockchain.IStateStorage {
    public cacheTransactions(
        transactions: interfaces.ITransactionData[],
    ): { added: interfaces.ITransactionData[]; notAdded: interfaces.ITransactionData[] } {
        return undefined;
    }

    public clear(): void {}

    public clearWakeUpTimeout(): void {}

    public getCachedTransactionIds(): string[] {
        return [];
    }

    public getCommonBlocks(ids: string[]): interfaces.IBlockData[] {
        return [];
    }

    public getLastBlock(): blocks.Block | null {
        return undefined;
    }

    public getLastBlockIds(): string[] {
        return [];
    }

    public getLastBlocks(): blocks.Block[] {
        return [];
    }

    public getLastBlocksByHeight(start: number, end?: number): interfaces.IBlockData[] {
        return [];
    }

    public pingBlock(incomingBlock: interfaces.IBlockData): boolean {
        return false;
    }

    public pushPingBlock(block: interfaces.IBlockData): void {}

    public removeCachedTransactionIds(transactionIds: string[]): void {}

    public reset(): void {}

    public setLastBlock(block: blocks.Block): void {}
}
