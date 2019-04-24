import { app } from "@arkecosystem/core-container";
import { Logger, P2P } from "@arkecosystem/core-interfaces";
import { NetworkStateStatus } from "@arkecosystem/core-p2p";
import { Blocks, Crypto, Interfaces, Managers, Transactions, Types } from "@arkecosystem/crypto";
import isEmpty from "lodash.isempty";
import uniq from "lodash.uniq";
import pluralize from "pluralize";
import { Client } from "./client";
import { Delegate } from "./delegate";
import { HostNoResponseError } from "./errors";

export class ForgerManager {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly config = app.getConfig();

    private secrets: string[];
    private network: Types.NetworkType;
    private client: Client;
    private delegates: Delegate[];
    private usernames: { [key: string]: string };
    private isStopped: boolean;
    private round: P2P.ICurrentRound;
    private initialized: boolean;

    constructor(options) {
        this.secrets = this.config.get("delegates.secrets");
        this.network = this.config.get("network");
        this.client = new Client(options.hosts);
    }

    public async startForging(bip38: string, password: string): Promise<void> {
        if (!bip38 && (!this.secrets || !this.secrets.length || !Array.isArray(this.secrets))) {
            this.logger.warn('No delegate found! Please check your "delegates.json" file and try again.');
            return;
        }

        this.secrets = uniq(this.secrets.map(secret => secret.trim()));
        this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, password));

        if (bip38) {
            this.logger.info("BIP38 Delegate loaded");

            this.delegates.push(new Delegate(bip38, this.network, password));
        }

        if (!this.delegates) {
            this.logger.warn('No delegate found! Please check your "delegates.json" file and try again.');
            return;
        }

        try {
            await this.loadRound();

            await this.checkLater(Crypto.Slots.getTimeInMsUntilNextSlot());

            this.logger.info(`Forger Manager started with ${pluralize("forger", this.delegates.length, true)}`);
        } catch (error) {
            this.logger.warn("Waiting for a responsive host.");
        }
    }

    public async stopForging(): Promise<void> {
        this.isStopped = true;
    }

    // @TODO: make this private
    public async checkSlot(): Promise<void> {
        try {
            if (this.isStopped) {
                return;
            }

            await this.loadRound();

            if (!this.round.canForge) {
                // basically looping until we lock at beginning of next slot
                return this.checkLater(200);
            }

            const delegate: Delegate = this.isActiveDelegate(this.round.currentForger.publicKey);

            if (!delegate) {
                if (this.isActiveDelegate(this.round.nextForger.publicKey)) {
                    const username = this.usernames[this.round.nextForger.publicKey];

                    this.logger.info(
                        `Next forging delegate ${username} (${
                            this.round.nextForger.publicKey
                        }) is active on this node.`,
                    );

                    await this.client.syncWithNetwork();
                }

                return this.checkLater(Crypto.Slots.getTimeInMsUntilNextSlot());
            }

            const networkState: P2P.INetworkState = await this.client.getNetworkState();

            if (networkState.nodeHeight !== this.round.lastBlock.height) {
                this.logger.warn(
                    `The NetworkState height (${networkState.nodeHeight}) and round height (${
                        this.round.lastBlock.height
                    }) are out of sync. This indicates delayed blocks on the network.`,
                );
            }

            if (this.isForgingAllowed(networkState, delegate)) {
                await this.forgeNewBlock(delegate, this.round, networkState);
            }

            return this.checkLater(Crypto.Slots.getTimeInMsUntilNextSlot());
        } catch (error) {
            if (error instanceof HostNoResponseError) {
                this.logger.warn(error.message);
            } else {
                this.logger.error(error.stack);
                this.logger.error(`Forging failed: ${error.message}`);

                if (!isEmpty(this.round)) {
                    this.logger.info(
                        `Round: ${this.round.current.toLocaleString()}, height: ${this.round.lastBlock.height.toLocaleString()}`,
                    );
                }

                this.client.emitEvent("forger.failed", error.message);
            }

            // no idea when this will be ok, so waiting 2s before checking again
            return this.checkLater(2000);
        }
    }

    public async forgeNewBlock(
        delegate: Delegate,
        round: P2P.ICurrentRound,
        networkState: P2P.INetworkState,
    ): Promise<void> {
        const transactions: Interfaces.ITransactionData[] = await this.getTransactionsForForging();

        const block: Interfaces.IBlock = delegate.forge(transactions, {
            previousBlock: {
                id: networkState.lastBlockId,
                idHex: Managers.configManager.getMilestone(networkState.nodeHeight).block.idFullSha256
                    ? networkState.lastBlockId
                    : Blocks.Block.toBytesHex(networkState.lastBlockId),
                height: networkState.nodeHeight,
            },
            timestamp: round.timestamp,
            reward: round.reward,
        });

        this.logger.info(
            `Forged new block ${block.data.id} by delegate ${this.usernames[delegate.publicKey]} (${
                delegate.publicKey
            })`,
        );

        await this.client.broadcastBlock(block.toJson());

        this.client.emitEvent("block.forged", block.data);

        transactions.forEach(transaction => this.client.emitEvent("transaction.forged", transaction));
    }

    public async getTransactionsForForging(): Promise<Interfaces.ITransactionData[]> {
        const response: P2P.IForgingTransactions = await this.client.getTransactions();

        if (isEmpty(response)) {
            this.logger.error("Could not get unconfirmed transactions from transaction pool.");

            return [];
        }

        const transactions: Interfaces.ITransactionData[] = response.transactions.map(
            serializedTx => Transactions.TransactionFactory.fromHex(serializedTx).data,
        );

        this.logger.debug(
            `Received ${pluralize("transaction", transactions.length, true)} from the pool containing ${
                response.poolSize
            }`,
        );

        return transactions;
    }

    public isForgingAllowed(networkState: P2P.INetworkState, delegate: Delegate): boolean {
        if (networkState.status === NetworkStateStatus.Unknown) {
            this.logger.info("Failed to get network state from client. Will not forge.");

            return false;
        }

        if (networkState.status === NetworkStateStatus.ColdStart) {
            this.logger.info("Will not forge during the cold start period. Check peers.json for coldStart setting.");

            return false;
        }

        if (networkState.status === NetworkStateStatus.BelowMinimumPeers) {
            this.logger.info("Network reach is not sufficient to get quorum. Will not forge.");

            return false;
        }

        const overHeightBlockHeaders: Array<{
            [id: string]: any;
        }> = networkState.getOverHeightBlockHeaders();
        if (overHeightBlockHeaders.length > 0) {
            this.logger.info(
                `Detected ${overHeightBlockHeaders.length} distinct overheight block ${pluralize(
                    "header",
                    overHeightBlockHeaders.length,
                    true,
                )}.`,
            );

            for (const overHeightBlockHeader of overHeightBlockHeaders) {
                if (overHeightBlockHeader.generatorPublicKey === delegate.publicKey) {
                    const username: string = this.usernames[delegate.publicKey];

                    this.logger.warn(
                        `Possible double forging delegate: ${username} (${delegate.publicKey}) - Block: ${
                            overHeightBlockHeader.id
                        }. Will not forge.`,
                    );

                    this.logger.debug(`Network State: ${networkState.toJson()}`);

                    return false;
                }
            }
        }

        if (networkState.getQuorum() < 0.66) {
            this.logger.info("Fork 6 - Not enough quorum to forge next block. Will not forge.");
            this.logger.debug(`Network State: ${networkState.toJson()}`);

            return false;
        }

        return true;
    }

    private isActiveDelegate(publicKey: string): Delegate | null {
        return this.delegates.find(delegate => delegate.publicKey === publicKey);
    }

    private async loadRound(): Promise<void> {
        this.round = await this.client.getRound();

        this.usernames = this.round.delegates.reduce(
            (acc, delegate) => Object.assign(acc, { [delegate.publicKey]: delegate.username }),
            {},
        );

        if (!this.initialized) {
            this.printLoadedDelegates();
        }

        this.initialized = true;
    }

    private checkLater(timeout: number): void {
        setTimeout(() => this.checkSlot(), timeout);
    }

    private printLoadedDelegates(): void {
        const activeDelegates: Delegate[] = this.delegates.filter(delegate =>
            this.usernames.hasOwnProperty(delegate.publicKey),
        );

        if (activeDelegates.length > 0) {
            this.logger.debug(
                `Loaded ${pluralize("active delegate", activeDelegates.length, true)}: ${activeDelegates
                    .map(({ publicKey }) => `${this.usernames[publicKey]} (${publicKey})`)
                    .join(", ")}`,
            );
        }

        if (this.delegates.length > activeDelegates.length) {
            const inactiveDelegates: string[] = this.delegates
                .filter(delegate => !activeDelegates.includes(delegate))
                .map(delegate => delegate.publicKey);

            this.logger.debug(
                `Loaded ${pluralize("inactive delegate", inactiveDelegates.length, true)}: ${inactiveDelegates.join(
                    ", ",
                )}`,
            );
        }
    }
}
