import { Container, Contracts, Providers, Enums } from "@arkecosystem/core-kernel";
import { WalletEvent } from "./wallet-event";

@Container.injectable()
export class WalletSyncService {
    @Container.inject(Container.Identifiers.PluginConfiguration)
    @Container.tagged("plugin", "@arkecosystem/core-state")
    private readonly configuration!: Providers.PluginConfiguration;

    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    @Container.inject(Container.Identifiers.EventDispatcherService)
    private readonly events!: Contracts.Kernel.EventDispatcher;

    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    @Container.inject(Container.Identifiers.StateStore)
    private readonly stateStore!: Contracts.State.StateStore;

    @Container.inject(Container.Identifiers.DatabaseWalletsTableService)
    private readonly walletsTableService!: Contracts.Database.WalletsTableService;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    private readonly updatedAddresses = new Set<string>();

    public boot(): void {
        if (this.configuration.getRequired("walletSync.enabled") || true) {
            this.events.listenOnce(Enums.StateEvent.BuilderFinished, {
                handle: () => this.onStateBuilderFinished(),
            });
        }
    }

    private async onStateBuilderFinished(): Promise<void> {
        this.events.listen(WalletEvent.AttributeSet, {
            handle: ({ data }) => this.updatedAddresses.add(data.wallet.address),
        });

        this.events.listen(WalletEvent.AttributeForget, {
            handle: ({ data }) => this.updatedAddresses.add(data.wallet.address),
        });

        this.events.listen(WalletEvent.PropertySet, {
            handle: ({ data }) => this.updatedAddresses.add(data.wallet.address),
        });

        this.events.listen(Enums.BlockEvent.Applied, {
            handle: ({ data }) => this.syncWalletsTable(data.height),
        });

        this.events.listen(Enums.BlockEvent.Reverted, {
            handle: ({ data }) => this.syncWalletsTable(data.height - 1),
        });

        await this.initializeWalletsTable(this.stateStore.getLastHeight());
    }

    private async initializeWalletsTable(blockHeight: number): Promise<void> {
        try {
            this.logger.debug(`Initializing wallets table at height ${blockHeight}`);

            await this.walletsTableService.flush();
            await this.walletsTableService.sync(this.walletRepository.allByAddress());

            this.logger.info(`Wallets table initialized at height ${blockHeight}`);
        } catch (error) {
            this.app.terminate("Failed to initialize wallets table", error);
        }
    }

    private async syncWalletsTable(blockHeight: number): Promise<void> {
        try {
            this.logger.debug(`Synchronizing wallets table at height ${blockHeight}`);

            const updatedWallets = Array.from(this.updatedAddresses.values()).map((address) =>
                this.walletRepository.findByAddress(address),
            );

            this.updatedAddresses.clear();

            await this.walletsTableService.sync(updatedWallets);

            this.logger.info(`Wallets table synchronized at height ${blockHeight}`);
        } catch (error) {
            this.app.terminate("Failed to synchronize wallets table", error);
        }
    }
}
