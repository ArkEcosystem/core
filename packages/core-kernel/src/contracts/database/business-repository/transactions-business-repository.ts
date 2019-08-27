import { Enums, Interfaces } from "@arkecosystem/crypto";
import { Wallet } from "../../state/wallets";
import { Parameters } from "./parameters";

export interface TransactionsPaginated {
    rows: Interfaces.ITransactionData[];
    count: number;
}

export interface TransactionsBusinessRepository {
    search(params: Parameters, sequenceOrder?: "asc" | "desc"): Promise<TransactionsPaginated>;

    findAllByWallet(wallet: Wallet, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllBySender(senderPublicKey: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByRecipient(recipientId: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    allVotesBySender(senderPublicKey: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByBlock(blockId: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByType(type: number, parameters?: Parameters): Promise<TransactionsPaginated>;

    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByTypeAndId(type: number, id: string): Promise<Interfaces.ITransactionData>;

    getAssetsByType(type: Enums.TransactionType | number): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

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
