import { Container, Contracts, Services, Utils } from "@arkecosystem/core-kernel";
import { Managers, Utils as CryptoUtils } from "@arkecosystem/crypto";

import { Delegate } from "./interfaces";

/**
 * @export
 * @class DelegateTracker
 */
@Container.injectable()
export class DelegateTracker {
    /**
     * @private
     * @type {Contracts.Kernel.Application}
     * @memberof ForgerService
     */
    @Container.inject(Container.Identifiers.Application)
    private readonly app!: Contracts.Kernel.Application;

    /**
     * @private
     * @type {Contracts.Kernel.Logger}
     * @memberof DelegateTracker
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {Contracts.Blockchain.Blockchain}
     * @memberof DelegateTracker
     */
    @Container.inject(Container.Identifiers.BlockchainService)
    private readonly blockchainService!: Contracts.Blockchain.Blockchain;

    /**
     * @private
     * @type {Contracts.State.WalletRepository}
     * @memberof DelegateTracker
     */
    @Container.inject(Container.Identifiers.WalletRepository)
    @Container.tagged("state", "blockchain")
    private readonly walletRepository!: Contracts.State.WalletRepository;

    /**
     * @private
     * @type {Delegate[]}
     * @memberof DelegateTracker
     */
    private delegates: Delegate[] = [];

    /**
     * @param {Delegate[]} delegates
     * @returns {this}
     * @memberof DelegateTracker
     */
    public initialize(delegates: Delegate[]): this {
        this.delegates = delegates;

        return this;
    }

    /**
     * @returns {Promise<void>}
     * @memberof DelegateTracker
     */
    public async handle(): Promise<void> {
        // Arrange...
        const { height, timestamp } = this.blockchainService.getLastBlock().data;
        const maxDelegates = Managers.configManager.getMilestone(height).activeDelegates;
        const blockTime: number = CryptoUtils.calculateBlockTime(height);
        const round: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(height);

        const activeDelegates = (await this.app
            .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
            .call("getActiveDelegates", { roundInfo: round })) as Contracts.State.Wallet[];

        const activeDelegatesPublicKeys: (
            | string
            | undefined
        )[] = activeDelegates.map((delegate: Contracts.State.Wallet) => delegate.getPublicKey());

        const blockTimeLookup = await Utils.forgingInfoCalculator.getBlockTimeLookup(this.app, height);

        const forgingInfo: Contracts.Shared.ForgingInfo = Utils.forgingInfoCalculator.calculateForgingInfo(
            timestamp,
            height,
            blockTimeLookup,
        );

        // Determine Next Forgers...
        const nextForgers: string[] = [];
        for (let i = 0; i <= maxDelegates; i++) {
            const delegate: string | undefined =
                activeDelegatesPublicKeys[(forgingInfo.currentForger + i) % maxDelegates];

            if (delegate) {
                nextForgers.push(delegate);
            }
        }

        if (activeDelegatesPublicKeys.length < maxDelegates) {
            return this.logger.warning(
                `Tracker only has ${Utils.pluralize(
                    "active delegate",
                    activeDelegatesPublicKeys.length,
                    true,
                )} from a required ${maxDelegates}`,
            );
        }

        // Determine Next Forger Usernames...
        this.logger.debug(
            `Next Forgers: ${JSON.stringify(
                nextForgers.slice(0, 5).map((publicKey: string) => this.getUsername(publicKey)),
            )}`,
        );

        const secondsToNextRound: number = (maxDelegates - forgingInfo.currentForger - 1) * blockTime;

        for (const delegate of this.delegates) {
            let indexInNextForgers = 0;
            for (let i = 0; i < nextForgers.length; i++) {
                if (nextForgers[i] === delegate.publicKey) {
                    indexInNextForgers = i;
                    break;
                }
            }

            if (indexInNextForgers === 0) {
                this.logger.debug(`${this.getUsername(delegate.publicKey)} will forge next.`);
            } else if (indexInNextForgers <= maxDelegates - forgingInfo.nextForger) {
                this.logger.debug(
                    `${this.getUsername(delegate.publicKey)} will forge in ${Utils.prettyTime(
                        indexInNextForgers * blockTime * 1000,
                    )}.`,
                );
            } else {
                this.logger.debug(`${this.getUsername(delegate.publicKey)} has already forged.`);
            }
        }

        this.logger.debug(`Round ${round.round} will end in ${Utils.prettyTime(secondsToNextRound * 1000)}.`);
    }

    /**
     * @private
     * @param {string} publicKey
     * @returns {string}
     * @memberof DelegateTracker
     */
    private getUsername(publicKey: string): string {
        return this.walletRepository.findByPublicKey(publicKey).getAttribute("delegate.username");
    }
}
