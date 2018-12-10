// tslint:disable:no-empty

import { ConnectionInterface } from "../../src/interface";

export class DummyConnection extends ConnectionInterface {
    public async connect(): Promise<void> {}

    public async disconnect(): Promise<void> {}

    public async verifyBlockchain(): Promise<any> {
        return true;
    }

    public async getActiveDelegates(height, delegates?): Promise<any[]> {
        return [];
    }

    public async buildWallets(height): Promise<boolean> {
        return true;
    }

    public async saveWallets(force): Promise<void> {}

    public async saveBlock(block): Promise<void> {}

    public enqueueSaveBlock(block): void {}

    public enqueueDeleteBlock(block): void {}

    public enqueueDeleteRound(height): void {}

    public async commitQueuedQueries(): Promise<void> {}

    public async deleteBlock(block): Promise<void> {}

    public async getBlock(id): Promise<any> {
        return true;
    }

    public async getLastBlock(): Promise<any> {
        return true;
    }

    public async getBlocks(offset, limit): Promise<any[]> {
        return [];
    }

    public async getTopBlocks(count): Promise<any[]> {
        return [];
    }

    public async getRecentBlockIds(): Promise<string[]> {
        return [];
    }

    public async saveRound(activeDelegates): Promise<void> {}

    public async deleteRound(round): Promise<void> {}

    public async getTransaction(id): Promise<any> {
        return true;
    }
}
