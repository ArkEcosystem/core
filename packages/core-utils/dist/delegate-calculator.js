"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const crypto_1 = require("@arkecosystem/crypto");
const index_1 = require("./index");
const toDecimal = (voteBalance, totalSupply) => {
    const decimals = 2;
    const exponent = totalSupply.toString().length - voteBalance.toString().length + 4;
    // @ts-ignore
    const div = voteBalance.times(Math.pow(10, exponent)).dividedBy(totalSupply) / Math.pow(10, exponent - decimals);
    return +Number(div).toFixed(2);
};
exports.calculateApproval = (delegate, height) => {
    if (!height) {
        height = core_container_1.app.resolvePlugin("blockchain").getLastBlock().data.height;
    }
    const totalSupply = crypto_1.Utils.BigNumber.make(index_1.supplyCalculator.calculate(height));
    const voteBalance = crypto_1.Utils.BigNumber.make(delegate.getAttribute("delegate.voteBalance"));
    return toDecimal(voteBalance, totalSupply);
};
exports.calculateForgedTotal = (wallet) => {
    const delegate = wallet.getAttribute("delegate");
    const forgedFees = crypto_1.Utils.BigNumber.make(delegate.forgedFees || 0);
    const forgedRewards = crypto_1.Utils.BigNumber.make(delegate.forgedRewards || 0);
    return forgedFees.plus(forgedRewards).toFixed();
};
//# sourceMappingURL=delegate-calculator.js.map