import { Managers, Utils } from "@arkecosystem/crypto";

import { Wallet, WalletDelegateAttributes } from "../contracts/state";

export const calculateApproval = (delegate: Wallet, height?: number): number => {
    const BignumMod = Utils.BigNumber.clone({ DECIMAL_PLACES: 2 });

    const constants = Managers.configManager.getMilestone(height);
    const totalSupply = new BignumMod(Managers.configManager.get("genesisBlock.totalAmount")).plus(
        (height - constants.height) * constants.reward,
    );
    const voteBalance = new BignumMod(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"));

    return +voteBalance
        .times(100)
        .dividedBy(totalSupply)
        .toFixed(2);
};

/**
 * todo: review the implementation
 *
 * review the implementation - currently it is coupled to the container because wallet is coupled to the container
 * a better approach would be to pass in a delegate object rather then letting the function make assumptions about
 * from where the data is coming that needs to be processed.
 */
export const calculateForgedTotal = (wallet: Wallet): string => {
    const delegate: WalletDelegateAttributes = wallet.getAttribute("delegate");
    const forgedFees: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedFees);
    const forgedRewards: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedRewards);

    return forgedFees.plus(forgedRewards).toFixed();
};
