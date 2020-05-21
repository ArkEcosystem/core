import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";

@Container.injectable()
export class Worker implements Contracts.TransactionPool.Worker {
    @Container.inject(Container.Identifiers.TransactionPoolWorkerIpcSubprocessFactory)
    private readonly createWorkerSubprocess!: Contracts.TransactionPool.WorkerIpcSubprocessFactory;

    private ipcSubprocess!: Contracts.TransactionPool.WorkerIpcSubprocess;
    private lastHeight = 0;

    @Container.postConstruct()
    public initialize(): void {
        this.ipcSubprocess = this.createWorkerSubprocess();
    }

    public getQueueSize(): number {
        return this.ipcSubprocess.getQueueSize();
    }

    public loadCryptoPackage(packageName: string): void {
        this.ipcSubprocess.sendAction("loadCryptoPackage", packageName);
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData,
    ): Promise<Interfaces.ITransaction> {
        const currentHeight = Managers.configManager.getHeight()!;
        if (currentHeight !== this.lastHeight) {
            this.lastHeight = currentHeight;
            this.ipcSubprocess.sendAction("setConfig", Managers.configManager.all());
            this.ipcSubprocess.sendAction("setHeight", currentHeight);
        }

        const { id, serialized } = await this.ipcSubprocess.sendRequest("getTransactionFromData", transactionData);
        return Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(serialized, "hex"), id);
    }
}
