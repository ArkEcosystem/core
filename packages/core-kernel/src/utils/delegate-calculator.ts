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

export const calculateForgedTotal = (wallet: Wallet): string => {
    const delegate: WalletDelegateAttributes = wallet.getAttribute("delegate");
    const forgedFees: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedFees);
    const forgedRewards: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedRewards);

    return forgedFees.plus(forgedRewards).toFixed();
};
