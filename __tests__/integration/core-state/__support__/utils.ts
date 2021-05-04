import { Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

export const getExpectedVoteBalances = (
    walletRepository: Contracts.State.WalletRepository,
): Record<string, Utils.BigNumber> => {
    const expectedVoteBalances: Record<string, Utils.BigNumber> = {};

    for (const wallet of walletRepository.allByAddress()) {
        if (wallet.hasAttribute("vote")) {
            const publicKey = wallet.getAttribute("vote");
            const voteBalance = wallet
                .getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO)
                .plus(wallet.getBalance())
                .plus(expectedVoteBalances[publicKey] ?? Utils.BigNumber.ZERO);

            if (voteBalance.isZero()) {
                delete expectedVoteBalances[publicKey];
            } else {
                expectedVoteBalances[publicKey] = voteBalance;
            }
        }
    }

    return expectedVoteBalances;
};

export const getActualVoteBalances = (
    walletRepository: Contracts.State.WalletRepository,
): Record<string, Utils.BigNumber> => {
    const actualVoteBalances: Record<string, Utils.BigNumber> = {};

    for (const wallet of walletRepository.allByAddress()) {
        if (wallet.hasAttribute("delegate.voteBalance")) {
            const voteBalance = wallet.getAttribute("delegate.voteBalance");
            if (!voteBalance.isZero()) {
                AppUtils.assert.defined<string>(wallet.getPublicKey());
                actualVoteBalances[wallet.getPublicKey()!] = voteBalance;
            }
        }
    }

    return actualVoteBalances;
};
