import { Container, Contracts, Enums, Services, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { NetworkStateStatus } from "@arkecosystem/core-p2p";
import { Blocks, Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { Handlers } from "@arkecosystem/core-transactions";

import { Client } from "./client";
import { HostNoResponseError, RelayCommunicationError } from "./errors";
import { Delegate } from "./interfaces";

// todo: review the implementation - quite a mess right now with quite a few responsibilities
@Container.injectable()
export class ForgerService {
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
     * @memberof ForgerService
     */
    @Container.inject(Container.Identifiers.LogService)
    private readonly logger!: Contracts.Kernel.Logger;

    /**
     * @private
     * @type {Handlers.TransactionHandlerProvider}
     * @memberof ForgerService
     */
    @Container.inject(Container.Identifiers.TransactionHandlerProvider)
    private readonly handlerProvider!: Handlers.TransactionHandlerProvider;

    /**
     * @private
     * @type {Client}
     * @memberof ForgerService
     */
    private client!: Client;

    /**
     * @private
     * @type {Delegate[]}
     * @memberof ForgerService
     */
    private delegates: Delegate[] = [];

    /**
     * @private
     * @type {{ [key: string]: string }}
     * @memberof ForgerService
     */
    private usernames: { [key: string]: string } = {};

    /**
     * @private
     * @type {boolean}
     * @memberof ForgerService
     */
    private isStopped: boolean = false;

    /**
     * @private
     * @type {(Contracts.P2P.CurrentRound | undefined)}
     * @memberof ForgerService
     */
    private round: Contracts.P2P.CurrentRound | undefined;

    /**
     * @private
     * @type {(Interfaces.IBlock | undefined)}
     * @memberof ForgerService
     */
    private lastForgedBlock: Interfaces.IBlock | undefined;

    /**
     * @private
     * @type {boolean}
     * @memberof ForgerService
     */
    private initialized: boolean = false;

    /**
     * @private
     * @type {boolean}
     * @memberof ForgerService
     */
    private logAppReady: boolean = true;

    public getRound(): Contracts.P2P.CurrentRound | undefined {
        return this.round;
    }

    public getRemainingSlotTime(): number | undefined {
        return this.round ? this.getRoundRemainingSlotTime(this.round) : undefined;
    }

    public getLastForgedBlock(): Interfaces.IBlock | undefined {
        return this.lastForgedBlock;
    }

    /**
     * @param {*} options
     * @memberof ForgerService
     */
    public register(options): void {
        this.client = this.app.resolve<Client>(Client);
        this.client.register(options.hosts);
    }

    /**
     * @param {Delegate[]} delegates
     * @returns {Promise<void>}
     * @memberof ForgerService
     */
    public async boot(delegates: Delegate[]): Promise<void> {
        if (this.handlerProvider.isRegistrationRequired()) {
            this.handlerProvider.registerHandlers();
        }

        this.delegates = delegates;

        let timeout: number = 2000;
        try {
            await this.loadRound();
            AppUtils.assert.defined<Contracts.P2P.CurrentRound>(this.round);
            timeout = Math.max(0, this.getRoundRemainingSlotTime(this.round));
        } catch (error) {
            this.logger.warning("Waiting for a responsive host");
        } finally {
            this.checkLater(timeout);
        }
    }

    /**
     * @returns {Promise<void>}
     * @memberof ForgerService
     */
    public async dispose(): Promise<void> {
        this.isStopped = true;

        this.client.dispose();
    }

    /**
     * todo: make this private
     *
     * @returns {Promise<void>}
     * @memberof ForgerService
     */
    public async checkSlot(): Promise<void> {
        try {
            if (this.isStopped) {
                return;
            }

            await this.loadRound();

            AppUtils.assert.defined<Contracts.P2P.CurrentRound>(this.round);

            if (!this.round.canForge) {
                // basically looping until we lock at beginning of next slot
                return this.checkLater(200);
            }

            AppUtils.assert.defined<string>(this.round.currentForger.publicKey);

            const delegate: Delegate | undefined = this.isActiveDelegate(this.round.currentForger.publicKey);

            if (!delegate) {
                AppUtils.assert.defined<string>(this.round.nextForger.publicKey);

                if (this.isActiveDelegate(this.round.nextForger.publicKey)) {
                    const username = this.usernames[this.round.nextForger.publicKey];

                    this.logger.info(
                        `Next forging delegate ${username} (${this.round.nextForger.publicKey}) is active on this node.`,
                    );

                    await this.client.syncWithNetwork();
                }

                return this.checkLater(this.getRoundRemainingSlotTime(this.round));
            }

            const networkState: Contracts.P2P.NetworkState = await this.client.getNetworkState();

            if (networkState.getNodeHeight() !== this.round.lastBlock.height) {
                this.logger.warning(
                    `The NetworkState height (${networkState
                        .getNodeHeight()
                        ?.toLocaleString()}) and round height (${this.round.lastBlock.height.toLocaleString()}) are out of sync. This indicates delayed blocks on the network.`,
                );
            }

            if (
                await this.app
                    .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                    .call("isForgingAllowed", { forgerService: this, delegate, networkState })
            ) {
                await this.app
                    .get<Services.Triggers.Triggers>(Container.Identifiers.TriggerService)
                    .call("forgeNewBlock", { forgerService: this, delegate, round: this.round, networkState });
            }

            this.logAppReady = true;

            return this.checkLater(this.getRoundRemainingSlotTime(this.round));
        } catch (error) {
            if (error instanceof HostNoResponseError || error instanceof RelayCommunicationError) {
                if (error.message.includes("blockchain isn't ready") || error.message.includes("App is not ready")) {
                    /* istanbul ignore else */
                    if (this.logAppReady) {
                        this.logger.info("Waiting for relay to become ready.");
                        this.logAppReady = false;
                    }
                } else {
                    this.logger.warning(error.message);
                }
            } else {
                this.logger.error(error.stack);

                if (this.round) {
                    this.logger.info(
                        `Round: ${this.round.current.toLocaleString()}, height: ${this.round.lastBlock.height.toLocaleString()}`,
                    );
                }

                this.client.emitEvent(Enums.ForgerEvent.Failed, { error: error.message });
            }

            // no idea when this will be ok, so waiting 2s before checking again
            return this.checkLater(2000);
        }
    }

    /**
     * @param {Delegate} delegate
     * @param {Contracts.P2P.CurrentRound} round
     * @param {Contracts.P2P.NetworkState} networkState
     * @returns {Promise<void>}
     * @memberof ForgerService
     */
    public async forgeNewBlock(
        delegate: Delegate,
        round: Contracts.P2P.CurrentRound,
        networkState: Contracts.P2P.NetworkState,
    ): Promise<void> {
        AppUtils.assert.defined<number>(networkState.getNodeHeight());
        Managers.configManager.setHeight(networkState.getNodeHeight()!);

        const transactions: Interfaces.ITransactionData[] = await this.getTransactionsForForging();

        const block: Interfaces.IBlock | undefined = delegate.forge(transactions, {
            previousBlock: {
                id: networkState.getLastBlockId(),
                idHex: Managers.configManager.getMilestone().block.idFullSha256
                    ? networkState.getLastBlockId()
                    : Blocks.Block.toBytesHex(networkState.getLastBlockId()),
                height: networkState.getNodeHeight(),
            },
            timestamp: round.timestamp,
            reward: round.reward,
        });

        AppUtils.assert.defined<Interfaces.IBlock>(block);
        AppUtils.assert.defined<string>(delegate.publicKey);

        const minimumMs = 2000;
        const timeLeftInMs: number = this.getRoundRemainingSlotTime(round);
        const prettyName = `${this.usernames[delegate.publicKey]} (${delegate.publicKey})`;

        if (timeLeftInMs >= minimumMs) {
            this.logger.info(`Forged new block ${block.data.id} by delegate ${prettyName}`);

            await this.client.broadcastBlock(block);

            this.lastForgedBlock = block;
            this.client.emitEvent(Enums.BlockEvent.Forged, block.data);

            for (const transaction of transactions) {
                this.client.emitEvent(Enums.TransactionEvent.Forged, transaction);
            }
        } else if (timeLeftInMs > 0) {
            this.logger.warning(
                `Failed to forge new block by delegate ${prettyName}, because there were ${timeLeftInMs}ms left in the current slot (less than ${minimumMs}ms).`,
            );
        } else {
            this.logger.warning(`Failed to forge new block by delegate ${prettyName}, because already in next slot.`);
        }
    }

    /**
     * @returns {Promise<Interfaces.ITransactionData[]>}
     * @memberof ForgerService
     */
    public async getTransactionsForForging(): Promise<Interfaces.ITransactionData[]> {
        const response = await this.client.getTransactions();
        if (AppUtils.isEmpty(response)) {
            this.logger.error("Could not get unconfirmed transactions from transaction pool.");
            return [];
        }
        const transactions = response.transactions.map(
            (hex) => Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(hex, "hex")).data,
        );
        this.logger.debug(
            `Received ${AppUtils.pluralize("transaction", transactions.length, true)} ` +
                `from the pool containing ${AppUtils.pluralize("transaction", response.poolSize, true)} total`,
        );
        return transactions;
    }

    /**
     * @param {Contracts.P2P.NetworkState} networkState
     * @param {Delegate} delegate
     * @returns {boolean}
     * @memberof ForgerService
     */
    public isForgingAllowed(networkState: Contracts.P2P.NetworkState, delegate: Delegate): boolean {
        if (networkState.status === NetworkStateStatus.Unknown) {
            this.logger.info("Failed to get network state from client. Will not forge.");
            return false;
        } else if (networkState.status === NetworkStateStatus.ColdStart) {
            this.logger.info("Skipping slot because of cold start. Will not forge.");
            return false;
        } else if (networkState.status === NetworkStateStatus.BelowMinimumPeers) {
            this.logger.info("Network reach is not sufficient to get quorum. Will not forge.");
            return false;
        }

        const overHeightBlockHeaders: Array<{
            [id: string]: any;
        }> = networkState.getOverHeightBlockHeaders();
        if (overHeightBlockHeaders.length > 0) {
            this.logger.info(
                `Detected ${AppUtils.pluralize(
                    "distinct overheight block header",
                    overHeightBlockHeaders.length,
                    true,
                )}.`,
            );

            for (const overHeightBlockHeader of overHeightBlockHeaders) {
                if (overHeightBlockHeader.generatorPublicKey === delegate.publicKey) {
                    AppUtils.assert.defined<string>(delegate.publicKey);

                    const username: string = this.usernames[delegate.publicKey];

                    this.logger.warning(
                        `Possible double forging delegate: ${username} (${delegate.publicKey}) - Block: ${overHeightBlockHeader.id}.`,
                    );
                }
            }
        }

        if (networkState.getQuorum() < 0.66) {
            this.logger.info("Not enough quorum to forge next block. Will not forge.");
            this.logger.debug(`Network State: ${networkState.toJson()}`);

            return false;
        }

        return true;
    }

    /**
     * @private
     * @param {string} publicKey
     * @returns {(Delegate | undefined)}
     * @memberof ForgerService
     */
    private isActiveDelegate(publicKey: string): Delegate | undefined {
        return this.delegates.find((delegate) => delegate.publicKey === publicKey);
    }

    /**
     * @private
     * @returns {Promise<void>}
     * @memberof ForgerService
     */
    private async loadRound(): Promise<void> {
        this.round = await this.client.getRound();

        this.usernames = this.round.delegates.reduce((acc, wallet) => {
            AppUtils.assert.defined<string>(wallet.publicKey);

            return Object.assign(acc, {
                [wallet.publicKey]: wallet.delegate.username,
            });
        }, {});

        if (!this.initialized) {
            this.printLoadedDelegates();

            // @ts-ignore
            this.client.emitEvent(Enums.ForgerEvent.Started, {
                activeDelegates: this.delegates.map((delegate) => delegate.publicKey),
            });

            this.logger.info(`Forger Manager started.`);
        }

        this.initialized = true;
    }

    /**
     * @private
     * @param {number} timeout
     * @memberof ForgerService
     */
    private checkLater(timeout: number): void {
        setTimeout(() => this.checkSlot(), timeout);
    }

    /**
     * @private
     * @memberof ForgerService
     */
    private printLoadedDelegates(): void {
        const activeDelegates: Delegate[] = this.delegates.filter((delegate) => {
            AppUtils.assert.defined<string>(delegate.publicKey);

            return this.usernames.hasOwnProperty(delegate.publicKey);
        });

        if (activeDelegates.length > 0) {
            this.logger.info(
                `Loaded ${AppUtils.pluralize("active delegate", activeDelegates.length, true)}: ${activeDelegates
                    .map(({ publicKey }) => {
                        AppUtils.assert.defined<string>(publicKey);

                        return `${this.usernames[publicKey]} (${publicKey})`;
                    })
                    .join(", ")}`,
            );
        }

        if (this.delegates.length > activeDelegates.length) {
            const inactiveDelegates: (string | undefined)[] = this.delegates
                .filter((delegate) => !activeDelegates.includes(delegate))
                .map((delegate) => delegate.publicKey);

            this.logger.info(
                `Loaded ${AppUtils.pluralize(
                    "inactive delegate",
                    inactiveDelegates.length,
                    true,
                )}: ${inactiveDelegates.join(", ")}`,
            );
        }
    }

    private getRoundRemainingSlotTime(round: Contracts.P2P.CurrentRound): number {
        const epoch = new Date(Managers.configManager.getMilestone(1).epoch).getTime();
        const blocktime = Managers.configManager.getMilestone(round.lastBlock.height).blocktime;

        return epoch + round.timestamp * 1000 + blocktime * 1000 - Date.now();
    }
}
