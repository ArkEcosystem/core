import { CryptoSuite, Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export class WorkerScriptHandler implements Contracts.TransactionPool.WorkerScriptHandler {
    private transactionManager!: CryptoSuite.TransactionManager;
    private cryptoManager!: CryptoSuite.CryptoManager;
    private transactionTypes: Transactions.TransactionConstructor<
        BlockInterfaces.IBlockData,
        Interfaces.ITransactionData
    >[] = [];

    public loadCryptoPackage(packageName: string): void {
        const pkgTransactions = require(packageName).Transactions;
        for (const txConstructor of Object.values(pkgTransactions)) {
            this.transactionTypes.push(
                txConstructor as Transactions.TransactionConstructor<
                    BlockInterfaces.IBlockData,
                    Interfaces.ITransactionData
                >,
            );
        }
    }

    public setConfig(networkConfig: Interfaces.NetworkConfig<BlockInterfaces.IBlockData>): void {
        const cryptoSuite = new CryptoSuite.CryptoSuite(networkConfig);
        this.transactionManager = cryptoSuite.TransactionManager;
        this.cryptoManager = cryptoSuite.CryptoManager;
        for (const txConstructor of Object.values(this.transactionTypes)) {
            this.transactionManager.TransactionTools.TransactionRegistry.registerTransactionType(txConstructor);
        }
    }

    public setHeight(height: number): void {
        this.cryptoManager.HeightTracker.setHeight(height);
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData,
    ): Promise<Contracts.TransactionPool.SerializedTransaction> {
        const tx = this.transactionManager.TransactionFactory.fromData(transactionData);
        return { id: tx.id!, serialized: tx.serialized.toString("hex") };
    }
}
