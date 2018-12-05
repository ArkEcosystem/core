import { ConnectionInterface } from "../../src";

class FakeConnection extends ConnectionInterface {
    public connect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public disconnect(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public verifyBlockchain(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    public getActiveDelegates(height: any, delegates?: any): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    public buildWallets(height: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public saveWallets(force: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public saveBlock(block: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public enqueueSaveBlock(block: any): void {
        throw new Error("Method not implemented.");
    }
    public enqueueDeleteBlock(block: any): void {
        throw new Error("Method not implemented.");
    }
    public enqueueDeleteRound(height: any): void {
        throw new Error("Method not implemented.");
    }
    public commitQueuedQueries(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public deleteBlock(block: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public getBlock(id: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
    public getLastBlock(): Promise<any> {
        throw new Error("Method not implemented.");
    }
    public getBlocks(offset: any, limit: any): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    public getTopBlocks(count: any): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    public getRecentBlockIds(): Promise<string[]> {
        throw new Error("Method not implemented.");
    }
    public saveRound(activeDelegates: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public deleteRound(round: any): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public getTransaction(id: any): Promise<any> {
        throw new Error("Method not implemented.");
    }
}

export const make = (options = {}) => new FakeConnection(options);
