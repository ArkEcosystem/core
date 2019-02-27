/* tslint:disable:no-empty */
import { Blockchain } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";

export class StateStorageStub implements Blockchain.IStateStorage {
    public cacheTransactions(
        transactions: models.ITransactionData[],
    ): { added: models.ITransactionData[]; notAdded: models.ITransactionData[] } {
        return undefined;
    }

    public clear(): void {}

    public clearWakeUpTimeout(): void {}

    public getCachedTransactionIds(): string[] {
        return [];
    }

    public getCommonBlocks(ids: string[]): models.IBlockData[] {
        return [];
    }

    public getLastBlock(): models.Block | null {
        return undefined;
    }

    public getLastBlockIds(): string[] {
        return [];
    }

    public getLastBlocks(): models.Block[] {
        return [];
    }

    public getLastBlocksByHeight(start: number, end?: number): models.IBlockData[] {
        return [];
    }

    public pingBlock(incomingBlock: models.IBlockData): boolean {
        return false;
    }

    public pushPingBlock(block: models.IBlockData): void {}

    public removeCachedTransactionIds(transactionIds: string[]): void {}

    public reset(): void {}

    public setLastBlock(block: models.Block): void {}
}
