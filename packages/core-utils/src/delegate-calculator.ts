import { app, Contracts } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

const BignumMod = Utils.BigNumber.clone({ DECIMAL_PLACES: 2 });

export const calculateApproval = (delegate: Contracts.State.IWallet, height?: number): number => {
    const config = app.getConfig();

    if (!height) {
        height = app.resolve<Contracts.Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
    }

    const constants = config.getMilestone(height);
    const totalSupply = new BignumMod(config.get("genesisBlock.totalAmount")).plus(
        (height - constants.height) * constants.reward,
    );
    const voteBalance = new BignumMod(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"));

    return +voteBalance
        .times(100)
        .dividedBy(totalSupply)
        .toFixed(2);
};

export const calculateForgedTotal = (wallet: Contracts.State.IWallet): string => {
    const delegate: Contracts.State.IWalletDelegateAttributes = wallet.getAttribute("delegate");
    const forgedFees: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedFees);
    const forgedRewards: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedRewards);

    return forgedFees.plus(forgedRewards).toFixed();
};
