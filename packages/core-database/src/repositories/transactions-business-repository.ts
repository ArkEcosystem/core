import { Database } from "@arkecosystem/core-interfaces";

export class TransactionsBusinessRepository implements Database.ITransactionsBusinessRepository {

    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {
    }

    public allVotesBySender(senderPublicKey: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAll(params: any, sequenceOrder: "asc" | "desc"): Promise<any> {
        return undefined;
    }

    public findAllByBlock(blockId: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAllByRecipient(recipientId: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAllBySender(senderPublicKey: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAllByType(type: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAllByWallet(wallet: any, parameters: any): Promise<any> {
        return undefined;
    }

    public findAllLegacy(parameters: any): Promise<any> {
        return undefined;
    }

    public findById(id: string): Promise<any> {
        return undefined;
    }

    public findByTypeAndId(type: any, id: string): Promise<any> {
        return undefined;
    }

    public getFeeStatistics(): Promise<any> {
        return undefined;
    }

    public search(parameters: any): Promise<any> {
        return undefined;
    }

}
