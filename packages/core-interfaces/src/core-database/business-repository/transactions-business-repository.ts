import { IParameters } from "./parameters";

export interface ITransactionsBusinessRepository {
    findAll(params: IParameters, sequenceOrder?: "asc" | "desc"): Promise<any>;

    findAllLegacy(parameters: IParameters): Promise<any>;

    findWithVendorField(): Promise<any>;

    findAllByWallet(wallet, parameters?: IParameters): Promise<any>;

    findAllBySender(senderPublicKey, parameters?: IParameters): Promise<any>;

    findAllByRecipient(recipientId, parameters?: IParameters): Promise<any>;

    allVotesBySender(senderPublicKey, parameters?: IParameters): Promise<any>;

    findAllByBlock(blockId, parameters?: IParameters): Promise<any>;

    findAllByType(type, parameters?: IParameters): Promise<any>;

    findById(id: string): Promise<any>;

    findByTypeAndId(type: any, id: string): Promise<any>;

    getFeeStatistics(): Promise<any>;

    search(params: IParameters): Promise<any>;
}
