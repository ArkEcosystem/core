import { app } from "@arkecosystem/core-container";
import { Blockchain, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import { supplyCalculator } from "./index";

const toDecimal = (voteBalance: Utils.BigNumber, totalSupply: Utils.BigNumber): number => {
    const decimals: number = 2;
    const exponent: number = totalSupply.toString().length - voteBalance.toString().length + 4;

    // @ts-ignore
    const div = voteBalance.times(Math.pow(10, exponent)).dividedBy(totalSupply) / Math.pow(10, exponent - decimals);

    return +Number(div).toFixed(2);
};

export const calculateApproval = (delegate: State.IWallet, height?: number): number => {
    if (!height) {
        height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
    }

    const totalSupply = Utils.BigNumber.make(supplyCalculator.calculate(height));
    const voteBalance = Utils.BigNumber.make(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"));

    return toDecimal(voteBalance, totalSupply);
};

export const calculateForgedTotal = (wallet: State.IWallet): string => {
    const delegate: State.IWalletDelegateAttributes = wallet.getAttribute("delegate");
    const forgedFees: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedFees || 0);
    const forgedRewards: Utils.BigNumber = Utils.BigNumber.make(delegate.forgedRewards || 0);

    return forgedFees.plus(forgedRewards).toFixed();
};
