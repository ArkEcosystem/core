import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Identities, Managers } from "@arkecosystem/crypto";

@Container.injectable()
export class ForgerTracker {
    @Container.inject(Container.Identifiers.ConfigRepository)
    protected readonly configRepository!: Services.Config.ConfigRepository;

    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Log.Logger;

    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchainService!: Contracts.Blockchain.Blockchain;

    @Container.inject(Container.Identifiers.DatabaseService)
    protected readonly databaseService!: Contracts.Database.DatabaseService;

    @Container.inject(Container.Identifiers.TransactionPoolService)
    protected readonly transactionPoolService!: Contracts.TransactionPool.Connection;

    public async execute(): Promise<void> {
        const configuredDelegates: string[] | undefined = this.configRepository.get("delegates.secrets");

        if (!configuredDelegates) {
            return;
        }

        // Arrange...
        const { height, timestamp } = this.blockchainService.getLastBlock().data;
        const delegatesCount = Managers.configManager.getMilestone(height).activeDelegates;
        const blockTime: number = Managers.configManager.getMilestone(height).blocktime;
        const round: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(height);

        const activeDelegates: (string | undefined)[] = (await this.databaseService.getActiveDelegates(round)).map(
            (delegate: Contracts.State.Wallet) => delegate.publicKey,
        );

        // Determine Next Forgers...
        const nextForgers: string[] = [];
        for (let i = 2; i <= delegatesCount; i++) {
            const delegate: string | undefined =
                activeDelegates[(Crypto.Slots.getSlotNumber(timestamp) + i) % delegatesCount];

            if (delegate) {
                nextForgers.push(delegate);
            }
        }

        // Determine Next Forger Usernames...
        this.logger.debug(
            `Next Forgers: ${JSON.stringify(
                nextForgers.slice(0, 5).map((publicKey: string) => this.getUsername(publicKey)),
            )}`,
        );

        let secondsToNextRound: number | undefined;
        for (const delegate of configuredDelegates) {
            const publicKey: string = Identities.PublicKey.fromPassphrase(delegate);

            let secondsToForge: number = 0;
            for (let i = 0; i < nextForgers.length; i++) {
                if (nextForgers[i] === publicKey) {
                    break;
                }

                secondsToForge += blockTime;
            }

            // Round Information...
            secondsToNextRound = (delegatesCount - (height % delegatesCount)) * blockTime;

            if (secondsToForge === 0) {
                this.logger.debug(`${this.getUsername(publicKey)} will forge next.`);
            } else if (secondsToForge > secondsToNextRound) {
                this.logger.debug(
                    `${this.getUsername(publicKey)} will forge in ${Utils.prettyTime(secondsToForge * 1000)}.`,
                );
            } else {
                this.logger.debug(`${this.getUsername(publicKey)} has already forged.`);
            }
        }

        if (secondsToNextRound) {
            this.logger.debug(`Round ${round.round} will end in ${Utils.prettyTime(secondsToNextRound * 1000)}.`);
        }
    }

    private getUsername(publicKey: string): string {
        return this.databaseService.walletRepository.findByPublicKey(publicKey).getAttribute("delegate.username");
    }
}
