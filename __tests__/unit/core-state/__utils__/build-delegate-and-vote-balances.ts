import { Wallet, WalletRepository } from "@packages/core-state/src/wallets";
import { Identities, Utils as CryptoUtils } from "@packages/crypto/src";
import { SATOSHI } from "@packages/crypto/src/constants";

export const buildDelegateAndVoteWallets = (numberDelegates: number, walletRepo: WalletRepository): Wallet[] => {
    const delegates: Wallet[] = [];
    const delegateKeys: string[] = [
        "02511f16ffb7b7e9afc12f04f317a11d9644e4be9eb5a5f64673946ad0f6336f34",
        "0259d9ca7922c277b0e7407a88703bbb98f5da43a335b0eefa6c4642f072acfe79",
        "03697abb61ee85e020a35a1d2701112e7e16477ac9d2eb2e8900a27995edc917a2",
        "027e2269d8a770343223bedc49bab31b3c52fb4c1df6627153e6374ac23e2d878b",
        "03858d4d3b77c7c227f6fe3e18b5807aa476828cb712663dcd79df87e439cc07c5",
    ];

    if (numberDelegates > delegateKeys.length) {
        throw new Error(`Number of Test Delegates (${numberDelegates}) should not exceed ${delegateKeys.length}`);
    }

    for (let i = 0; i < numberDelegates; i++) {
        const delegateKey = delegateKeys[i];
        const delegate = walletRepo.createWallet(Identities.Address.fromPublicKey(delegateKey));
        delegate.publicKey = delegateKey;
        delegate.setAttribute("delegate.username", `delegate${i}`);
        delegate.setAttribute("delegate.voteBalance", CryptoUtils.BigNumber.ZERO);

        const voter = walletRepo.createWallet(
            Identities.Address.fromPublicKey(delegateKeys[numberDelegates - 1 - i]),
        );
        const totalBalance = CryptoUtils.BigNumber.make(i + 1)
            .times(1000)
            .times(SATOSHI);
        voter.balance = totalBalance.div(2);
        voter.publicKey = `v${delegateKey}`;
        voter.setAttribute("vote", delegateKey);
        // TODO: is this correct?
        // that buildVoteBalances should only be triggered if there is a htlc lockedBalance?
        voter.setAttribute("htlc.lockedBalance", totalBalance.div(2));

        walletRepo.index([delegate, voter]);
        delegates.push(delegate as Wallet);
    }
    return delegates;
};
