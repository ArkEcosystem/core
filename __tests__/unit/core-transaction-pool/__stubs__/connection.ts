import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Blocks, Enums, Interfaces } from "@arkecosystem/crypto";
import { Dato } from "@faustbrian/dato";

export class Connection implements TransactionPool.IConnection {
    public options: any;
    public loggedAllowedSenders: string[];
    public walletManager: any;

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
        transactions: Interfaces.ITransaction[],
    ): {
        added: Interfaces.ITransaction[];
        notAdded: TransactionPool.IAddTransactionErrorResponse[];
    } {
        return { added: [], notAdded: [] };
    }

    public addTransaction(transaction: Interfaces.ITransaction): TransactionPool.IAddTransactionResponse {
        return null;
    }

    public removeTransaction(transaction: Interfaces.ITransaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public getTransactionsForForging(blockSize: number): string[] {
        return [];
    }

    public getTransaction(id: string): Interfaces.ITransaction {
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

    public hasExceededMaxTransactions(transaction: Interfaces.ITransactionData): boolean {
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

    public acceptChainedBlock(block: Blocks.Block): void {
        return;
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public purgeSendersWithInvalidTransactions(block: Blocks.Block): void {
        return;
    }

    public purgeBlock(block: Blocks.Block): void {
        return;
    }

    public senderHasTransactionsOfType(senderPublicKey: string, transactionType: Enums.TransactionTypes): boolean {
        return true;
    }
}
