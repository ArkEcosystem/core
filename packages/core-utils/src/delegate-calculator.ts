import { app } from "@arkecosystem/core-container";
import { Blockchain, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { supplyCalculator } from "./index";

export const calculateApproval = (delegate: State.IWallet, height?: number): number => {
    if (!height) {
        height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
    }

    const totalSupply = supplyCalculator.calculate(height);
    const voteBalance = Utils.BigNumber.make(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"));

    return +voteBalance
        .times(100)
        .dividedBy(totalSupply)
        .toFixed();
};

export const calculateForgedTotal = (wallet: State.IWallet): string => {
    const delegate: State.IWalletDelegateAttributes = wallet.getAttribute("delegate");
    const forgedFees: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedFees);
    const forgedRewards: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedRewards);

    return forgedFees.plus(forgedRewards).toFixed();
};
