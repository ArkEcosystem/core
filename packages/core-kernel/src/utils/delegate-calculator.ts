import { Wallet, WalletDelegateAttributes } from "../contracts/state";
import { BigNumber } from "../utils";
import { calculate as calculateSupply } from "./supply-calculator";

const toDecimal = (voteBalance: BigNumber, totalSupply: BigNumber): number => {
    const decimals: number = 2;
    const exponent: number = totalSupply.toString().length - voteBalance.toString().length + 4;

    // @ts-ignore
    const div = voteBalance.times(Math.pow(10, exponent)).dividedBy(totalSupply) / Math.pow(10, exponent - decimals);

    return +Number(div).toFixed(2);
};

export const calculateApproval = (delegate: Wallet, burnedSupply: BigNumber, height: number = 1): number => {
    const totalSupply: BigNumber = calculateSupply(height).minus(burnedSupply);
    const voteBalance: BigNumber = delegate.getAttribute("delegate.voteBalance");

    return toDecimal(voteBalance, totalSupply);
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
    const forgedFees: BigNumber = BigNumber.make(delegate.forgedFees);
    const forgedRewards: BigNumber = BigNumber.make(delegate.forgedRewards);

    return forgedFees.plus(forgedRewards).toFixed();
};
