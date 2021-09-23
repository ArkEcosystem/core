"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_event_emitter_1 = require("@arkecosystem/core-event-emitter");
const core_p2p_1 = require("@arkecosystem/core-p2p");
const core_state_1 = require("@arkecosystem/core-state");
const crypto_1 = require("@arkecosystem/crypto");
const lodash_isempty_1 = __importDefault(require("lodash.isempty"));
const lodash_uniq_1 = __importDefault(require("lodash.uniq"));
const pluralize_1 = __importDefault(require("pluralize"));
const client_1 = require("./client");
const delegate_1 = require("./delegate");
const errors_1 = require("./errors");
class ForgerManager {
    constructor(options) {
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.config = core_container_1.app.getConfig();
        this.secrets = this.config.get("delegates.secrets");
        this.network = this.config.get("network");
        this.client = new client_1.Client(options.hosts);
    }
    async startForging(bip38, password) {
        if (!bip38 && (!this.secrets || !this.secrets.length || !Array.isArray(this.secrets))) {
            this.logger.warn('No delegate found! Please check your "delegates.json" file and try again.');
            return;
        }
        this.secrets = lodash_uniq_1.default(this.secrets.map(secret => secret.trim()));
        this.delegates = this.secrets.map(passphrase => new delegate_1.Delegate(passphrase, this.network, password));
        if (bip38) {
            this.logger.info("BIP38 Delegate loaded");
            this.delegates.push(new delegate_1.Delegate(bip38, this.network, password));
        }
        if (!this.delegates) {
            this.logger.warn('No delegate found! Please check your "delegates.json" file and try again.');
            return;
        }
        let timeout;
        try {
            await this.loadRound();
            timeout = crypto_1.Crypto.Slots.getTimeInMsUntilNextSlot();
        }
        catch (error) {
            timeout = 2000;
            this.logger.warn("Waiting for a responsive host.");
        }
        finally {
            this.checkLater(timeout);
        }
    }
    async stopForging() {
        this.isStopped = true;
    }
    // @TODO: make this private
    async checkSlot() {
        try {
            if (this.isStopped) {
                return;
            }
            await this.loadRound();
            if (!this.round.canForge) {
                // basically looping until we lock at beginning of next slot
                return this.checkLater(200);
            }
            const delegate = this.isActiveDelegate(this.round.currentForger.publicKey);
            if (!delegate) {
                if (this.isActiveDelegate(this.round.nextForger.publicKey)) {
                    const username = this.usernames[this.round.nextForger.publicKey];
                    this.logger.info(`Next forging delegate ${username} (${this.round.nextForger.publicKey}) is active on this node.`);
                    await this.client.syncWithNetwork();
                }
                return this.checkLater(crypto_1.Crypto.Slots.getTimeInMsUntilNextSlot());
            }
            const networkState = await this.client.getNetworkState();
            if (networkState.nodeHeight !== this.round.lastBlock.height) {
                this.logger.warn(`The NetworkState height (${networkState.nodeHeight}) and round height (${this.round.lastBlock.height}) are out of sync. This indicates delayed blocks on the network.`);
            }
            if (this.isForgingAllowed(networkState, delegate)) {
                await this.forgeNewBlock(delegate, this.round, networkState);
            }
            return this.checkLater(crypto_1.Crypto.Slots.getTimeInMsUntilNextSlot());
        }
        catch (error) {
            if (error instanceof errors_1.HostNoResponseError || error instanceof errors_1.RelayCommunicationError) {
                if (error.message.includes("blockchain isn't ready") || error.message.includes("App is not ready.")) {
                    this.logger.info("Waiting for relay to become ready.");
                }
                else {
                    this.logger.warn(error.message);
                }
            }
            else {
                this.logger.error(error.stack);
                if (!lodash_isempty_1.default(this.round)) {
                    this.logger.info(`Round: ${this.round.current.toLocaleString()}, height: ${this.round.lastBlock.height.toLocaleString()}`);
                }
                this.client.emitEvent(core_event_emitter_1.ApplicationEvents.ForgerFailed, { error: error.message });
            }
            // no idea when this will be ok, so waiting 2s before checking again
            return this.checkLater(2000);
        }
    }
    async forgeNewBlock(delegate, round, networkState) {
        crypto_1.Managers.configManager.setHeight(networkState.nodeHeight);
        const transactions = await this.getTransactionsForForging();
        const block = delegate.forge(transactions, {
            previousBlock: {
                id: networkState.lastBlockId,
                idHex: crypto_1.Managers.configManager.getMilestone().block.idFullSha256
                    ? networkState.lastBlockId
                    : crypto_1.Blocks.Block.toBytesHex(networkState.lastBlockId),
                height: networkState.nodeHeight,
            },
            timestamp: round.timestamp,
            reward: round.reward,
        });
        const minimumMs = 2000;
        const timeLeftInMs = crypto_1.Crypto.Slots.getTimeInMsUntilNextSlot();
        const currentSlot = crypto_1.Crypto.Slots.getSlotNumber();
        const roundSlot = crypto_1.Crypto.Slots.getSlotNumber(round.timestamp);
        const prettyName = `${this.usernames[delegate.publicKey]} (${delegate.publicKey})`;
        if (timeLeftInMs >= minimumMs && currentSlot === roundSlot) {
            this.logger.info(`Forged new block ${block.data.id} by delegate ${prettyName}`);
            await this.client.broadcastBlock(block);
            this.client.emitEvent(core_event_emitter_1.ApplicationEvents.BlockForged, block.data);
            for (const transaction of transactions) {
                this.client.emitEvent(core_event_emitter_1.ApplicationEvents.TransactionForged, transaction);
            }
        }
        else {
            if (currentSlot !== roundSlot) {
                this.logger.warn(`Failed to forge new block by delegate ${prettyName}, because already in next slot.`);
            }
            else {
                this.logger.warn(`Failed to forge new block by delegate ${prettyName}, because there were ${timeLeftInMs}ms left in the current slot (less than ${minimumMs}ms).`);
            }
        }
    }
    async getTransactionsForForging() {
        const response = await this.client.getTransactions();
        if (lodash_isempty_1.default(response)) {
            this.logger.error("Could not get unconfirmed transactions from transaction pool.");
            return [];
        }
        const transactions = response.transactions.map((hex) => crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(Buffer.from(hex, "hex")).data);
        this.logger.debug(`Received ${pluralize_1.default("transaction", transactions.length, true)} from the pool containing ${response.poolSize}`);
        return transactions;
    }
    isForgingAllowed(networkState, delegate) {
        if (networkState.status === core_p2p_1.NetworkStateStatus.Unknown) {
            this.logger.info("Failed to get network state from client. Will not forge.");
            return false;
        }
        else if (networkState.status === core_p2p_1.NetworkStateStatus.ColdStart) {
            this.logger.info("Skipping slot because of cold start. Will not forge.");
            return false;
        }
        else if (networkState.status === core_p2p_1.NetworkStateStatus.BelowMinimumPeers) {
            this.logger.info("Network reach is not sufficient to get quorum. Will not forge.");
            return false;
        }
        const overHeightBlockHeaders = networkState.getOverHeightBlockHeaders();
        if (overHeightBlockHeaders.length > 0) {
            this.logger.info(`Detected ${pluralize_1.default("distinct overheight block header", overHeightBlockHeaders.length, true)}.`);
            for (const overHeightBlockHeader of overHeightBlockHeaders) {
                if (overHeightBlockHeader.generatorPublicKey === delegate.publicKey) {
                    const username = this.usernames[delegate.publicKey];
                    this.logger.warn(`Possible double forging delegate: ${username} (${delegate.publicKey}) - Block: ${overHeightBlockHeader.id}.`);
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
    isActiveDelegate(publicKey) {
        return this.delegates.find(delegate => delegate.publicKey === publicKey);
    }
    async loadRound() {
        this.round = await this.client.getRound();
        this.usernames = this.round.delegates
            .map(delegate => Object.assign(new core_state_1.Wallets.Wallet(delegate.address), delegate))
            .reduce((acc, delegate) => Object.assign(acc, { [delegate.publicKey]: delegate.getAttribute("delegate.username") }), {});
        if (!this.initialized) {
            this.printLoadedDelegates();
            this.client.emitEvent(core_event_emitter_1.ApplicationEvents.ForgerStarted, {
                activeDelegates: this.delegates.map(delegate => delegate.publicKey),
            });
            this.logger.info(`Forger Manager started.`);
        }
        this.initialized = true;
    }
    checkLater(timeout) {
        setTimeout(() => this.checkSlot(), timeout);
    }
    printLoadedDelegates() {
        const activeDelegates = this.delegates.filter(delegate => this.usernames.hasOwnProperty(delegate.publicKey));
        if (activeDelegates.length > 0) {
            this.logger.info(`Loaded ${pluralize_1.default("active delegate", activeDelegates.length, true)}: ${activeDelegates
                .map(({ publicKey }) => `${this.usernames[publicKey]} (${publicKey})`)
                .join(", ")}`);
        }
        if (this.delegates.length > activeDelegates.length) {
            const inactiveDelegates = this.delegates
                .filter(delegate => !activeDelegates.includes(delegate))
                .map(delegate => delegate.publicKey);
            this.logger.info(`Loaded ${pluralize_1.default("inactive delegate", inactiveDelegates.length, true)}: ${inactiveDelegates.join(", ")}`);
        }
    }
}
exports.ForgerManager = ForgerManager;
//# sourceMappingURL=manager.js.map