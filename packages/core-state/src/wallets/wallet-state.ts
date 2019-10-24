import { app, Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";

// todo: ioc
// todo: review the implementation
@Container.injectable()
export class WalletState {
    private walletRepository!: Contracts.State.WalletRepository;

    public init(walletRepository: Contracts.State.WalletRepository): this {
        this.walletRepository = walletRepository;

        return this;
    }

    public loadActiveDelegateList(roundInfo: Contracts.Shared.RoundInfo): Contracts.State.Wallet[] {
        const delegates: Contracts.State.Wallet[] = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;

        if (delegates.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                    `This indicates an issue with the genesis block & delegates.`,
            );
        }

        app.log.debug(`Loaded ${delegates.length} active ${AppUtils.pluralize("delegate", delegates.length)}`);

        return delegates;
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of this.walletRepository.allByPublicKey()) {
            if (voter.hasVoted()) {
                const delegate: Contracts.State.Wallet = this.walletRepository.findByPublicKey(
                    voter.getAttribute("vote"),
                );

                const voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");

                if (voter.hasAttribute("htlc.lockedBalance")) {
                    delegate.setAttribute(
                        "delegate.voteBalance",
                        voteBalance.plus(voter.balance).plus(voter.getAttribute("htlc.lockedBalance")),
                    );
                }
            }
        }
    }

    public buildDelegateRanking(roundInfo?: Contracts.Shared.RoundInfo): Contracts.State.Wallet[] {
        const delegates: Contracts.State.Wallet[] = this.walletRepository
            .allByUsername()
            .filter((wallet: Contracts.State.Wallet) => !wallet.hasAttribute("delegate.resigned"));

        let delegateWallets = delegates
            .sort((a, b) => {
                const voteBalanceA: Utils.BigNumber = a.getAttribute("delegate.voteBalance");
                const voteBalanceB: Utils.BigNumber = b.getAttribute("delegate.voteBalance");

                const diff = voteBalanceB.comparedTo(voteBalanceA);
                if (diff === 0) {
                    const publicKeyA: string = AppUtils.assert.defined(a.publicKey);
                    const publicKeyB: string = AppUtils.assert.defined(b.publicKey);

                    if (publicKeyA === publicKeyB) {
                        throw new Error(
                            `The balance and public key of both delegates are identical! Delegate "${a.getAttribute(
                                "delegate.username",
                            )}" appears twice in the list.`,
                        );
                    }

                    return publicKeyA.localeCompare(publicKeyB, "en");
                }

                return diff;
            })
            .map(
                (delegate, i): Contracts.State.Wallet => {
                    const rank = i + 1;
                    delegate.setAttribute("delegate.rank", rank);
                    return delegate;
                },
            );

        if (roundInfo) {
            delegateWallets = delegateWallets.slice(0, roundInfo.maxDelegates);

            for (const delegate of delegateWallets) {
                delegate.setAttribute("delegate.round", roundInfo.round);
            }
        }

        return delegateWallets;
    }
}
