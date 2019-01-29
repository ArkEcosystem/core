import assert from "assert";
import { ConnectionInterface } from "@arkecosystem/core-database";
import { Logger } from "@arkecosystem/core-interfaces";
import { Peer } from './peer';
import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-container";
import { models } from "@arkecosystem/crypto";
import { roundCalculator } from "@arkecosystem/core-utils";

export default class PeerVerifier {
    private database: ConnectionInterface;
    private logPrefix: string;
    private logger: Logger.ILogger;
    private peer: any;

    public constructor (peer: Peer) {
        this.database = app.resolvePlugin<PostgresConnection>("database");
        this.logPrefix = `Peer verify ${peer.ip}:`;
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
        this.peer = peer;
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
     * 1. Peer height > our height and our highest block is part of the peer's chain.
     *   This means the peer is ahead of us, on the same chain. No fork.
     *   We verify: his blocks that have height > our height.
     *
     * 2. Peer height > our height and our highest block is not part of the peer's chain.
     *   This means that the peer is on a different, higher chain. It has forked before our
     *   latest block.
     *   We verify: the first few of the peer's blocks after the fork (up to the round end).
     *
     * 3. Peer height == our height and our latest blocks are the same.
     *   This means that our chains are the same.
     *   We verify: nothing.
     *
     * 4. Peer height == our height and our latest blocks differ.
     *   This means that we are on a different chains with equal height. A fork has occurred.
     *   We verify: same as 2.
     *
     * 5. Peer height < our height and peer's latest block is part of our chain.
     *   This means that the peer is on the same chain as us, just lagging behind.
     *   We verify: nothing.
     *
     * 6. Peer height < our height and peer's latest block is not part of our chain.
     *   This means that we have forked and the peer's chain is lower.
     *   We verify: same as 2.
     *
     * @param {Peer} peer peer whose chain to verify
     * @param {Object} claimedState the claimed state of the peer, as returned by `/peer/status`
     * @return {Boolean} true if the peer's blockchain is verified to be legit (albeit it may be
     * different than our blockchain)
     */
    public async checkState(claimedState: object): Promise<boolean> {
        if (this.isStateInvalid(claimedState)) {
            return false;
        }

        const ourHeight: number = await this.ourHeight();

        if (await this.weHavePeersHighestBlock(claimedState, ourHeight)) {
            // Case 3. and 5.
            return true;
        }

        const highestCommonBlockHeight = await this.findHighestCommonBlockHeight(claimedState, ourHeight);
        if (highestCommonBlockHeight === null) {
            return false;
        }

        if (!await this.verifyPeerBlocks(highestCommonBlockHeight + 1)) {
            return false;
        }

        this.logger.debug(`${this.logPrefix} success`);

        return true;
    }

    /**
     * Check if the state claimed by the peer is definitely invalid.
     * @param {Object} claimedState peer's claimed state (from `/peer/status`)
     * @return {Boolean} true if invalid
     */
    private isStateInvalid(claimedState: any): boolean {
        if (typeof claimedState === 'object' &&
            typeof claimedState.header === 'object' &&
            Number.isInteger(claimedState.header.height) &&
            claimedState.header.height > 0) {

            return false;
        }

        this.logger.info(`${this.logPrefix} peer's claimed state is invalid: ${JSON.stringify(claimedState)}`);

        return true;
    }

