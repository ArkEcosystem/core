import { Interfaces } from "@arkecosystem/crypto";
import { IWallet } from "../wallet-manager";
import { IParameters } from "./parameters";

export interface ITransactionsPaginated {
    rows: Interfaces.ITransactionData[];
    count: number;
}

export interface ITransactionsBusinessRepository {
    search(params: IParameters, sequenceOrder?: "asc" | "desc"): Promise<ITransactionsPaginated>;

    findAllByWallet(wallet: IWallet, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByRecipient(recipientId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    allVotesBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByBlock(blockId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByType(type: number, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByTypeAndId(type: number, id: string): Promise<Interfaces.ITransactionData>;

    getFeeStatistics(
        days: number,
    ): Promise<
        Array<{
            type: number;
            fee: number;
            timestamp: number;
        }>
    >;
}
