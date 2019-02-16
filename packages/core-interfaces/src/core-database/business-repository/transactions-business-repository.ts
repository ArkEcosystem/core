export interface ITransactionsBusinessRepository {

    findAll(params: any, sequenceOrder?: "asc" | "desc"): Promise<any>;
    findAllLegacy(parameters: any): Promise<any>;
    findWithVendorField(): Promise<any>;
    findAllByWallet(wallet, parameters: any): Promise<any>;
    findAllBySender(senderPublicKey, parameters: any): Promise<any>;
    findAllByRecipient(recipientId, parameters: any): Promise<any>;
    allVotesBySender(senderPublicKey, parameters: any): Promise<any>;
    findAllByBlock(blockId, parameters: any): Promise<any>;
    findAllByType(type, parameters: any): Promise<any>;
    findById(id: string): Promise<any>;
    findByTypeAndId(type: any, id: string): Promise<any>;
    getFeeStatistics(): Promise<any>;
    search(parameters): Promise<any>;
}
