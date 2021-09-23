import { P2P } from "@arkecosystem/core-interfaces";
export declare class PeerVerificationResult implements P2P.IPeerVerificationResult {
    readonly myHeight: number;
    readonly hisHeight: number;
    readonly highestCommonHeight: number;
    constructor(myHeight: number, hisHeight: number, highestCommonHeight: number);
    get forked(): boolean;
}
export declare class PeerVerifier {
    private readonly communicator;
    private readonly peer;
    /**
     * A cache of verified blocks' ids. A block is verified if it is connected to a chain
     * in which all blocks (including that one) are signed by the corresponding delegates.
     */
    private readonly database;
    private readonly logger;
    private logPrefix;
    constructor(communicator: P2P.IPeerCommunicator, peer: P2P.IPeer);
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
    checkState(claimedState: P2P.IPeerState, deadline: number): Promise<PeerVerificationResult | undefined>;
    private checkStateHeader;
    private ourHeight;
    /**
     * Check whether we have the peer's highest block in our chain.
     * Either one of the following is true:
     * - both chains are on the same height and same block id or
     * - our chain is peer's chain + more blocks on top (peer is lagging behind)
     * @param {Object} claimedState peer claimed state (from `/peer/status`)
     * @param {Number} ourHeight the height of our blockchain
     * @return {Boolean} true if we have peer's highest block
     */
    private weHavePeersHighestBlock;
    /**
     * Find the height of the highest block that is the same in both our and peer's chain.
     * @param {Number} claimedHeight peer's claimed height (from `/peer/status`)
     * @param {Number} ourHeight the height of our blockchain
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Number|undefined} height; if undefined is returned this means that the
     * peer's replies didn't make sense and it should be treated as malicious or broken.
     * @throws {Error} if the state verification could not complete before the deadline
     */
    private findHighestCommonBlockHeight;
    /**
     * Verify the blocks of the peer's chain that are in the range [height, min(claimed height, last block in round)].
     * @param {Number} startHeight verify blocks at and after this height
     * @param {Number} claimedHeight peer's claimed height, don't try to verify blocks past this height
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Boolean} true if the blocks are legit (signed by the appropriate delegates)
     * @throws {Error} if the state verification could not complete before the deadline
     */
    private verifyPeerBlocks;
    /**
     * Get the delegates for the given round.
     */
    private getDelegatesByRound;
    /**
     * Fetch some blocks from the peer, starting at the given height.
     * @param {Number} height fetch the block at this height and some after it
     * @param {Object} blocksByHeight map of height -> block, this method will add the newly
     * fetched blocks to it
     * @param {Number} deadline operation deadline, in milliseconds since Epoch
     * @return {Boolean} true if fetched successfully
     * @throws {Error} if the state verification could not complete before the deadline
     */
    private fetchBlocksFromHeight;
    /**
     * Verify a given block from the peer's chain - must be signed by one of the provided delegates.
     * @param {Interfaces.IBlockData} blockData the block to verify
     * @param {Number} expectedHeight the given block must be at this height
     * @param {Object} delegatesByPublicKey a map of { publicKey: delegate, ... }, one of these
     * delegates must have signed the block
     * @return {Boolean} true if the block is legit (signed by the appropriate delegate)
     */
    private verifyPeerBlock;
    /**
     * Check if a deadline has passed and throw an exception if so.
     * @param {Number} deadline deadline, in milliseconds since Epoch
     * @return {Number} milliseconds remaining, if deadline has not passed
     * @throws {Error} if deadline passed
     */
    private throwIfPastDeadline;
    /**
     * Format an arbitrary value to a string.
     * @param {*} val value to be converted
     * @return {String} string representation of `val`
     */
    private anyToString;
    /**
     * Log a message with the given severity.
     * @param {Severity} severity severity of the message, DEBUG_EXTRA messages are only
     * logged if enabled in the environment.
     */
    private log;
}
