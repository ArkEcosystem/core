import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { NetworkState, NetworkStateStatus } from "@arkecosystem/core-p2p";
import { ITransactionData, models, slots, Transaction } from "@arkecosystem/crypto";
import delay from "delay";
import isEmpty from "lodash/isEmpty";
import uniq from "lodash/uniq";
import pluralize from "pluralize";

import { Client } from "./client";

const { Delegate } = models;

export class ForgerManager {
    private logger = app.resolvePlugin<Logger.ILogger>("logger");
    private config = app.getConfig();
    private secrets: any;
    private network: any;
    private client: any;
    private delegates: any;
    private usernames: any;
    private isStopped: any;

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
     * @param  {String} bip38
     * @param  {String} password
     * @return {Array}
     */
    public async loadDelegates(bip38, password) {
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

        await this.__loadUsernames(2000);

        const delegates = this.delegates.map(
            delegate => `${this.usernames[delegate.publicKey]} (${delegate.publicKey})`,
        );

        this.logger.debug(`Loaded ${pluralize("delegate", delegates.length, true)}: ${delegates.join(", ")}`);

        return this.delegates;
    }

    /**
     * Start forging on the given node.
     * @return {Object}
     */
    public async startForging() {
        const slot = slots.getSlotNumber();

        while (slots.getSlotNumber() === slot) {
            await delay(100);
        }

        return this.__monitor(null);
    }

    /**
     * Stop forging on the given node.
     * @return {void}
     */
    public async stop() {
        this.isStopped = true;
    }

    /**
     * Monitor the node for any actions that trigger forging.
     * @param  {Object} round
     * @return {Function}
     */
    public async __monitor(round): Promise<any> {
        try {
            if (this.isStopped) {
                return false;
            }

            await this.__loadUsernames();

            round = await this.client.getRound();
            if (!round.canForge) {
                // this.logger.debug('Block already forged in current slot')
                // technically it is possible to compute doing shennanigan with arkjs.slots lib

                await delay(200); // basically looping until we lock at beginning of next slot

                return this.__monitor(round);
            }

            const delegate = this.__isDelegateActivated(round.currentForger.publicKey);
            if (!delegate) {
                // this.logger.debug(`Current forging delegate ${
                //  round.currentForger.publicKey
                // } is not configured on this node.`)

                if (this.__isDelegateActivated(round.nextForger.publicKey)) {
                    const username = this.usernames[round.nextForger.publicKey];
                    this.logger.info(
                        `Next forging delegate ${username} (${round.nextForger.publicKey}) is active on this node.`,
                    );
                    await this.client.syncCheck();
                }

                await delay(slots.getTimeInMsUntilNextSlot()); // we will check at next slot

                return this.__monitor(round);
            }

            const networkState = await this.client.getNetworkState();
            if (networkState.nodeHeight !== round.lastBlock.height) {
                this.logger.warn(
                    `The NetworkState height (${networkState.nodeHeight}) and round height (${
                        round.lastBlock.height
                    }) are out of sync. This indicates delayed blocks on the network.`,
                );
            }

            if (this.__parseNetworkState(networkState, delegate)) {
                await this.__forgeNewBlock(delegate, round, networkState);
            }

            await delay(slots.getTimeInMsUntilNextSlot()); // we will check at next slot

            return this.__monitor(round);
        } catch (error) {
            // README: The Blockchain is not ready, monitor until it is instead of crashing.
            if (error.response && error.response.status === 503) {
                this.logger.warn(`Blockchain not ready - ${error.response.status} ${error.response.statusText}`);

                await delay(2000);

                return this.__monitor(round);
            }

            // README: The Blockchain is ready but an action still failed.
            this.logger.error(`Forging failed: ${error.message}`);

            if (!isEmpty(round)) {
                this.logger.info(
                    `Round: ${round.current.toLocaleString()}, height: ${round.lastBlock.height.toLocaleString()}`,
                );
            }

            await delay(2000); // no idea when this will be ok, so waiting 2s before checking again

            this.client.emitEvent("forger.failed", error.message);

            return this.__monitor(round);
        }
    }

    /**
     * Creates new block by the delegate and sends it to relay node for verification and broadcast
     */
    public async __forgeNewBlock(delegate: models.Delegate, round, networkState: NetworkState) {
        const transactions = await this.__getTransactionsForForging();

        const previousBlock = {
            id: networkState.lastBlockId,
            idHex: models.Block.toBytesHex(networkState.lastBlockId),
            height: networkState.nodeHeight,
        };

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
     * @param  {Object} PublicKey
     * @return {Object}
     */
    public __isDelegateActivated(queryPublicKey) {
        return this.delegates.find(delegate => delegate.publicKey === queryPublicKey);
    }

    /**
     * Parses the given network state and decides if forging is allowed.
     * @param {Object} networkState internal response
     * @param {Booolean} isAllowedToForge
     */
    public __parseNetworkState(networkState, currentForger) {
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

    /**
     * Get a list of all active delegate usernames.
     * @return {Object}
     */
    public async __loadUsernames(wait = 0) {
        this.usernames = await this.client.getUsernames(wait);
    }
}
