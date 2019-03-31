import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Dato } from "@faustbrian/dato";

import { constants, ITransactionData, models, Transaction } from "@arkecosystem/crypto";

export class Connection implements TransactionPool.IConnection {
    public options: any;

    public async make(): Promise<this> {
        return this;
    }

    public driver(): any {
        return;
    }

    public disconnect(): void {
        return;
    }

    public getPoolSize(): number {
        return 0;
    }

    public getSenderSize(senderPublicKey: string): number {
        return 0;
    }

    public addTransactions(
        transactions: Transaction[],
    ): {
        added: Transaction[];
        notAdded: TransactionPool.IAddTransactionErrorResponse[];
    } {
        return { added: [], notAdded: [] };
    }

    public addTransaction(transaction: Transaction): TransactionPool.IAddTransactionResponse {
        return null;
    }

    public removeTransaction(transaction: Transaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public getTransactionsForForging(blockSize: number): string[] {
        return [];
    }

    public getTransaction(id: string): Transaction {
        return null;
    }

    public getTransactions(start: number, size: number, maxBytes?: number): Buffer[] {
        return [];
    }

    public getTransactionIdsForForging(start: number, size: number): string[] {
        return null;
    }

    public getTransactionsData(start: number, size: number, property: string, maxBytes?: number): string[] | Buffer[] {
        return null;
    }

    public getTransactionsByType(type: any): any {
        return;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        return;
    }

    public hasExceededMaxTransactions(transaction: ITransactionData): boolean {
        return true;
    }

    public flush(): void {
        return;
    }

    public transactionExists(transactionId: string): any {
        return;
    }

    public isSenderBlocked(senderPublicKey: string): boolean {
        return true;
    }

    public blockSender(senderPublicKey: string): Dato {
        return null;
    }

    public acceptChainedBlock(block: models.Block): void {
        return;
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public purgeSendersWithInvalidTransactions(block: models.Block): void {
        return;
    }

    public purgeBlock(block: models.Block): void {
        return;
    }

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: constants.TransactionTypes): boolean {
        return true;
    }
}
