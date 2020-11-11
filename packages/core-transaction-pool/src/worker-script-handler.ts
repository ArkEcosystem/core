import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

export class WorkerScriptHandler implements Contracts.TransactionPool.WorkerScriptHandler {
    public loadCryptoPackage(packageName: string): void {
        const pkgTransactions = require(packageName).Transactions;
        for (const txConstructor of Object.values(pkgTransactions)) {
            Transactions.TransactionRegistry.registerTransactionType(txConstructor as any);
        }
    }

    public setConfig(networkConfig: any): void {
        Managers.configManager.setConfig(networkConfig);
    }

    public setHeight(height: number): void {
        Managers.configManager.setHeight(height);
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData | Buffer,
    ): Promise<Contracts.TransactionPool.SerializedTransaction> {
        const tx = transactionData instanceof Buffer
            ? Transactions.TransactionFactory.fromBytes(transactionData)
            : Transactions.TransactionFactory.fromData(transactionData);
        return { id: tx.id!, serialized: tx.serialized.toString("hex") };
    }
}
