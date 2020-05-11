import { Container, Contracts, Providers, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { fork } from "child_process";

type PromiseCallbacks = {
    resolve: (payload: { id: string; serialized: string }) => void;
    reject: (error: Error) => void;
};

@Container.injectable()
export class FactoryWorker implements Contracts.TransactionPool.FactoryWorker {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-transaction-pool")
    private readonly pluginConfiguration!: Providers.PluginConfiguration;

    private lastHeight = 0;
    private nextId = 1;
    private subprocess!: ReturnType<typeof fork>;
    private readonly promises = new Map<number, PromiseCallbacks>();

    @Container.postConstruct()
    public initialize() {
        this.subprocess = fork(`${__dirname}/factory-process.js`);

        this.subprocess.on("message", (response: Contracts.TransactionPool.TransactionFromDataResponse) => {
            const p = this.promises.get(response.id);
            AppUtils.assert.defined<PromiseCallbacks>(p);

            switch (response.type) {
                case Contracts.TransactionPool.ActionType.TransactionFromDataSuccess:
                    p.resolve(response.payload);
                    break;
                case Contracts.TransactionPool.ActionType.TransactionFromDataError:
                    p.reject(new Error(response.error.message));
                    break;
                default:
                    throw new Error("Unreachable");
            }
        });
    }

    public getQueueSize(): number {
        return this.promises.size;
    }

    public async getTransactionFromData(
        transactionData: Interfaces.ITransactionData,
    ): Promise<Interfaces.ITransaction> {
        const id = this.nextId++;
        const promise = new Promise<{ id: string; serialized: string }>((resolve, reject) => {
            this.promises.set(id, { resolve, reject });

            const height = Managers.configManager.getHeight()!;
            if (height !== this.lastHeight) {
                this.lastHeight = height;
                this.pluginConfiguration
                    .getRequired<{ packageName: string }[]>("factoryPool.cryptoPackages")
                    .map((p) => this.loadCryptoPackage(p.packageName));
                this.setHeight(height);
                this.setNetworkConfig(Managers.configManager["config"]);
                this.setMilestone(Managers.configManager.getMilestone());
            }

            const request: Contracts.TransactionPool.TransactionFromDataRequest = {
                type: Contracts.TransactionPool.ActionType.TransactionFromDataRequest,
                id,
                payload: { transactionData },
            };

            this.sendAction(request);
        });

        try {
            const { id, serialized } = await promise;
            const buffer = Buffer.from(serialized, "hex");
            return Transactions.TransactionFactory.fromBytesUnsafe(buffer, id);
        } finally {
            this.promises.delete(id);
        }
    }

    private loadCryptoPackage(packageName: string): void {
        const action: Contracts.TransactionPool.LoadCryptoPackageAction = {
            type: Contracts.TransactionPool.ActionType.LoadCryptoPackage,
            payload: {
                packageName,
            },
        };

        this.sendAction(action);
    }

    private setHeight(height: number): void {
        const action: Contracts.TransactionPool.SetHeightAction = {
            type: Contracts.TransactionPool.ActionType.SetHeight,
            payload: {
                height,
            },
        };

        this.sendAction(action);
    }

    private setNetworkConfig(networkConfig: any): void {
        const action: Contracts.TransactionPool.SetNetworkConfigAction = {
            type: Contracts.TransactionPool.ActionType.SetNetworkConfig,
            payload: {
                networkConfig,
            },
        };

        this.sendAction(action);
    }

    private setMilestone(milestoneData: Interfaces.IMilestone["data"]): void {
        const action: Contracts.TransactionPool.SetMilestoneAction = {
            type: Contracts.TransactionPool.ActionType.SetMilestone,
            payload: {
                milestoneData,
            },
        };

        this.sendAction(action);
    }

    private sendAction(action: Contracts.TransactionPool.FactoryAction): void {
        this.subprocess.send(action);
    }
}
