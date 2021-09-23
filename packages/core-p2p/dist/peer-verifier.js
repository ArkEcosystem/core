"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
const assert_1 = __importDefault(require("assert"));
const pluralize_1 = __importDefault(require("pluralize"));
const util_1 = require("util");
const enums_1 = require("./enums");
class PeerVerificationResult {
    constructor(myHeight, hisHeight, highestCommonHeight) {
        this.myHeight = myHeight;
        this.hisHeight = hisHeight;
        this.highestCommonHeight = highestCommonHeight;
    }
    get forked() {
        return this.highestCommonHeight !== this.myHeight && this.highestCommonHeight !== this.hisHeight;
    }
}
exports.PeerVerificationResult = PeerVerificationResult;
class PeerVerifier {
    constructor(communicator, peer) {
        this.communicator = communicator;
        this.peer = peer;
        /**
         * A cache of verified blocks' ids. A block is verified if it is connected to a chain
         * in which all blocks (including that one) are signed by the corresponding delegates.
         */
        this.database = core_container_1.app.resolvePlugin("database");
        this.logger = core_container_1.app.resolvePlugin("logger");
        this.logPrefix = `Peer verify ${peer.ip}:`;
    }
    /**
     * Verify the peer's blockchain (claimed state).
     * Confirm that the peer's chain is either:
     * - the same as ours or
     * - different than ours but legit.
     * Legit chain would have blocks signed/forged by the appropriate delegate(s).
     *
     * We distinguish 6 different cases with respect to our chain and peer's chain:
     *
     * Case1. Peer height > our height and our highest block is part of the peer's chain.
     *   This means the peer is ahead of us, on the same chain. No fork.
     *   We verify: his blocks that have height > our height (up to the round end).
     *
     * Case2. Peer height > our height and our highest block is not part of the peer's chain.
     *   This means that the peer is on a different, higher chain. It has forked before our
     *   latest block.
     *   We verify: the first few of the peer's blocks after the fork (up to the round end).
     *
     * Case3. Peer height == our height and our latest blocks are the same.
     *   This means that our chains are the same.
     *   We verify: nothing.
     *
     * Case4. Peer height == our height and our latest blocks differ.
     *   This means that we are on a different chains with equal height. A fork has occurred.
     *   We verify: same as 2.
     *
     * Case5. Peer height < our height and peer's latest block is part of our chain.
     *   This means that the peer is on the same chain as us, just lagging behind.
     *   We verify: nothing.
     *
     * Case6. Peer height < our height and peer's latest block is not part of our chain.
     *   This means that we have forked and the peer's chain is lower.
     *   We verify: same as 2.
     *
     * @param {Object} claimedState the claimed state of the peer, as returned by `/peer/status`.
     * The caller should ensure that it is a valid state: must have .header.height and .header.id
     * properties.
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {PeerVerificationResut|undefined} PeerVerificationResut object if the peer's blockchain
     * is verified to be legit (albeit it may be different than our blockchain), or undefined if
     * the peer's state could not be verified.
     * @throws {Error} if the state verification could not complete before the deadline
     */
    async checkState(claimedState, deadline) {
        if (!(await this.checkStateHeader(claimedState))) {
            return undefined;
        }
        const claimedHeight = Number(claimedState.header.height);
        const ourHeight = this.ourHeight();
        if (await this.weHavePeersHighestBlock(claimedState, ourHeight)) {
            // Case3 and Case5
            return new PeerVerificationResult(ourHeight, claimedHeight, claimedHeight);
        }
        const highestCommonBlockHeight = await this.findHighestCommonBlockHeight(claimedHeight, ourHeight, deadline);
        if (highestCommonBlockHeight === undefined) {
            return undefined;
        }
        if (!(await this.verifyPeerBlocks(highestCommonBlockHeight + 1, claimedHeight, deadline))) {
            return undefined;
        }
        this.log(enums_1.Severity.DEBUG_EXTRA, "success");
        return new PeerVerificationResult(ourHeight, claimedHeight, highestCommonBlockHeight);
    }
    async checkStateHeader(claimedState) {
        const blockHeader = claimedState.header;
        const claimedHeight = Number(blockHeader.height);
        if (claimedHeight !== claimedState.height) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `Peer claimed contradicting heights: state height=${claimedState.height} vs ` +
                `state header height: ${claimedHeight}`);
            return false;
        }
        try {
            const ownBlock = core_container_1.app
                .resolvePlugin("state")
                .getStore()
                .getLastBlocks()
                .find(block => block.data.height === blockHeader.height);
            // Use shortcut to prevent expensive crypto if the block header equals our own.
            if (ownBlock && JSON.stringify(ownBlock.getHeader()) === JSON.stringify(blockHeader)) {
                return true;
            }
            if (claimedHeight < this.ourHeight()) {
                const roundInfo = core_utils_1.roundCalculator.calculateRound(claimedHeight);
                const delegates = await this.getDelegatesByRound(roundInfo);
                if (await this.verifyPeerBlock(blockHeader, claimedHeight, delegates)) {
                    return true;
                }
            }
            else {
                const claimedBlock = crypto_1.Blocks.BlockFactory.fromData(blockHeader);
                if (claimedBlock.verifySignature()) {
                    return true;
                }
            }
            this.log(enums_1.Severity.DEBUG_EXTRA, `Claimed block header ${blockHeader.height}:${blockHeader.id} failed signature verification`);
            return false;
        }
        catch (error) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `Claimed block header ${blockHeader.height}:${blockHeader.id} failed verification: ` + error.message);
            return false;
        }
    }
    ourHeight() {
        const height = core_container_1.app
            .resolvePlugin("state")
            .getStore()
            .getLastHeight();
        assert_1.default(Number.isInteger(height), `Couldn't derive our chain height: ${height}`);
        return height;
    }
    /**
     * Check whether we have the peer's highest block in our chain.
     * Either one of the following is true:
     * - both chains are on the same height and same block id or
     * - our chain is peer's chain + more blocks on top (peer is lagging behind)
     * @param {Object} claimedState peer claimed state (from `/peer/status`)
     * @param {Number} ourHeight the height of our blockchain
     * @return {Boolean} true if we have peer's highest block
     */
    async weHavePeersHighestBlock(claimedState, ourHeight) {
        const claimedHeight = Number(claimedState.header.height);
        if (claimedHeight > ourHeight) {
            const blocksAhead = claimedHeight - ourHeight;
            this.log(enums_1.Severity.DEBUG_EXTRA, `peer's claimed chain is ${pluralize_1.default("block", blocksAhead, true)} higher than ` +
                `ours (our height ${ourHeight}, his claimed height ${claimedHeight})`);
            return false;
        }
        const blocks = await this.database.getBlocksByHeight([claimedHeight]);
        assert_1.default.strictEqual(blocks.length, 1, `database.getBlocksByHeight([ ${claimedHeight} ]) returned ${blocks.length} results: ` +
            this.anyToString(blocks) +
            ` (our chain is at height ${ourHeight})`);
        const ourBlockAtHisHeight = blocks[0];
        if (ourBlockAtHisHeight.id === claimedState.header.id) {
            if (claimedHeight === ourHeight) {
                this.log(enums_1.Severity.DEBUG_EXTRA, `success: peer's latest block is the same as our latest ` +
                    `block (height=${claimedHeight}, id=${claimedState.header.id}). Identical chains.`);
            }
            else {
                this.log(enums_1.Severity.DEBUG_EXTRA, `success: peer's latest block ` +
                    `(height=${claimedHeight}, id=${claimedState.header.id}) is part of our chain. ` +
                    `Peer is ${pluralize_1.default("block", ourHeight - claimedHeight, true)} behind us.`);
            }
            return true;
        }
        this.log(enums_1.Severity.DEBUG, `peer's latest block (height=${claimedHeight}, id=${claimedState.header.id}), is different than the ` +
            `block at the same height in our chain (id=${ourBlockAtHisHeight.id}). Peer has ` +
            (claimedHeight < ourHeight ? `a shorter and` : `an equal-height but`) +
            ` different chain.`);
        return false;
    }
    /**
     * Find the height of the highest block that is the same in both our and peer's chain.
     * @param {Number} claimedHeight peer's claimed height (from `/peer/status`)
     * @param {Number} ourHeight the height of our blockchain
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Number|undefined} height; if undefined is returned this means that the
     * peer's replies didn't make sense and it should be treated as malicious or broken.
     * @throws {Error} if the state verification could not complete before the deadline
     */
    async findHighestCommonBlockHeight(claimedHeight, ourHeight, deadline) {
        // The highest common block is in the interval [1, min(claimed height, our height)].
        // Search in that interval using an 8-ary search. Compared to binary search this
        // will do more comparisons. However, comparisons are practically for free while
        // the most expensive part in our case is retrieving blocks from our database, from
        // peer's database and over the network. Number of database and network calls is
        // log_8(interval length) for 8-ary search, which is less than log_2(interval length)
        // for binary search.
        const nAry = 8;
        const probe = async (heightsToProbe) => {
            const ourBlocks = await this.database.getBlocksByHeight(heightsToProbe);
            assert_1.default.strictEqual(ourBlocks.length, heightsToProbe.length);
            const probesIdByHeight = {};
            const probesHeightById = {};
            for (const b of ourBlocks) {
                probesIdByHeight[b.height] = b.id;
                probesHeightById[b.id] = b.height;
            }
            // Make sure getBlocksByHeight() returned a block for every height we asked.
            for (const height of heightsToProbe) {
                assert_1.default.strictEqual(typeof probesIdByHeight[height], "string");
            }
            const ourBlocksPrint = ourBlocks.map(b => `{ height=${b.height}, id=${b.id} }`).join(", ");
            const rangePrint = `[${ourBlocks[0].height}, ${ourBlocks[ourBlocks.length - 1].height}]`;
            const msRemaining = this.throwIfPastDeadline(deadline);
            this.log(enums_1.Severity.DEBUG_EXTRA, `probe for common blocks in range ${rangePrint}`);
            const highestCommon = await this.communicator.hasCommonBlocks(this.peer, Object.keys(probesHeightById), msRemaining);
            if (!highestCommon) {
                return undefined;
            }
            if (!probesHeightById[highestCommon.id]) {
                this.log(enums_1.Severity.DEBUG_EXTRA, `failure: bogus reply from peer for common blocks ${ourBlocksPrint}: ` +
                    `peer replied with block id ${highestCommon.id} which we did not ask for`);
                return undefined;
            }
            if (probesHeightById[highestCommon.id] !== highestCommon.height) {
                this.log(enums_1.Severity.DEBUG_EXTRA, `failure: bogus reply from peer for common blocks ${ourBlocksPrint}: ` +
                    `peer pretends to have block with id ${highestCommon.id} at height ` +
                    `${highestCommon.height}, however a block with the same id is at ` +
                    `different height ${probesHeightById[highestCommon.id]} in our chain`);
                return undefined;
            }
            return highestCommon.height;
        };
        const nSect = new core_utils_1.NSect(nAry, probe);
        const highestCommonBlockHeight = await nSect.find(1, Math.min(claimedHeight, ourHeight));
        if (highestCommonBlockHeight === undefined) {
            this.log(enums_1.Severity.INFO, `failure: could not determine a common block`);
        }
        else {
            this.log(enums_1.Severity.DEBUG_EXTRA, `highest common block height: ${highestCommonBlockHeight}`);
        }
        return highestCommonBlockHeight;
    }
    /**
     * Verify the blocks of the peer's chain that are in the range [height, min(claimed height, last block in round)].
     * @param {Number} startHeight verify blocks at and after this height
     * @param {Number} claimedHeight peer's claimed height, don't try to verify blocks past this height
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Boolean} true if the blocks are legit (signed by the appropriate delegates)
     * @throws {Error} if the state verification could not complete before the deadline
     */
    async verifyPeerBlocks(startHeight, claimedHeight, deadline) {
        const roundInfo = core_utils_1.roundCalculator.calculateRound(startHeight);
        const { maxDelegates, roundHeight } = roundInfo;
        const lastBlockHeightInRound = roundHeight + maxDelegates;
        // Verify a few blocks that are not too far up from the last common block. Within the
        // same round as the last common block or in the next round if the last common block is
        // the last block in a round (so that the delegates calculations are still the same for
        // both chains).
        const delegates = await this.getDelegatesByRound(roundInfo);
        const hisBlocksByHeight = {};
        const endHeight = Math.min(claimedHeight, lastBlockHeightInRound);
        for (let height = startHeight; height <= endHeight; height++) {
            if (hisBlocksByHeight[height] === undefined) {
                if (!(await this.fetchBlocksFromHeight({
                    height,
                    endHeight,
                    blocksByHeight: hisBlocksByHeight,
                    deadline,
                }))) {
                    return false;
                }
            }
            assert_1.default(hisBlocksByHeight[height] !== undefined);
            if (!(await this.verifyPeerBlock(hisBlocksByHeight[height], height, delegates))) {
                return false;
            }
        }
        return true;
    }
    /**
     * Get the delegates for the given round.
     */
    async getDelegatesByRound(roundInfo) {
        const { round, maxDelegates } = roundInfo;
        let delegates = await this.database.getActiveDelegates(roundInfo);
        if (delegates.length === 0) {
            // This must be the current round, still not saved into the database (it is saved
            // only after it has completed). So fetch the list of delegates from the wallet
            // manager.
            delegates = this.database.walletManager.loadActiveDelegateList(roundInfo);
            assert_1.default.strictEqual(delegates.length, maxDelegates, `Couldn't derive the list of delegates for round ${round}. The database ` +
                `returned empty list and the wallet manager returned ${this.anyToString(delegates)}.`);
        }
        const delegatesByPublicKey = {};
        for (const delegate of delegates) {
            delegatesByPublicKey[delegate.publicKey] = delegate;
        }
        return delegatesByPublicKey;
    }
    /**
     * Fetch some blocks from the peer, starting at the given height.
     * @param {Number} height fetch the block at this height and some after it
     * @param {Object} blocksByHeight map of height -> block, this method will add the newly
     * fetched blocks to it
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Boolean} true if fetched successfully
     * @throws {Error} if the state verification could not complete before the deadline
     */
    async fetchBlocksFromHeight({ height, endHeight, blocksByHeight, deadline, }) {
        let response;
        try {
            this.throwIfPastDeadline(deadline);
            // returns blocks from the next one, thus we do -1
            response = await this.communicator.getPeerBlocks(this.peer, {
                fromBlockHeight: height - 1,
                blockLimit: Math.max(Math.min(endHeight - height + 1, 400), 1),
                headersOnly: true,
            });
        }
        catch (err) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `failure: could not get blocks starting from height ${height} from peer: exception: ${err.message}`);
            return false;
        }
        if (!response || response.length === 0) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `failure: could not get blocks starting from height ${height} ` +
                `from peer: unexpected response: ${this.anyToString(response)}`);
            return false;
        }
        for (let i = 0; i < response.length; i++) {
            blocksByHeight[height + i] = response[i];
        }
        return true;
    }
    /**
     * Verify a given block from the peer's chain - must be signed by one of the provided delegates.
     * @param {Interfaces.IBlockData} blockData the block to verify
     * @param {Number} expectedHeight the given block must be at this height
     * @param {Object} delegatesByPublicKey a map of { publicKey: delegate, ... }, one of these
     * delegates must have signed the block
     * @return {Boolean} true if the block is legit (signed by the appropriate delegate)
     */
    async verifyPeerBlock(blockData, expectedHeight, delegatesByPublicKey) {
        const block = crypto_1.Blocks.BlockFactory.fromData(blockData);
        if (!block.verifySignature()) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `failure: peer's block at height ${expectedHeight} does not pass crypto-validation`);
            return false;
        }
        const height = block.data.height;
        if (height !== expectedHeight) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `failure: asked for block at height ${expectedHeight}, but got a block with height ${height} instead`);
            return false;
        }
        if (delegatesByPublicKey[block.data.generatorPublicKey]) {
            this.log(enums_1.Severity.DEBUG_EXTRA, `successfully verified block at height ${height}, signed by ` + block.data.generatorPublicKey);
            return true;
        }
        this.log(enums_1.Severity.DEBUG_EXTRA, `failure: block ${this.anyToString(blockData)} is not signed by any of the delegates ` +
            `for the corresponding round: ` +
            this.anyToString(Object.values(delegatesByPublicKey)));
        return false;
    }
    /**
     * Check if a deadline has passed and throw an exception if so.
     * @param {Number} deadline deadline, in milliseconds since Epoch
     * @return {Number} milliseconds remaining, if deadline has not passed
     * @throws {Error} if deadline passed
     */
    throwIfPastDeadline(deadline) {
        const now = new Date().getTime();
        if (deadline <= now) {
            // Throw an exception so that it can cancel everything and break out of peer.ping().
            throw new Error("timeout elapsed before successful completion of the verification");
        }
        return deadline - now;
    }
    /**
     * Format an arbitrary value to a string.
     * @param {*} val value to be converted
     * @return {String} string representation of `val`
     */
    anyToString(val) {
        return util_1.inspect(val, { sorted: true, breakLength: Infinity });
    }
    /**
     * Log a message with the given severity.
     * @param {Severity} severity severity of the message, DEBUG_EXTRA messages are only
     * logged if enabled in the environment.
     */
    log(severity, msg) {
        const fullMsg = `${this.logPrefix} ${msg}`;
        switch (severity) {
            case enums_1.Severity.DEBUG_EXTRA:
                if (process.env.CORE_P2P_PEER_VERIFIER_DEBUG_EXTRA) {
                    this.logger.debug(fullMsg);
                }
                break;
            case enums_1.Severity.DEBUG:
                this.logger.debug(fullMsg);
                break;
            case enums_1.Severity.INFO:
                this.logger.info(fullMsg);
                break;
        }
    }
}
exports.PeerVerifier = PeerVerifier;
//# sourceMappingURL=peer-verifier.js.map