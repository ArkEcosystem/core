import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { Bignum } from "@arkecosystem/crypto";

const BignumMod = Bignum.clone({ DECIMAL_PLACES: 2 });

/**
 * Calculate the approval for the given delegate.
 * @param  {Delegate} delegate
 * @param  {Number} height
 * @return {Number} Approval, with 2 decimals
 */
function calculateApproval(delegate, height: any = null) {
    const config = app.getConfig();

    if (!height) {
        height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
    }

    const constants = config.getMilestone(height);
    const totalSupply = new BignumMod(config.get("genesisBlock.totalAmount")).plus(
        (height - constants.height) * constants.reward,
    );
    const voteBalance = new BignumMod(delegate.voteBalance);

    return +voteBalance
        .times(100)
        .dividedBy(totalSupply)
        .toFixed(2);
}

/**
 * Calculate the forged total of the given delegate.
 * @param {Delegate} delegate
 * @return {Bignum} Forged total
 */
function calculateForgedTotal(delegate) {
    const forgedFees = new Bignum(delegate.forgedFees);
    const forgedRewards = new Bignum(delegate.forgedRewards);

    return +forgedFees.plus(forgedRewards).toFixed();
}

export { calculateApproval, calculateForgedTotal };