    /**
     * Retrieve the height of the highest block in our chain.
     * @return {Number} chain height
     */
    private async ourHeight(): Promise<number> {
        let height: number;
        if (app.has("state")) {
            height = app.resolve("state").getLastBlock().data.height;
        } else {
            height = (await this.database.getLastBlock()).data.height;
        }

        assert(Number.isInteger(height), `Couldn't derive our chain height: ${height}`);

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
    private async weHavePeersHighestBlock(claimedState: any, ourHeight: number): Promise<boolean> {
        const claimedHeight = Number(claimedState.header.height);

        if (claimedHeight > ourHeight) {
            const blocksAhead = claimedHeight - ourHeight;
            this.logger.debug(
                `${this.logPrefix} peer's claimed chain is ${blocksAhead} block(s) higher than ` +
                `ours (our height ${ourHeight}, his claimed height ${claimedHeight})`
            );

            return false;
        }

        const blocks = await this.database.getBlocksByHeight([ claimedHeight ]);

        assert.strictEqual(
            blocks.length,
            1,
            `database.getBlocksByHeight([ ${claimedHeight} ]) returned ${blocks.length} results: ` +
            JSON.stringify(blocks) + ` (our chain is at height ${ourHeight})`
        );

        const ourBlockAtHisHeight = blocks[0];

        if (ourBlockAtHisHeight.id === claimedState.header.id) {
            if (claimedHeight === ourHeight) {
                this.logger.debug(
                    `${this.logPrefix} success: peer's latest block is the same as our latest ` +
                    `block (height=${claimedHeight}, id=${claimedState.header.id}). Identical chains.`
                );
            } else {
                this.logger.debug(
                    `${this.logPrefix} success: peer's latest block ` +
                    `(height=${claimedHeight}, id=${claimedState.header.id}) is part of our chain. ` +
                    `Peer is ${ourHeight - claimedHeight} block(s) behind us.`
                );
            }
            return true;
        }

        this.logger.info(
            `${this.logPrefix} peer's latest block ` +
            `(height=${claimedHeight}, id=${claimedState.header.id}), is different than the ` +
            `block at the same height in our chain (id=${ourBlockAtHisHeight.id}). Peer has a ` +
            `shorter and different chain.`
        );

        return false;
    }

    /**
     * Find the height of the highest block that is the same in both our and peer's chain.
     * @param {Object} claimedState peer claimed state (from `/peer/status`)
     * @param {Number} ourHeight the height of our blockchain
     * @return {Number|null} height; if null is returned this means that the
     * peer's replies didn't make sense and it should be treated as malicious or broken.
     */
    private async findHighestCommonBlockHeight(claimedState: any, ourHeight: number): Promise<number> {
        const claimedHeight = Number(claimedState.header.height);

        // The highest common block is in the interval [1, min(claimed height, our height)].
        // Search in that interval using an 8-ary search. Compared to binary search this
        // will do more comparisons. However, comparisons are practically for free while
        // the most expensive part in our case is retrieving blocks from our database, from
        // peer's database and over the network. Number of database and network calls is
        // log_8(interval length) for 8-ary search, which is less than log_2(interval length)
        // for binary search.

        const nAry = 8;

        /**
         * Given an interval [lo, hi], split it in `nAry` intervals and return those intervals'
         * boundaries.
         * For example (assuming `nAry` is 8):
         * [1, 81] -> {
         *     1: true,
         *     11: true,
         *     21: true,
         *     31: true,
         *     41: true,
         *     51: true,
         *     61: true,
         *     71: true,
         *     81: true
         * }
         * Later we replace the `true` value with the corresponding block id.
         * @param {Number} lo lower boundary of the interval to split
         * @param {Number} hi higher boundary of the interval to split
         * @return {Object} intervals boundaries
         */
        const calcProbes = (lo: number, hi: number): object => {
            assert(lo < hi, `${lo} < ${hi}`);
            const diff = hi - lo;
            const p = {};
            for (let i = 0; i < nAry + 1; i++) {
                const h = lo + Math.round(diff * i / nAry);
                p[h] = true;
            }
            return p;
        };

        let highestCommonBlockHeight: number = null;

        let low = 1;
        let high = Math.min(claimedHeight, ourHeight);

        for (;;) {
            const probesIdByHeight = calcProbes(low, high);
            const probesHeightById = {};

            const ourBlocksHeights = Object.keys(probesIdByHeight).map(k => Number(k)).sort((a, b) => a - b);
            const ourBlocks = await this.database.getBlocksByHeight(ourBlocksHeights);

            assert.strictEqual(ourBlocks.length, ourBlocksHeights.length);

            for (const b of ourBlocks) {
                probesIdByHeight[b.height] = b.id;
                probesHeightById[b.id] = b.height;
            }

            // Make sure getBlocksByHeight() returned a block for every height we asked.
            ourBlocksHeights.forEach(h => assert.strictEqual(typeof probesIdByHeight[h], 'string'));

            const ourBlocksPrint = ourBlocks.map(b => `{ height=${b.height}, id=${b.id} }`).join(', ');
            const rangePrint = `[${ourBlocks[0].height}, ${ourBlocks[ourBlocks.length - 1].height}]`;

            this.logger.debug(`${this.logPrefix} probe for common blocks in range ${rangePrint}`);

            const highestCommon = await this.peer.hasCommonBlocks(Object.keys(probesHeightById));

            if (!highestCommon) {
                if (highestCommonBlockHeight === null) {
                    // This is the first iteration and no common blocks, including at
                    // height 1 (the genesis block).
                    this.logger.info(`${this.logPrefix} failure: could not find common blocks in range ${rangePrint}`)
                    return null;
                } else {
                    // No common blocks, the result from the previous iteration is the
                    // definitive one.
                    break;
                }
            }

            if (typeof highestCommon !== 'object' ||
                typeof highestCommon.id !== 'string' ||
                !Number.isInteger(highestCommon.height)) {

                this.logger.info(
                    `${this.logPrefix} failure: erroneous reply from peer for common blocks ` +
                    `${ourBlocksPrint}: ${JSON.stringify(highestCommon)}`
                );

                return null;
            }

            if (!probesHeightById[highestCommon.id]) {
                this.logger.info(
                    `${this.logPrefix} failure: bogus reply from peer for common blocks ` +
                    `${ourBlocksPrint}: peer replied with block id ${highestCommon.id} which we ` +
                    `did not ask for`
                );
                return null;
            }

            if (probesHeightById[highestCommon.id] !== highestCommon.height) {
                this.logger.info(
                    `${this.logPrefix} failure: bogus reply from peer for common blocks ` +
                    `${ourBlocksPrint}: peer pretends to have block with id ${highestCommon.id} ` +
                    `at height ${highestCommon.height}, however a block with the same id is at ` +
                    `different height ${probesHeightById[highestCommon.id]} in our chain`
                );
                return null;
            }

            highestCommonBlockHeight = highestCommon.height;

            if (low + nAry >= high) {
                // The range is narrowed so much that we probed every element in the range.
                // No need to narrow further - highestCommonBlockHeight contains the definitive result.
                break;
            }

            // If we asked for blocks at heights, for example: 1000, 1100, 1200, 1300
            // and the peer replied that his highest common block is at:
            // A. 1300 (the highest), then we end the search and highestCommonBlockHeight
            //    contains the definitive result. One of the two happened:
            //    a. this is the first iteration of the loop and the peer has all our
            //       blocks in common, or
            //    b. this is the 2+ iteration and on the previous iteration we got a reply
            //       that the peer does not have 1301.
            // B. 1100 (anything other than the highest), then this implies that the block
            //    at 1200 is different. So in the next iteration we ask for blocks between
            //    1101 and 1199.

            // Case A.
            if (highestCommonBlockHeight === ourBlocksHeights[ourBlocksHeights.length - 1]) {
                break;
            }

            this.logger.debug(`${this.logPrefix} temporary highest common: ${highestCommonBlockHeight}`);

            // Case B. From the example above, we have:
            // highestCommonBlockHeight = 1100
            // ourBlocksHeights[0] = 1000, the peer has this block
            // ourBlocksHeights[1] = 1100, the peer has this block
            // ourBlocksHeights[2] = 1200, the peer does not have this block
            // ourBlocksHeights[3] = 1300, the peer does not have this block
            // we will get indexOfHighestCommon = 1, and for the next iteration:
            // low = 1100 + 1 = 1101
            // high = ourBlocksHeights[1 + 1] - 1 = ourBlocksHeights[2] - 1 = 1200 - 1 = 1199
            const indexOfHighestCommon = ourBlocksHeights.indexOf(highestCommonBlockHeight);
            assert.notStrictEqual(indexOfHighestCommon, -1);
            assert(indexOfHighestCommon < ourBlocksHeights.length - 1);
            low = highestCommonBlockHeight + 1;
            high = ourBlocksHeights[indexOfHighestCommon + 1] - 1;
        }

        if (highestCommonBlockHeight === null) {
            this.logger.info(`${this.logPrefix} failure: could not determine highest common block`);
        } else {
            this.logger.debug(`${this.logPrefix} definitive highest common: ${highestCommonBlockHeight}`);
        }

        return highestCommonBlockHeight;
    }

    /**
     * Verify the blocks of the peer's chain that are in the range [height, last block in round].
     * @param {Number} height verify blocks at and after this height
     * @return {Boolean} true if the blocks are legit (signed by the appropriate delegates)
     */
    private async verifyPeerBlocks(height: number): Promise<boolean> {
        const round = roundCalculator.calculateRound(height);
        const lastBlockHeightInRound = round.round * round.maxDelegates;

        // Verify a few blocks that are not too far up from the last common block. Within the
        // same round as the last common block or in the next round if the last common block is
        // the last block in a round (so that the delegates calculations are still the same for
        // both chains).

        const delegates = await this.getDelegates(round);

        const hisBlocksByHeight = {};

        for (let h = height; h <= lastBlockHeightInRound; h++) {
            if (hisBlocksByHeight[h] === undefined) {
                if (!await this.fetchBlocksFromHeight(h, hisBlocksByHeight)) {
                    return false;
                }
            }
            assert(hisBlocksByHeight[h] !== undefined);

            if (!this.verifyPeerBlock(hisBlocksByHeight[h], h, delegates)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get the delegates for the given round.
     * @param {Object} round round to get delegates for
     * @return {Object} a map of { publicKey: delegate, ... } of all delegates for the given round
     */
    private async getDelegates(round: any): Promise<any> {
        const numDelegates = round.maxDelegates;

        const heightOfFirstBlockInRound = (round.round - 1) * numDelegates + 1;

        let delegates = await this.database.getActiveDelegates(heightOfFirstBlockInRound);

        if (delegates.length === 0) {
            // This must be the current round, still not saved into the database (it is saved
            // only after it has completed). So fetch the list of delegates from the wallet
            // manager.

            // loadActiveDelegateList() is upset if we give it any height - it wants the height
            // of the first block in the round.
            delegates = this.database.walletManager.loadActiveDelegateList(numDelegates, heightOfFirstBlockInRound);
            assert.strictEqual(
                delegates.length,
                numDelegates,
                `Couldn't derive the list of delegates for round ${round.round}. The database ` +
                `returned empty list and the wallet manager returned ${JSON.stringify(delegates)}.`
            );
        }

        const delegatesByPublicKey = {};

        for (const d of delegates) {
            delegatesByPublicKey[d.publicKey] = d;
        }

        return delegatesByPublicKey;
    }

    /**
     * Fetch some blocks from the peer, starting at the given height.
     * @param {Number} height fetch the block at this height and some after it
     * @param {Object} blocksByHeight map of height -> block, this method will add the newly
     * fetched blocks to it
     * @return {Boolean} true if fetched successfully
     */
    private async fetchBlocksFromHeight(height: number, blocksByHeight: object): Promise<boolean> {
        let response;

        try {
            response = await this.peer.getPeerBlocks(height - 1);  // returns blocks from the next one
        } catch (err) {
            this.logger.info(
                `${this.logPrefix} failure: could not get blocks starting from height ${height} ` +
                `from peer: exception: ${err.message}`
            );
            return false;
        }

        if (typeof response !== 'object' ||
            typeof response.data !== 'object' ||
            !Array.isArray(response.data.blocks)) {

            this.logger.info(
                `${this.logPrefix} failure: could not get blocks starting from height ${height} ` +
                `from peer: unexpected response: ${JSON.stringify(response)}`
            );
            return false;
        }

        for (let i = 0; i < response.data.blocks.length; i++) {
            blocksByHeight[height + i] = response.data.blocks[i];
        }

        return true;
    }

    /**
     * Verify a given block from the peer's chain - must be signed by one of the provided delegates.
     * @param {models.IBlockData} blockData the block to verify
     * @param {Number} expectedHeight the given block must be at this height
     * @param {Object} delegatesByPublicKey a map of { publicKey: delegate, ... }, one of these
     * delegates must have signed the block
     * @return {Boolean} true if the block is legit (signed by the appropriate delegate)
     */
    private async verifyPeerBlock(
        blockData: models.IBlockData,
        expectedHeight: number,
        delegatesByPublicKey: any[]): Promise<boolean> {
        // XXX would this verify that:
        // - the signature corresponds to the payload
        // - the signature was made with the private key that corresponds to generatorPublicKey
        const block = new models.Block(blockData);

        const height = block.data.height;

        if (height !== expectedHeight) {
            this.logger.info(
                `${this.logPrefix} failure: asked for block at height ${expectedHeight}, ` +
                `but got a block with height ${height} instead`
            );
            return false;
        }

        if (delegatesByPublicKey[block.data.generatorPublicKey]) {
            this.logger.debug(
                `${this.logPrefix} successfully verified block at height ${height}, signed by ` +
                block.data.generatorPublicKey
            );
            return true;
        }

        this.logger.info(
            `${this.logPrefix} failure: block ${JSON.stringify(blockData)} is not ` +
            `signed by any of the delegates for the corresponding round: ` +
            JSON.stringify(Object.values(delegatesByPublicKey))
        );

        return false;
    }
}
