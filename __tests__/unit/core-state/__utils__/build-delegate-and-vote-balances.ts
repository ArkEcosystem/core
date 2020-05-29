import { CryptoSuite } from "@packages/core-crypto";
import { Wallet, WalletRepository } from "@packages/core-state/src/wallets";
import { SATOSHI } from "@packages/crypto/src/constants";

export const buildDelegateAndVoteWallets = (
    numberDelegates: number,
    walletRepo: WalletRepository,
    cryptoManager: CryptoSuite.CryptoManager,
): Wallet[] => {
    const delegates: Wallet[] = [];
    for (let i = 0; i < numberDelegates; i++) {
        const delegateKey = i.toString().repeat(66);
        const delegate = walletRepo.createWallet(cryptoManager.Identities.Address.fromPublicKey(delegateKey));
        delegate.publicKey = delegateKey;
        delegate.setAttribute("delegate.username", `delegate${i}`);
        delegate.setAttribute("delegate.voteBalance", cryptoManager.LibraryManager.Libraries.BigNumber.ZERO);

        const voter = walletRepo.createWallet(
            cryptoManager.Identities.Address.fromPublicKey((i + numberDelegates).toString().repeat(66)),
        );
        const totalBalance = cryptoManager.LibraryManager.Libraries.BigNumber.make(i + 1)
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
