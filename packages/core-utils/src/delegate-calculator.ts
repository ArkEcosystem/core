import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";

const BignumMod = Utils.Bignum.clone({ DECIMAL_PLACES: 2 });

// @TODO: satoshi value so we need to return bignum
export function calculateApproval(delegate, height: number = null): number {
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

// @TODO: satoshi value so we need to return bignum
export function calculateForgedTotal(delegate): number {
    const forgedFees = new Utils.Bignum(delegate.forgedFees);
    const forgedRewards = new Utils.Bignum(delegate.forgedRewards);

    return +forgedFees.plus(forgedRewards).toFixed();
}
