import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import { configManager, ITransactionData, models, networks, slots, Transaction } from "@arkecosystem/crypto";
import isEmpty from "lodash.isempty";
import uniq from "lodash.uniq";
import pluralize from "pluralize";

import { Client } from "./client";
import { HostNoResponseError } from "./errors";

const { Delegate } = models;

export class ForgerManager {
    private logger = app.resolvePlugin<Logger.ILogger>("logger");
    private config = app.getConfig();

    private secrets: string[];
    private network: networks.INetwork;
    private client: Client;
    private delegates: models.Delegate[];
    private usernames: { [key: string]: string };
    private isStopped: boolean;
    private round: any;
    private initialized: boolean;

    /**
     * Create a new forger manager instance.
     * @param  {Object} options
     */
    constructor(options) {
        this.secrets = this.config.get("delegates.secrets");
        this.network = this.config.get("network");
        this.client = new Client(options.hosts);
    }

    /**
     * Load all delegates that forge.
     */
    public async loadDelegates(bip38: string, password: string): Promise<models.Delegate[] | null> {
        if (!bip38 && (!this.secrets || !this.secrets.length || !Array.isArray(this.secrets))) {
            this.logger.warn('No delegate found! Please check your "delegates.json" file and try again.');
            return null;
        }

        this.secrets = uniq(this.secrets.map(secret => secret.trim()));
        this.delegates = this.secrets.map(passphrase => new Delegate(passphrase, this.network, password));

        if (bip38) {
            this.logger.info("BIP38 Delegate loaded");

            this.delegates.push(new Delegate(bip38, this.network, password));
        }

        return this.delegates;
    }

    /**
     * Start forging on the given node.
     */
    public async startForging(): Promise<void> {
        this.logger.info(
            `Waiting for next slot. Current slot ${slots.getSlotNumber()} ends in ${slots.getTimeInMsUntilNextSlot()} ms.`,
        );
        return this.checkLater(slots.getTimeInMsUntilNextSlot());
    }

    /**
     * Stop forging on the given node.
     */
    public async stop(): Promise<void> {
        this.isStopped = true;
    }

    /**
     * Monitor the node for any actions that trigger forging.
     */
    public async __monitor(): Promise<void> {
        try {
            if (this.isStopped) {
                return;
            }

            await this.loadRound();

            if (!this.round.canForge) {
                // basically looping until we lock at beginning of next slot
                return this.checkLater(200);
            }

            const delegate = this.isDelegateActivated(this.round.currentForger.publicKey);
            if (!delegate) {
                // this.logger.debug(`Current forging delegate ${
                //  round.currentForger.publicKey
                // } is not configured on this node.`)

                if (this.isDelegateActivated(this.round.nextForger.publicKey)) {
                    const username = this.usernames[this.round.nextForger.publicKey];
                    this.logger.info(
                        `Next forging delegate ${username} (${
                            this.round.nextForger.publicKey
                        }) is active on this node.`,
                    );
                    await this.client.syncCheck();
                }

                return this.checkLater(slots.getTimeInMsUntilNextSlot());
            }

            const networkState = await this.client.getNetworkState();
            if (networkState.nodeHeight !== this.round.lastBlock.height) {
                this.logger.warn(
                    `The NetworkState height (${networkState.nodeHeight}) and round height (${
                        this.round.lastBlock.height
                    }) are out of sync. This indicates delayed blocks on the network.`,
                );
            }

            if (this.parseNetworkState(networkState, delegate)) {
                await this.__forgeNewBlock(delegate, this.round, networkState);
            }

            return this.checkLater(slots.getTimeInMsUntilNextSlot());
        } catch (error) {
            if (error instanceof HostNoResponseError) {
                this.logger.error(error.message);
            } else {
                this.logger.error(JSON.stringify(error.stack));
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

    /**
     * Creates new block by the delegate and sends it to relay node for verification and broadcast
     */
    public async __forgeNewBlock(delegate: models.Delegate, round, networkState: NetworkState) {
        const transactions = await this.__getTransactionsForForging();

        const previousBlock = {
            id: networkState.lastBlockId,
            idHex: null,
            height: networkState.nodeHeight,
        };

        if (configManager.getMilestone(networkState.nodeHeight).block.idFullSha256) {
            previousBlock.idHex = previousBlock.id;
        } else {
            previousBlock.idHex = models.Block.toBytesHex(previousBlock.id);
        }

        const blockOptions = {
            previousBlock,
            timestamp: round.timestamp,
            reward: round.reward,
        };

        const block = await delegate.forge(transactions, blockOptions);

        const username = this.usernames[delegate.publicKey];
        this.logger.info(`Forged new block ${block.data.id} by delegate ${username} (${delegate.publicKey})`);

        await this.client.broadcast(block.toJson());

        this.client.emitEvent("block.forged", block.data);
        transactions.forEach(transaction => this.client.emitEvent("transaction.forged", transaction));
    }

    /**
     * Gets the unconfirmed transactions from the relay nodes transaction pool
     */
    public async __getTransactionsForForging(): Promise<ITransactionData[]> {
        const response = await this.client.getTransactions();
        const transactions = response.transactions
            ? response.transactions.map(serializedTx => Transaction.fromHex(serializedTx).data)
            : [];

        if (isEmpty(response)) {
            this.logger.error("Could not get unconfirmed transactions from transaction pool.");
        } else {
            this.logger.debug(
                `Received ${pluralize("transaction", transactions.length, true)} from the pool containing ${
                    response.poolSize
                }`,
            );
        }

        return transactions;
    }

    /**
     * Checks if delegate public key is in the loaded (active) delegates list
     */
    public isDelegateActivated(queryPublicKey: string) {
        return this.delegates.find(delegate => delegate.publicKey === queryPublicKey);
    }

    /**
     * Parses the given network state and decides if forging is allowed.
     * @param {Object} networkState internal response
     * @param {Booolean} isAllowedToForge
     */
    public parseNetworkState(networkState, currentForger) {
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

        const overHeightBlockHeaders = networkState.getOverHeightBlockHeaders();
        if (overHeightBlockHeaders.length > 0) {
            this.logger.info(
                `Detected ${overHeightBlockHeaders.length} distinct overheight block ${pluralize(
                    "header",
                    overHeightBlockHeaders.length,
                    true,
                )}.`,
            );

            for (const overHeightBlockHeader of overHeightBlockHeaders) {
                if (overHeightBlockHeader.generatorPublicKey === currentForger.publicKey) {
                    const username = this.usernames[currentForger.publicKey];
                    this.logger.warn(
                        `Possible double forging delegate: ${username} (${currentForger.publicKey}) - Block: ${
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

    private async loadRound(): Promise<void> {
        this.round = await this.client.getRound();

        this.usernames = this.round.delegates.reduce(
            (acc, delegate) => Object.assign(acc, { [delegate.publicKey]: delegate.username }),
            {},
        );

        if (!this.initialized) {
            const delegates = this.delegates.map(
                delegate => `${this.usernames[delegate.publicKey]} (${delegate.publicKey})`,
            );

            this.logger.debug(`Loaded ${pluralize("delegate", delegates.length, true)}: ${delegates.join(", ")}`);

            this.initialized = true;
        }
    }

    private async checkLater(timeout: number) {
        setTimeout(() => this.__monitor(), timeout);
    }
}
